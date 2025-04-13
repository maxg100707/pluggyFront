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

  // Busca dados para o gráfico
  const fetchChartData = async () => {
    setLoading(true);
    try {
      // Buscar cotações atuais
      const response = await fetch(`${backendUrl}/quotes?country=${country}`, {
        headers: { 'country': country }
      });
      
      if (!response.ok) {
        throw new Error(`Erro: ${response.statusText}`);
      }
      
      const quotesData = await response.json();
      
      // Gerar dados históricos simulados baseados nas cotações atuais
      // (em um cenário real, você buscaria dados históricos de uma API)
      const historicalData = generateHistoricalData(quotesData);
      
      setChartData(historicalData);
      setError(null);
    } catch (err) {
      setError(err.message);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  // Gera dados históricos simulados para demonstração
  const generateHistoricalData = (quotes) => {
    // Obtém as últimas 24 horas em intervalos de 1 hora
    const hours = 24;
    const data = [];
    
    for (let i = hours; i >= 0; i--) {
      const time = new Date();
      time.setHours(time.getHours() - i);
      
      const entry = {
        time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: time.getTime()
      };
      
      // Para cada fonte, gera um valor histórico simulado
      quotes.forEach(quote => {
        const sourceName = getSourceName(quote.source);
        
        // Simula variação aleatória em torno do valor atual (±3%)
        const randomFactor = 0.97 + (Math.random() * 0.06);
        
        entry[`${sourceName}_buy`] = parseFloat((quote.buy_price * randomFactor).toFixed(4));
        entry[`${sourceName}_sell`] = parseFloat((quote.sell_price * randomFactor).toFixed(4));
      });
      
      data.push(entry);
    }
    
    return data;
  };

  // Extrai um nome curto da fonte para usar no gráfico
  const getSourceName = (sourceUrl) => {
    try {
      // Extrai o domínio da URL
      const domain = new URL(sourceUrl).hostname;
      // Pega a parte principal do domínio (ex: 'wise' de 'wise.com')
      return domain.split('.')[0];
    } catch (e) {
      // Fallback para URLs inválidas
      return sourceUrl.substring(0, 10);
    }
  };

  useEffect(() => {
    fetchChartData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, country]);

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
        <p>* Dados históricos simulados para demonstração</p>
      </div>
    </div>
  );
};

export default ExchangeRateChart;
