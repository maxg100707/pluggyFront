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

  // Busca dados históricos para o gráfico
  const fetchHistoricalData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${backendUrl}/historical?country=${country}&period=${period}`, 
        { headers: { 'country': country } }
      );
      
      if (!response.ok) {
        throw new Error(`Erro: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Formatar dados para o gráfico
      const formattedData = formatDataForChart(data);
      
      setChartData(formattedData);
      setError(null);
    } catch (err) {
      setError(err.message);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  // Formata os dados recebidos da API para o formato esperado pelo Recharts
  const formatDataForChart = (data) => {
    const { timestamps, sources } = data;
    
    // Cria um array de objetos para o gráfico
    return timestamps.map((timestamp, index) => {
      const entry = {
        time: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date(timestamp).getTime(),
      };
      
      // Adiciona dados de cada fonte
      Object.keys(sources).forEach(sourceName => {
        entry[`${sourceName}_buy`] = sources[sourceName].buy_prices[index];
        entry[`${sourceName}_sell`] = sources[sourceName].sell_prices[index];
      });
      
      return entry;
    });
  };

  useEffect(() => {
    fetchHistoricalData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, country, period]);

  // Cores para cada linha do gráfico
  const lineColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe'];

  // Determina quais propriedades mostrar com base no modo de visualização
  const getVisibleProperties = () => {
    if (!chartData.length) return [];
    
    const firstEntry = chartData[0];
    return Object.keys(firstEntry)
      .filter(key => key.includes(viewMode === 'buy' ? '_buy' : '_sell') && key !== 'time' && key !== 'timestamp');
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
                {entry.name.split('_')[0]}: {entry.value.toFixed(2)} {currencySymbol}
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
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
      
      {error ? (
        <p>Erro ao carregar dados do gráfico: {error}</p>
      ) : loading ? (
        <div className="chart-loading">Carregando gráfico...</div>
      ) : chartData.length === 0 ? (
        <p>Nenhum dado disponível para o gráfico.</p>
      ) : (
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => value}
              />
              <YAxis 
                domain={['auto', 'auto']}
                tick={{ fontSize: 12 }}
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
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      
      <div className="chart-note">
        <p>Dados históricos atualizados a cada 30 minutos</p>
      </div>
    </div>
  );
};

export default ExchangeRateChart;
