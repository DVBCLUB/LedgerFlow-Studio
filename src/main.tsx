import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import SimulationGuard from './components/SimulationGuard.tsx';
import FounderLabsDock from './components/FounderLabsDock.tsx';
import AISettingsLauncher from './components/AISettingsLauncher.tsx';
import IntegrationHubLauncher from './components/IntegrationHubLauncher.tsx';
import DevHandoffLauncher from './components/DevHandoffLauncher.tsx';
import GitHubCIDoctorLauncher from './components/GitHubCIDoctorLauncher.tsx';
import LocalAuthGate from './components/LocalAuthGate.tsx';
import ApprovedPrPanel from './components/ApprovedPrPanel.tsx';
import './index.css';

function ReviewOverlay() {
  const open = window.location.hash === '#/review_desk';
  return open ? <ApprovedPrPanel /> : null;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocalAuthGate>
      <App />
      <ReviewOverlay />
      <SimulationGuard />
      <FounderLabsDock />
      <GitHubCIDoctorLauncher />
      <DevHandoffLauncher />
      <AISettingsLauncher />
      <IntegrationHubLauncher />
    </LocalAuthGate>
  </StrictMode>,
);
