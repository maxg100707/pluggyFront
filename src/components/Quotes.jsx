import React, { useEffect, useState } from 'react';

const backendUrl = "https://pluggy.onrender.com";

const Quotes = ({ trigger, country }) => {
  const [quotes, setQuotes] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/quotes?country=${country}`, {
        headers: {
          'country': country
        }
      });
      if (!response.ok) {
        throw new Error(`Erro: ${response.statusText}`);
      }
      const data = await response.json();
      setQuotes(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, country]);

  // Determina o símbolo da moeda com base no país
  const currencySymbol = country === 'argentina' ? 'ARS' : 'BRL';

  return (
    <div className="card">
      <h2>Cotações USD/{currencySymbol}</h2>
      {error ? (
        <p>Erro ao carregar cotações: {error}</p>
      ) : loading ? (
        <p>Carregando cotações...</p>
      ) : quotes.length === 0 ? (
        <p>Nenhuma cotação disponível no momento.</p>
      ) : (
        quotes.map((q, index) => (
          <div key={index} className="quote-item">
            <p><strong>Fonte:</strong> {q.source}</p>
            <p>
              <strong>Compra:</strong> {q.buy_price} {currencySymbol} | 
              <strong>Venda:</strong> {q.sell_price} {currencySymbol}
            </p>
            <hr />
          </div>
        ))
      )}
    </div>
  );
};

export default Quotes;
