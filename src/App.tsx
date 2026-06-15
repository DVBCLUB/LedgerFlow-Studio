import { HashRouter } from 'react-router-dom';
import AppShell from './app/AppShell';

export default function App() {
  return (
    <HashRouter>
      <AppShell />
    </HashRouter>
  );
}
