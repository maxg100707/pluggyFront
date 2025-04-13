import React, { useEffect, useState } from 'react';

const backendUrl = "https://pluggy.onrender.com"; // Substitua conforme necessário

const Slippage = ({ trigger }) => {
  const [slippageData, setSlippageData] = useState([]);
  const [error, setError] = useState(null);

  const fetchSlippage = async () => {
    try {
      const response = await fetch(`${backendUrl}/slippage`);
      if (!response.ok) {
        throw new Error(`Erro: ${response.statusText}`);
      }
      const data = await response.json();
      setSlippageData(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      setSlippageData([]);
    }
  };

  useEffect(() => {
    fetchSlippage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  return (
    <div className="card">
      <h2>Slippage</h2>
      {error ? (
        <p>Erro ao carregar slippage: {error}</p>
      ) : (
        slippageData.map((s, index) => (
          <div key={index}>
            <p><strong>Fonte:</strong> {s.source}</p>
            <p>
              <strong>Slippage Compra:</strong> {s.buy_price_slippage} | 
              <strong>Slippage Venda:</strong> {s.sell_price_slippage}
            </p>
            <hr />
          </div>
        ))
      )}
    </div>
  );
};

export default Slippage;
