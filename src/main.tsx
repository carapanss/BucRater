import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@fontsource/gloock/latin-400.css';
import '@fontsource/gloock/latin-ext-400.css';
import '@fontsource-variable/schibsted-grotesk/index.css';
import './styles/themes.css';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
