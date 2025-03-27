// src/context/SearchContext.jsx
import React, { createContext, useContext, useState } from 'react';

// Crear el contexto
const SearchContext = createContext();

// Hook personalizado para usar el contexto
export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

// Proveedor del contexto
export const SearchProvider = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState(''); // Inicializamos como cadena vacía

  return (
    <SearchContext.Provider value={{ searchQuery, setSearchQuery }}>
      {children}
    </SearchContext.Provider>
  );
};