// src/contexts/SearchContext.js
import React, { createContext, useState, useContext } from 'react';

// Create the context
export const SearchContext = createContext();

// Create a provider component
export const SearchProvider = ({ children }) => {
    const [searchTerm, setSearchTerm] = useState('');

    return (
        <SearchContext.Provider value={{ searchTerm, setSearchTerm }}>
            {children}
        </SearchContext.Provider>
    );
};

// Custom hook to use the search context
export const useSearch = () => {
    return useContext(SearchContext);
};