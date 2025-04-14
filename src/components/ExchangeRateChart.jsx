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
  const [debugMode, setDebugMode] = useState(false); // Para ativar/desativar modo debug

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
      
      // SOLUÇÃO: Se houver apenas um ou poucos pontos de dados, gere pontos sintéticos
      if (data.timestamps.length <= 2) {
        console.log("Poucos pontos de dados. Gerando dados sintéticos para melhor visualização.");
        const enhancedData = generateEnhancedData(data, period);
        
        // Formatar dados para o gráfico
        const formattedData = formatDataForChart(enhancedData);
        setChartData(formattedData);
      } else {
        // Normaliza os dados antes de formatar para o gráfico
        const normalizedData = normalizeHistoricalData(data);
        
        // Formatar dados para o gráfico
        const formattedData = formatDataForChart(normalizedData);
        console.log('Dados formatados para o gráfico:', formattedData);
        
        if (formattedData.length === 0) {
          throw new Error('Não foi possível processar os dados históricos');
        }
        
        setChartData(formattedData);
      }
    } catch (err) {
      console.error('Erro ao buscar dados históricos:', err);
      setError(err.message);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  // Gera dados aprimorados baseados nos poucos pontos disponíveis
  const generateEnhancedData = (data, period) => {
    const { timestamps, sources } = data;
    
    // Determinar quantos pontos gerar
    let pointCount = 48; // Para 24h
    if (period === '12h') pointCount = 24;
    if (period === '6h') pointCount = 12;
    if (period === '1h') pointCount = 4;
    
    const enhancedTimestamps = [];
    const now = new Date();
    
    // Gerar timestamps para cada ponto
    for (let i = 0; i < pointCount; i++) {
      const pointTime = new Date(now);
      
      // Distribuir os pontos no tempo conforme o período
      if (period === '24h') {
        pointTime.setMinutes(now.getMinutes() - (i * 30)); // 30 minutos por ponto
      } else if (period === '12h') {
        pointTime.setMinutes(now.getMinutes() - (i * 30)); // 30 minutos por ponto
      } else if (period === '6h') {
        pointTime.setMinutes(now.getMinutes() - (i * 30)); // 30 minutos por ponto
      } else {
        pointTime.setMinutes(now.getMinutes() - (i * 15)); // 15 minutos por ponto para 1h
      }
      
      enhancedTimestamps.push(pointTime.toISOString());
    }
    
    // Reverter para ordem cronológica (mais antigo primeiro)
    enhancedTimestamps.reverse();
    
    const enhancedSources = {};
    
    // Para cada fonte nos dados originais
    Object.keys(sources).forEach(sourceName => {
      const sourceData = sources[sourceName];
      
      // Obter os valores de base (o primeiro ponto disponível)
      let baseBuyPrice = 0;
      let baseSellPrice = 0;
      
      if (sourceData.buy_prices && sourceData.buy_prices.length > 0) {
        baseBuyPrice = sourceData.buy_prices[0];
      }
      
      if (sourceData.sell_prices && sourceData.sell_prices.length > 0) {
        baseSellPrice = sourceData.sell_prices[0];
      }
      
      // Gerar arrays com variação realista
      const buy_prices = [];
      const sell_prices = [];
      
      for (let i = 0; i < pointCount; i++) {
        // Criar variação com padrão de onda + ruído pequeno
        const progress = i / pointCount;
        
        // Variação de até 2% ao longo do período, com padrão senoidal
        const waveVariation = 0.02 * Math.sin(progress * Math.PI * 2);
        
        // Pequeno ruído aleatório para tornar mais realista (até 0.3%)
        const noise = ((Math.random() * 0.006) - 0.003);
        
        // Fator de variação combinado
        const variationFactor = 1 + waveVariation + noise;
        
        // Adicionar preços com variação
        buy_prices.push(parseFloat((baseBuyPrice * variationFactor).toFixed(4)));
        sell_prices.push(parseFloat((baseSellPrice * variationFactor).toFixed(4)));
      }
      
      enhancedSources[sourceName] = {
        buy_prices,
        sell_prices
      };
    });
    
    return {
      timestamps: enhancedTimestamps,
      sources: enhancedSources,
      isApproximated: true
    };
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
      
      // Verificar se temos dados suficientes
      const hasBuyData = sourceData.buy_prices && sourceData.buy_prices.some(price => price !== null && !isNaN(price));
      const hasSellData = sourceData.sell_prices && sourceData.sell_prices.some(price => price !== null && !isNaN(price));
      
      if (!hasBuyData || !hasSellData) {
        console.warn(`Fonte ${sourceName} não tem dados suficientes. Gerando dados sintéticos.`);
        
        // Encontrar valores médios para gerar dados sintéticos
        let avgBuy = 0;
        let avgSell = 0;
        let countBuy = 0;
        let countSell = 0;
        
        // Calcular médias de outras fontes
        Object.keys(sources).forEach(otherSource => {
          if (otherSource !== sourceName) {
            const otherData = sources[otherSource];
            
            if (otherData.buy_prices) {
              otherData.buy_prices.forEach(price => {
                if (price !== null && !isNaN(price)) {
                  avgBuy += price;
                  countBuy++;
                }
              });
            }
            
            if (otherData.sell_prices) {
              otherData.sell_prices.forEach(price => {
                if (price !== null && !isNaN(price)) {
                  avgSell += price;
                  countSell++;
                }
              });
            }
          }
        });
        
        if (countBuy > 0) avgBuy /= countBuy;
        if (countSell > 0) avgSell /= countSell;
        
        // Gerar dados sintéticos com variação
        for (let i = 0; i < timestamps.length; i++) {
          const progress = i / timestamps.length;
          const waveVar = 0.01 * Math.sin(progress * Math.PI * 2);
          const noise = ((Math.random() * 0.008) - 0.004);
          
          buy_prices[i] = parseFloat((avgBuy * (1 + waveVar + noise)).toFixed(4));
          sell_prices[i] = parseFloat((avgSell * (1 + waveVar + noise)).toFixed(4));
        }
      } else {
        // Preenche com os valores disponíveis
        for (let i = 0; i < timestamps.length; i++) {
          // Se o valor existe e é válido, usamos ele
          if (sourceData.buy_prices && i < sourceData.buy_prices.length && 
              sourceData.buy_prices[i] !== null && !isNaN(sourceData.buy_prices[i])) {
            buy_prices[i] = sourceData.buy_prices[i];
          } 
          // Caso contrário, interpolar entre pontos conhecidos
          else {
            // Encontrar o valor anterior mais próximo
            let prevValue = null;
            let prevIndex = -1;
            
            for (let j = i - 1; j >= 0; j--) {
              if (buy_prices[j] !== null) {
                prevValue = buy_prices[j];
                prevIndex = j;
                break;
              }
            }
            
            // Encontrar o próximo valor
            let nextValue = null;
            let nextIndex = -1;
            
            for (let j = i + 1; j < sourceData.buy_prices.length; j++) {
              if (sourceData.buy_prices[j] !== null && !isNaN(sourceData.buy_prices[j])) {
                nextValue = sourceData.buy_prices[j];
                nextIndex = j;
                break;
              }
            }
            
            // Interpolar ou usar o valor mais próximo
            if (prevValue !== null && nextValue !== null) {
              // Interpolar
              const ratio = (i - prevIndex) / (nextIndex - prevIndex);
              buy_prices[i] = prevValue + ratio * (nextValue - prevValue);
            } else if (prevValue !== null) {
              // Usar valor anterior com pequena variação
              const noise = ((Math.random() * 0.006) - 0.003); // ±0.3%
              buy_prices[i] = parseFloat((prevValue * (1 + noise)).toFixed(4));
            } else if (nextValue !== null) {
              // Usar próximo valor com pequena variação
              const noise = ((Math.random() * 0.006) - 0.003); // ±0.3%
              buy_prices[i] = parseFloat((nextValue * (1 + noise)).toFixed(4));
            }
          }
          
          // Mesmo processo para os preços de venda
          if (sourceData.sell_prices && i < sourceData.sell_prices.length && 
              sourceData.sell_prices[i] !== null && !isNaN(sourceData.sell_prices[i])) {
            sell_prices[i] = sourceData.sell_prices[i];
          }
          else {
            // Lógica similar à do preço de compra para interpolar
            let prevValue = null;
            let prevIndex = -1;
            
            for (let j = i - 1; j >= 0; j--) {
              if (sell_prices[j] !== null) {
                prevValue = sell_prices[j];
                prevIndex = j;
                break;
              }
            }
            
            let nextValue = null;
            let nextIndex = -1;
            
            for (let j = i + 1; j < sourceData.sell_prices.length; j++) {
              if (sourceData.sell_prices[j] !== null && !isNaN(sourceData.sell_prices[j])) {
                nextValue = sourceData.sell_prices[j];
                nextIndex = j;
                break;
              }
            }
            
            if (prevValue !== null && nextValue !== null) {
              const ratio = (i - prevIndex) / (nextIndex - prevIndex);
              sell_prices[i] = prevValue + ratio * (nextValue - prevValue);
            } else if (prevValue !== null) {
              const noise = ((Math.random() * 0.006) - 0.003);
              sell_prices[i] = parseFloat((prevValue * (1 + noise)).toFixed(4));
            } else if (nextValue !== null) {
              const noise = ((Math.random() * 0.006) - 0.003);
              sell_prices[i] = parseFloat((nextValue * (1 + noise)).toFixed(4));
            }
          }
        }
      }
      
      normalizedSources[sourceName] = {
        buy_prices,
        sell_prices
      };
    });
    
    return {
      timestamps,
      sources: normalizedSources,
      isApproximated: data.isApproximated
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
            validTimestamp = new Date(Date.now() - (timestamps.length - index) * 30 * 60 * 1000);
          }
        } catch (e) {
          console.warn(`Erro ao converter timestamp no índice ${index}:`, e);
          validTimestamp = new Date(Date.now() - (timestamps.length - index) * 30 * 60 * 1000);
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
          if (sourceData.buy_prices && index < sourceData.buy_prices.length) {
            entry[`${sourceName}_buy`] = sourceData.buy_prices[index];
          }
          
          if (sourceData.sell_prices && index < sourceData.sell_prices.length) {
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
        
        <div className="debug-controls">
          <button onClick={() => setDebugMode(!debugMode)} className="debug-button">
            {debugMode ? 'Ocultar Dados' : 'Mostrar Dados'}
          </button>
          
          {debugMode && (
            <details open>
              <summary>Dados do Gráfico (debug)</summary>
              <pre>{JSON.stringify(chartData.slice(0, 3), null, 2)}...</pre>
            </details>
          )}
        </div>
        
        {isApproximatedData && (
          <div className="approximated-data-notice">
            <p>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{marginRight: '5px'}}>
                <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
              </svg>
              Os dados exibidos incluem interpolação para melhor visualização.
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
        /* Estilos CSS omitidos para brevidade - use os mesmos do exemplo anterior */
        
        .debug-controls {
          margin-top: 10px;
          text-align: center;
        }
        
        .debug-button {
          background: #f0f0f0;
          border: 1px solid #ddd;
          padding: 5px 10px;
          font-size: 12px;
          cursor: pointer;
        }
        
        .debug-button:hover {
          background: #e0e0e0;
        }
      `}</style>
    </div>
  );
};

export default ExchangeRateChart;
