import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const backendUrl = "https://pluggy.onrender.com";

const ExchangeRateChart = ({ trigger, country }) => {
  const [chartData, setChartData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('buy'); // 'buy' ou 'sell'
  const [period, setPeriod] = useState('24h');
  const [apiResponse, setApiResponse] = useState(null); // Para depuração
  const [isApproximatedData, setIsApproximatedData] = useState(false);

  // Busca dados históricos para o gráfico
  const fetchHistoricalData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log(`Buscando dados históricos: ${backendUrl}/historical?country=${country}&period=${period}`);
      
      const response = await fetch(
        `${backendUrl}/historical?country=${country}&period=${period}`, 
        { headers: { 'country': country } }
      );
      
      if (!response.ok) {
        throw new Error(`Erro: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setApiResponse(data); // Salva resposta para depuração
      
      console.log('Resposta da API histórica:', data);
      
      // Verifica se a resposta indica erro explícito
      if (data.error) {
        throw new Error(data.message || 'Erro ao carregar dados históricos');
      }
      
      // Verifica se os dados estão no formato esperado
      if (!data.timestamps || !data.sources || data.timestamps.length === 0 || Object.keys(data.sources).length === 0) {
        throw new Error('Dados históricos incompletos ou vazios');
      }
      
      // Define se os dados são aproximados
      setIsApproximatedData(data.isApproximated === true);
      
      // Normaliza os dados antes de formatar para o gráfico
      const normalizedData = normalizeHistoricalData(data);
      
      // Formatar dados para o gráfico
      const formattedData = formatDataForChart(normalizedData);
      console.log('Dados formatados para o gráfico:', formattedData);
      
      if (formattedData.length === 0) {
        throw new Error('Não foi possível processar os dados históricos');
      }
      
      setChartData(formattedData);
    } catch (err) {
      console.error('Erro ao buscar dados históricos:', err);
      setError(err.message);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  // Normaliza os dados históricos para garantir consistência
  const normalizeHistoricalData = (data) => {
    const { timestamps, sources } = data;
    const normalizedSources = {};
    
    // Para cada fonte
    Object.keys(sources).forEach(sourceName => {
      const sourceData = sources[sourceName];
      
      // Cria arrays com o mesmo comprimento do array de timestamps
      const buy_prices = new Array(timestamps.length).fill(null);
      const sell_prices = new Array(timestamps.length).fill(null);
      
      // Preenche com os valores disponíveis
      for (let i = 0; i < timestamps.length; i++) {
        // Se o valor existe e é válido, usamos ele
        if (sourceData.buy_prices && i < sourceData.buy_prices.length && !isNaN(sourceData.buy_prices[i])) {
          buy_prices[i] = sourceData.buy_prices[i];
        } 
        // Caso contrário, tentamos usar o valor anterior
        else if (i > 0 && buy_prices[i-1] !== null) {
          buy_prices[i] = buy_prices[i-1];
        }
        
        // Mesmo processo para os preços de venda
        if (sourceData.sell_prices && i < sourceData.sell_prices.length && !isNaN(sourceData.sell_prices[i])) {
          sell_prices[i] = sourceData.sell_prices[i];
        }
        else if (i > 0 && sell_prices[i-1] !== null) {
          sell_prices[i] = sell_prices[i-1];
        }
      }
      
      normalizedSources[sourceName] = {
        buy_prices,
        sell_prices
      };
    });
    
    return {
      timestamps,
      sources: normalizedSources
    };
  };

  // Formata os dados recebidos da API para o formato esperado pelo Recharts
  const formatDataForChart = (data) => {
    try {
      const { timestamps, sources } = data;
      
      // Verificação adicional para garantir que temos dados válidos
      if (!Array.isArray(timestamps) || timestamps.length === 0) {
        console.error('Timestamps inválidos:', timestamps);
        return [];
      }
      
      if (!sources || Object.keys(sources).length === 0) {
        console.error('Fontes inválidas:', sources);
        return [];
      }
      
      // Cria um array de objetos para o gráfico
      return timestamps.map((timestamp, index) => {
        // Garantir que o timestamp é válido
        let validTimestamp;
        try {
          // Tenta converter o timestamp para um objeto Date
          validTimestamp = new Date(timestamp);
          
          // Verifica se a data é válida
          if (isNaN(validTimestamp.getTime())) {
            console.warn(`Timestamp inválido no índice ${index}:`, timestamp);
            validTimestamp = new Date(); // Usar data atual como fallback
          }
        } catch (e) {
          console.warn(`Erro ao converter timestamp no índice ${index}:`, e);
          validTimestamp = new Date(); // Usar data atual como fallback
        }
        
        const entry = {
          time: validTimestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: validTimestamp.getTime(),
          date: validTimestamp.toLocaleDateString(),
        };
        
        // Adiciona dados de cada fonte
        Object.keys(sources).forEach(sourceName => {
          const sourceData = sources[sourceName];
          
          // Adiciona preços de compra/venda se disponíveis
          if (sourceData.buy_prices[index] !== null) {
            entry[`${sourceName}_buy`] = sourceData.buy_prices[index];
          }
          
          if (sourceData.sell_prices[index] !== null) {
            entry[`${sourceName}_sell`] = sourceData.sell_prices[index];
          }
        });
        
        return entry;
      });
    } catch (err) {
      console.error('Erro ao formatar dados do gráfico:', err);
      return [];
    }
  };

  useEffect(() => {
    fetchHistoricalData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, country, period]);

  // Cores para cada linha do gráfico
  const lineColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#ff6b81', '#36a2eb'];

  // Determina quais propriedades mostrar com base no modo de visualização
  const getVisibleProperties = () => {
    if (!chartData.length) return [];
    
    const firstEntry = chartData[0];
    return Object.keys(firstEntry)
      .filter(key => key.includes(viewMode === 'buy' ? '_buy' : '_sell') && key !== 'time' && key !== 'timestamp' && key !== 'date');
  };

  // Formata o tooltip para mostrar valores com símbolo da moeda
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const currencySymbol = country === 'argentina' ? 'ARS' : 'BRL';
      
      return (
        <div className="custom-tooltip">
          <p className="tooltip-time">{label}</p>
          <div className="tooltip-items">
            {payload.map((entry, index) => (
              <p key={index} style={{ color: entry.color }}>
                {entry.name.split('_')[0]}: {entry.value ? entry.value.toFixed(2) : 'N/A'} {currencySymbol}
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Formata os ticks do eixo X para mostrar data/hora
  const formatXAxis = (tickItem) => {
    // Encontrar o item correspondente nos dados para obter a data
    const item = chartData.find(d => d.time === tickItem);
    
    // Formatação personalizada baseada no período
    if (period === '1h' || period === '6h') {
      return tickItem; // Apenas a hora
    } else {
      // Para períodos mais longos, incluir a data se disponível
      return item && item.date ? `${tickItem}` : tickItem;
    }
  };
  
  // Renderização condicional para o status do gráfico
  const renderChartStatus = () => {
    if (error) {
      return (
        <div className="chart-error">
          <p>Erro ao carregar dados do gráfico: {error}</p>
          <button onClick={fetchHistoricalData} className="retry-button">
            Tentar novamente
          </button>
        </div>
      );
    }
    
    if (loading) {
      return <div className="chart-loading">Carregando gráfico...</div>;
    }
    
    if (chartData.length === 0) {
      return (
        <div className="chart-no-data">
          <p>Nenhum dado disponível para o gráfico.</p>
          <button onClick={fetchHistoricalData} className="retry-button">
            Tentar novamente
          </button>
          {apiResponse && (
            <details>
              <summary>Detalhes da resposta (debug)</summary>
              <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
            </details>
          )}
        </div>
      );
    }
    
    return (
      <>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 11 }}
                tickFormatter={formatXAxis}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={['auto', 'auto']}
                tick={{ fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {getVisibleProperties().map((prop, index) => (
                <Line
                  key={prop}
                  type="monotone"
                  dataKey={prop}
                  name={prop.split('_')[0]}
                  stroke={lineColors[index % lineColors.length]}
                  activeDot={{ r: 8 }}
                  dot={{ r: 3 }}
                  connectNulls={true}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {isApproximatedData && (
          <div className="approximated-data-notice">
            <p>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{marginRight: '5px'}}>
                <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
              </svg>
              Os dados exibidos são uma aproximação baseada nas cotações atuais.
              As APIs de dados históricos não estão disponíveis no momento.
            </p>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="card chart-card">
      <h2>Evolução das Cotações</h2>
      
      <div className="chart-controls">
        <div className="period-selector">
          <button 
            className={period === '1h' ? 'active' : ''} 
            onClick={() => setPeriod('1h')}
          >
            1h
          </button>
          <button 
            className={period === '6h' ? 'active' : ''} 
            onClick={() => setPeriod('6h')}
          >
            6h
          </button>
          <button 
            className={period === '12h' ? 'active' : ''} 
            onClick={() => setPeriod('12h')}
          >
            12h
          </button>
          <button 
            className={period === '24h' ? 'active' : ''} 
            onClick={() => setPeriod('24h')}
          >
            24h
          </button>
        </div>
        
        <div className="view-selector">
          <button 
            className={viewMode === 'buy' ? 'active' : ''} 
            onClick={() => setViewMode('buy')}
          >
            Compra
          </button>
          <button 
            className={viewMode === 'sell' ? 'active' : ''} 
            onClick={() => setViewMode('sell')}
          >
            Venda
          </button>
        </div>
      </div>
      
      {renderChartStatus()}
      
      <div className="chart-note">
        <p>
          {period === '1h' ? 'Dados da última hora' : 
           period === '6h' ? 'Dados das últimas 6 horas' :
           period === '12h' ? 'Dados das últimas 12 horas' :
           'Dados das últimas 24 horas'}
        </p>
      </div>
      
      <style jsx>{`
        .chart-card {
          background: #fff;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }
        
        .chart-controls {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        
        .period-selector, .view-selector {
          display: flex;
          gap: 8px;
        }
        
        button {
          background: #f0f0f0;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }
        
        button:hover {
          background: #e8e8e8;
        }
        
        button.active {
          background: #4c7daf;
          color: white;
          border-color: #3a6186;
        }
        
        .chart-loading, .chart-error, .chart-no-data {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 300px;
          background: #f9f9f9;
          border-radius: 8px;
          color: #666;
        }
        
        .chart-error {
          color: #d32f2f;
        }
        
        .retry-button {
          margin-top: 10px;
          background: #4c7daf;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .retry-button:hover {
          background: #3a6186;
        }
        
        .chart-note {
          text-align: center;
          color: #666;
          font-size: 0.85rem;
          margin-top: 10px;
        }
        
        .custom-tooltip {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid #ccc;
          border-radius: 4px;
          padding: 10px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .tooltip-time {
          margin: 0 0 5px 0;
          font-weight: bold;
          border-bottom: 1px solid #eee;
          padding-bottom: 5px;
        }
        
        .tooltip-items p {
          margin: 3px 0;
        }
        
        .approximated-data-notice {
          background: #fff3cd;
          color: #856404;
          padding: 10px 15px;
          border-radius: 4px;
          margin-top: 10px;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
        }
        
        .approximated-data-notice svg {
          margin-right: 8px;
        }
        
        details {
          margin-top: 15px;
          width: 100%;
          max-width: 500px;
        }
        
        details summary {
          cursor: pointer;
          color: #4c7daf;
        }
        
        details pre {
          background: #f5f5f5;
          padding: 10px;
          border-radius: 4px;
          overflow: auto;
          max-height: 300px;
          margin-top: 10px;
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
};

export default ExchangeRateChart;
