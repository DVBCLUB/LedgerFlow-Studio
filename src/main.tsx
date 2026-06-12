import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import SimulationGuard from './components/SimulationGuard.tsx';
import FounderLabsDock from './components/FounderLabsDock.tsx';
import AISettingsLauncher from './components/AISettingsLauncher.tsx';
import IntegrationHubLauncher from './components/IntegrationHubLauncher.tsx';
import DevHandoffLauncher from './components/DevHandoffLauncher.tsx';
import GitHubCIDoctorLauncher from './components/GitHubCIDoctorLauncher.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <SimulationGuard />
    <FounderLabsDock />
    <GitHubCIDoctorLauncher />
    <DevHandoffLauncher />
    <AISettingsLauncher />
    <IntegrationHubLauncher />
  </StrictMode>,
);
