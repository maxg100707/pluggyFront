import React, { useState, useEffect } from 'react';

const backendUrl = "https://pluggy.onrender.com";

const EconomicNews = ({ trigger, country }) => {
  const [news, setNews] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedNews, setExpandedNews] = useState(null);

  const fetchNews = async () => {
    setLoading(true);
    try {
      console.log(`Buscando notícias para ${country}...`);
      
      // Tentar buscar notícias do backend
      const response = await fetch(`${backendUrl}/news?country=${country}`, {
        headers: { 'country': country }
      });
      
      if (!response.ok) {
        throw new Error(`Erro: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data || data.length === 0) {
        throw new Error('Nenhuma notícia disponível');
      }
      
      console.log(`Recebidas ${data.length} notícias`);
      setNews(data);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar notícias:', err);
      setError(err.message);
      
      // Se falhar, tentar buscar diretamente de uma API pública alternativa
      try {
        console.log('Tentando API alternativa...');
        
        // Usar uma API pública de notícias como fallback
        const altUrl = country.toLowerCase() === 'brazil'
          ? 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fg1.globo.com%2Frss%2Fg1%2Feconomia%2F'
          : 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.clarin.com%2Frss%2Feconomia%2F';
        
        const altResponse = await fetch(altUrl);
        
        if (!altResponse.ok) {
          throw new Error('API alternativa também falhou');
        }
        
        const altData = await altResponse.json();
        
        if (altData && altData.items && altData.items.length > 0) {
          // Mapear para o formato esperado
          const mappedNews = altData.items.map(item => ({
            title: item.title,
            source: altData.feed.title,
            url: item.link,
            publishedAt: item.pubDate,
            description: item.description ? stripHtml(item.description) : '',
            imageUrl: item.enclosure ? item.enclosure.link : item.thumbnail
          }));
          
          console.log(`Recebidas ${mappedNews.length} notícias da API alternativa`);
          setNews(mappedNews);
          setError(null);
        } else {
          throw new Error('Nenhuma notícia encontrada na API alternativa');
        }
      } catch (altErr) {
        console.error('Erro na API alternativa:', altErr);
        setError('Não foi possível carregar notícias. Tente novamente mais tarde.');
        setNews([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, country]);

  // Remove tags HTML de uma string
  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<\/?[^>]+(>|$)/g, '').trim();
  };

  // Formata a data de publicação
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateString;
    }
  };

  // Alterna a expansão de uma notícia
  const toggleExpand = (index) => {
    setExpandedNews(expandedNews === index ? null : index);
  };
  
  // Função para abrir a URL em uma nova janela
  const openNewsUrl = (url, e) => {
    e.stopPropagation(); // Impede a propagação do evento
    
    // Verificamos se a URL é válida
    if (!url || url === '#') {
      console.error('URL inválida:', url);
      alert('Link para a notícia não disponível');
      return;
    }
    
    // Abrimos a URL em uma nova janela
    window.open(url, '_blank', 'noopener,noreferrer');
    console.log('Abrindo URL:', url);
  };

  // Função para verificar se uma URL é válida
  const isValidUrl = (url) => {
    try {
      new URL(url);
      return url !== '#';
    } catch (e) {
      return false;
    }
  };

  return (
    <div className="card news-card">
      <h2>Notícias Econômicas</h2>
      <p className="news-subtitle">
        Fique por dentro dos fatores que podem estar influenciando as taxas de câmbio
      </p>
      
      {error ? (
        <div className="news-error">
          <p>{error}</p>
          <button className="news-retry-button" onClick={fetchNews}>
            Tentar novamente
          </button>
        </div>
      ) : loading ? (
        <div className="news-loading">Carregando notícias econômicas...</div>
      ) : news.length === 0 ? (
        <div className="news-empty">
          <p>Nenhuma notícia disponível no momento.</p>
          <button className="news-retry-button" onClick={fetchNews}>
            Tentar novamente
          </button>
        </div>
      ) : (
        <div className="news-list">
          {news.map((item, index) => (
            <div key={index} className={`news-item ${expandedNews === index ? 'expanded' : ''}`}>
              {/* Área clicável para expandir/colapsar */}
              <div className="news-header" onClick={() => toggleExpand(index)}>
                {item.imageUrl && (
                  <div className="news-image">
                    <img 
                      src={item.imageUrl} 
                      alt={item.title}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/300x200?text=Notícia';
                      }}
                    />
                  </div>
                )}
                <div className="news-info">
                  <h3 className="news-title">{item.title}</h3>
                  <div className="news-meta">
                    <span className="news-source">{item.source}</span>
                    <span className="news-date">{formatDate(item.publishedAt)}</span>
                  </div>
                </div>
              </div>
              
              {/* Conteúdo expandido */}
              {expandedNews === index && (
                <div className="news-content">
                  <p className="news-description">{item.description || 'Sem descrição disponível'}</p>
                  
                  {isValidUrl(item.url) && (
                    <button 
                      className="news-link-button"
                      onClick={(e) => openNewsUrl(item.url, e)}
                    >
                      Ler matéria completa
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EconomicNews;
