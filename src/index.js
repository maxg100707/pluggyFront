import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // Você pode criar estilos globais se desejar

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
