import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg transition-colors dark:bg-gray-700 bg-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon size={20} className="text-gray-700" />
      ) : (
        <Sun size={20} className="text-gray-200" />
      )}
    </button>
  );
}