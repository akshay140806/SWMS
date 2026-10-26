import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

if (localStorage.getItem('theme') === 'dark') document.documentElement.classList.add('dark');

createRoot(document.getElementById('root')).render(<App />);
