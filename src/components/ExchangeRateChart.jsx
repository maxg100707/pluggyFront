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

  // Busca dados históricos para o gráfico
  const fetchHistoricalData = async () => {
    setLoading(true);
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
      
      // Verifica se a resposta contém os dados esperados
      if (data.error) {
        throw new Error(data.message || 'Erro ao carregar dados históricos');
      }
      
      if (!data.timestamps || !data.sources || data.timestamps.length === 0 || Object.keys(data.sources).length === 0) {
        throw new Error('Dados históricos incompletos ou vazios');
      }
      
      // Formatar dados para o gráfico
      const formattedData = formatDataForChart(data);
      console.log('Dados formatados para o gráfico:', formattedData);
      
      if (formattedData.length === 0) {
        throw new Error('Não foi possível processar os dados históricos');
      }
      
      setChartData(formattedData);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar dados históricos:', err);
      setError(err.message);
      setChartData([]);
    } finally {
      setLoading(false);
    }
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
          
          if (sourceData && 
              Array.isArray(sourceData.buy_prices) && 
              Array.isArray(sourceData.sell_prices) && 
              index < sourceData.buy_prices.length && 
              index < sourceData.sell_prices.length) {
            
            const buyPrice = sourceData.buy_prices[index];
            const sellPrice = sourceData.sell_prices[index];
            
            if (!isNaN(buyPrice)) {
              entry[`${sourceName}_buy`] = buyPrice;
            }
            
            if (!isNaN(sellPrice)) {
              entry[`${sourceName}_sell`] = sellPrice;
            }
          } else {
            console.warn(`Dados incompletos para fonte ${sourceName} no índice ${index}`);
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
  const lineColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe'];

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
    if (period === '24h' || period === '12h') {
      return tickItem; // Apenas a hora
    } else {
      // Para períodos mais longos, incluir a data
      return item?.date ? `${tickItem} (${item.date.substring(0, 5)})` : tickItem;
    }
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
        <div className="chart-error">
          <p>Erro ao carregar dados do gráfico: {error}</p>
          <button onClick={fetchHistoricalData}>Tentar novamente</button>
        </div>
      ) : loading ? (
        <div className="chart-loading">Carregando gráfico...</div>
      ) : chartData.length === 0 ? (
        <div className="chart-no-data">
          <p>Nenhum dado disponível para o gráfico.</p>
          <button onClick={fetchHistoricalData}>Tentar novamente</button>
          {apiResponse && (
            <details>
              <summary>Detalhes da resposta (debug)</summary>
              <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
            </details>
          )}
        </div>
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
      )}
      
      <div className="chart-note">
        <p>
          {period === '24h' ? 'Dados históricos dos últimos dias' : 
           period === '12h' ? 'Dados históricos das últimas 12 horas' :
           period === '6h' ? 'Dados históricos das últimas 6 horas' :
           'Dados históricos da última hora'}
        </p>
      </div>
    </div>
  );
};

export default ExchangeRateChart;
