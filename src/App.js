import React, { useEffect, useState } from "react";
import Quotes from "./components/Quotes";
import Average from "./components/Average";
import Slippage from "./components/Slippage";
import CountrySelector from "./components/CountrySelector";
import ExchangeRateChart from "./components/ExchangeRateChart"; // Importe o novo componente
import "./App.css";

function App() {
  // Estado para controlar o país selecionado
  const [selectedCountry, setSelectedCountry] = useState("brazil");
  
  // Atualiza o dashboard a cada 15 segundos
  const [updateTrigger, setUpdateTrigger] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setUpdateTrigger((prev) => prev + 1);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Manipulador para alteração do país
  const handleCountryChange = (country) => {
    setSelectedCountry(country);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Pluggy Challenge - Dashboard de Câmbio</h1>
        <CountrySelector 
          selectedCountry={selectedCountry} 
          onCountryChange={handleCountryChange} 
        />
      </header>
      <main>
        <div className="dashboard-info">
          <p>Exibindo cotações para: {selectedCountry === 'brazil' ? 'Brasil (USD → BRL)' : 'Argentina (USD → ARS)'}</p>
          <p className="update-info">Atualização automática a cada 15 segundos. Última atualização: {new Date().toLocaleTimeString()}</p>
        </div>
        
        {/* Adicione o componente de gráfico aqui */}
        <ExchangeRateChart trigger={updateTrigger} country={selectedCountry} />
        
        <div className="dashboard-grid">
          <Quotes trigger={updateTrigger} country={selectedCountry} />
          <Average trigger={updateTrigger} country={selectedCountry} />
          <Slippage trigger={updateTrigger} country={selectedCountry} />
        </div>
      </main>
      <footer>
        <p>Pluggy Challenge - Developed for testing purposes</p>
      </footer>
    </div>
  );
}

export default App;
