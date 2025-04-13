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
      setNews(data);
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
            <div 
              key={index} 
              className={`news-item ${expandedNews === index ? 'expanded' : ''}`}
              onClick={() => toggleExpand(index)}
            >
              <div className="news-header">
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
              
              {expandedNews === index && (
                <div className="news-content">
                  <p className="news-description">{item.description}</p>
<a 
  href={item.url} 
   
  rel="noopener noreferrer" 
  className="news-link"
  onClick={(e) => {
    e.stopPropagation();  // Impede que o clique chegue ao container pai
    e.preventDefault();   // Impede o comportamento padrão do link
    window.open(item.url, '_blank'); // Abre o link em uma nova aba manualmente
  }}
>
  Ler matéria completa
</a>
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
