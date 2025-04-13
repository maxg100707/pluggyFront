import React from 'react';

const CountrySelector = ({ selectedCountry, onCountryChange }) => {
  return (
    <div className="country-selector">
      <label>
        Selecione o país:
        <select 
          value={selectedCountry} 
          onChange={(e) => onCountryChange(e.target.value)}
        >
          <option value="brazil">Brasil (USD → BRL)</option>
          <option value="argentina">Argentina (USD → ARS)</option>
        </select>
      </label>
    </div>
  );
};

export default CountrySelector;
