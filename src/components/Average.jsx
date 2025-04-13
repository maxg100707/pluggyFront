import React, { useEffect, useState } from 'react';

const backendUrl = "https://pluggy.onrender.com"; // Substitua conforme necessário

const Average = ({ trigger, country }) => {
  const [average, setAverage] = useState(null);
  const [error, setError] = useState(null);

  const fetchAverage = async () => {
    try {
      const response = await fetch(`${backendUrl}/average?country=${country}`, {
        headers: {
          'country': country
        }
      });
      if (!response.ok) {
        throw new Error(`Erro: ${response.statusText}`);
      }
      const data = await response.json();
      setAverage(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      setAverage(null);
    }
  };

  useEffect(() => {
    fetchAverage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, country]);

  // Determina o símbolo da moeda com base no país
  const currencySymbol = country === 'argentina' ? 'ARS' : 'BRL';

  return (
    <div className="card">
      <h2>Média de Cotação (Average)</h2>
      {error ? (
        <p>Erro ao carregar média: {error}</p>
      ) : average ? (
        <div>
          <p><strong>Média de Compra:</strong> {average.average_buy_price} {currencySymbol}</p>
          <p><strong>Média de Venda:</strong> {average.average_sell_price} {currencySymbol}</p>
        </div>
      ) : (
        <p>Carregando...</p>
      )}
    </div>
  );
};

export default Average;
