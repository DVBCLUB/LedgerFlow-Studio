import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ErpApp from './app/ErpApp';
import LocalLoginGate from './components/LocalLoginGate';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocalLoginGate>
      <ErpApp />
    </LocalLoginGate>
  </StrictMode>,
);
