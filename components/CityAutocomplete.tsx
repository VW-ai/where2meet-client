'use client';

import { useState, useEffect, useRef } from 'react';
import { searchCities } from '@/lib/cities';

interface CityAutocompleteProps {
  value: string;
  onChange: (city: string, state: string, display: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function CityAutocomplete({
  value,
  onChange,
  placeholder = 'Search for a city',
  disabled = false,
}: CityAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<Array<{ city: string; state: string; display: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle clicks outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setInputValue(query);

    if (query.trim().length > 0) {
      const results = searchCities(query, 10);
      setSuggestions(results);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectCity = (city: { city: string; state: string; display: string }) => {
    setInputValue(city.display);
    setShowSuggestions(false);
    setSuggestions([]);
    onChange(city.city, city.state, city.display);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectCity(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3 py-2.5 text-sm text-black border border-gray-300 focus:border-black focus:outline-none bg-white disabled:opacity-50 disabled:cursor-not-allowed"
      />

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((city, index) => (
            <div
              key={`${city.city}-${city.state}`}
              onClick={() => handleSelectCity(city)}
              className={`px-3 py-2 cursor-pointer text-sm border-t border-gray-200 first:border-t-0 ${
                index === selectedIndex ? 'bg-gray-100' : 'hover:bg-gray-50'
              }`}
            >
              <span className="text-black">{city.display}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
