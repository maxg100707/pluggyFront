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
      const response = await fetch(`${backendUrl}/news?country=${country}`, {
        headers: { 'country': country }
      });
      
      if (!response.ok) {
        throw new Error(`Erro: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Verificamos se as URLs são válidas e substituímos se necessário
      const processedData = data.map(item => ({
        ...item,
        // Se a URL for '#' ou inválida, substituímos por uma URL padrão
        url: (item.url && item.url !== '#') 
          ? item.url 
          : country.toLowerCase() === 'brazil'
            ? 'https://www.infomoney.com.br/economia/'
            : 'https://www.clarin.com/economia/'
      }));
      
      setNews(processedData);
      setError(null);
    } catch (err) {
      setError(err.message);
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, country]);

  // Formata a data de publicação
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Alterna a expansão de uma notícia
  const toggleExpand = (index) => {
    setExpandedNews(expandedNews === index ? null : index);
  };
  
  // Função para abrir a URL em uma nova janela
  const openNewsUrl = (url, e) => {
    e.stopPropagation(); // Impede a propagação do evento
    
    // Verificamos e corrigimos a URL se necessário
    let validUrl = url;
    if (!url || url === '#') {
      validUrl = country.toLowerCase() === 'brazil'
        ? 'https://www.infomoney.com.br/economia/'
        : 'https://www.clarin.com/economia/';
    }
    
    // Abrimos a URL em uma nova janela
    window.open(validUrl, '_blank', 'noopener,noreferrer');
    
    console.log('Abrindo URL:', validUrl); // Debug
  };

  return (
    <div className="card news-card">
      <h2>Notícias Econômicas</h2>
      <p className="news-subtitle">
        Fique por dentro dos fatores que podem estar influenciando as taxas de câmbio
      </p>
      
      {error ? (
        <p>Erro ao carregar notícias: {error}</p>
      ) : loading ? (
        <div className="news-loading">Carregando notícias econômicas...</div>
      ) : news.length === 0 ? (
        <p>Nenhuma notícia disponível no momento.</p>
      ) : (
        <div className="news-list">
          {news.map((item, index) => (
            <div key={index} className={`news-item ${expandedNews === index ? 'expanded' : ''}`}>
              {/* Área clicável para expandir/colapsar */}
              <div className="news-header" onClick={() => toggleExpand(index)}>
                {item.imageUrl && (
                  <div className="news-image">
                    <img src={item.imageUrl} alt={item.title} />
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
                  <p className="news-description">{item.description}</p>
                  
                  {/* Substituímos o link por um botão com handler explícito */}
                  <button 
                    className="news-link-button"
                    onClick={(e) => openNewsUrl(item.url, e)}
                  >
                    Ler matéria completa
                  </button>
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
