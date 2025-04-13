import React, { useEffect, useState } from 'react';

const backendUrl = "https://pluggy.onrender.com"; // Substitua pela URL do seu backend

const Quotes = ({ trigger }) => {
  const [quotes, setQuotes] = useState([]);
  const [error, setError] = useState(null);

  const fetchQuotes = async () => {
    try {
      const response = await fetch(`${backendUrl}/quotes`);
      if (!response.ok) {
        throw new Error(`Erro: ${response.statusText}`);
      }
      const data = await response.json();
      setQuotes(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      setQuotes([]);
    }
  };

  useEffect(() => {
    fetchQuotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  return (
    <div className="card">
      <h2>Cotações (Quotes)</h2>
      {error ? (
        <p>Erro ao carregar cotações: {error}</p>
      ) : (
        quotes.map((q, index) => (
          <div key={index}>
            <p><strong>Fonte:</strong> {q.source}</p>
            <p><strong>Compra:</strong> {q.buy_price} | <strong>Venda:</strong> {q.sell_price}</p>
            <hr />
          </div>
        ))
      )}
    </div>
  );
};

export default Quotes;
