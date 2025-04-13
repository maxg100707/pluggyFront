import React, { useEffect, useState } from 'react';

const backendUrl = "https://pluggy.onrender.com";

const Slippage = ({ trigger, country }) => {
  const [slippageData, setSlippageData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSlippage = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/slippage?country=${country}`, {
        headers: {
          'country': country
        }
      });
      if (!response.ok) {
        throw new Error(`Erro: ${response.statusText}`);
      }
      const data = await response.json();
      setSlippageData(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      setSlippageData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlippage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, country]);

  // Formata a porcentagem para exibição
  const formatPercentage = (value) => {
    const percentage = (value * 100).toFixed(2);
    return `${percentage}%`;
  };

  return (
    <div className="card">
      <h2>Slippage (Variação da Média)</h2>
      {error ? (
        <p>Erro ao carregar slippage: {error}</p>
      ) : loading ? (
        <p>Carregando dados de slippage...</p>
      ) : slippageData.length === 0 ? (
        <p>Nenhum dado de slippage disponível.</p>
      ) : (
        slippageData.map((s, index) => (
          <div key={index} className="slippage-item">
            <p><strong>Fonte:</strong> {s.source}</p>
            <p>
              <strong>Slippage Compra:</strong> {formatPercentage(s.buy_price_slippage)} | 
              <strong>Slippage Venda:</strong> {formatPercentage(s.sell_price_slippage)}
            </p>
            <hr />
          </div>
        ))
      )}
    </div>
  );
};

export default Slippage;
