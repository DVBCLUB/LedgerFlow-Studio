import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App'; // App shell hosts ErpApp (the main ERP runtime)
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
