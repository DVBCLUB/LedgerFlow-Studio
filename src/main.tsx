import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import CT1GlobalSimulationGuard from './components/CT1GlobalSimulationGuard.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <CT1GlobalSimulationGuard />
  </StrictMode>,
);
