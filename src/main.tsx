import React from 'react';
import ReactDOM from 'react-dom/client';
import './lib/polyfills'; // Import polyfills first
import App from './App';
import './index.css';
import './styles/main.css'; // Importar o CSS principal
import './styles/globals.css'
import './styles/custom.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
