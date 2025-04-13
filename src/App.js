import React, { useEffect, useState } from "react";
import Quotes from "./components/Quotes";
import Average from "./components/Average";
import Slippage from "./components/Slippage";
import "./App.css";

function App() {
  // Atualiza o dashboard a cada 15 segundos
  const [updateTrigger, setUpdateTrigger] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setUpdateTrigger((prev) => prev + 1);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Pluggy Challenge</h1>
      </header>
      <main>
        <Quotes trigger={updateTrigger} />
        <Average trigger={updateTrigger} />
        <Slippage trigger={updateTrigger} />
      </main>
    </div>
  );
}

export default App;
