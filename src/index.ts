/**
 * LedgerFlow Studio - Main Entry Point
 * 
 * This file exports all public APIs for the application.
 * Use this for cleaner imports throughout the app.
 * 
 * Usage:
 *   import { ErpApp, LocalLoginGate } from '@/src'
 *   import { useLocalAuth } from '@/src/context'
 *   import * as data from '@/src/data'
 */

// ==========================================================================
// RE-EXPORTS BY CATEGORY
// ==========================================================================

// Components
export * from './components';

// App
export * from './app';

// Context
export * from './context';

// Config
export * from './config';

// Data & Knowledge
export * from './data';

// Store (Zustand)
export * from './store';

// Types
export * from './types';

// Utils
export * from './utils';

// Styles (CSS)
// Note: CSS files should be imported directly in your components
// or in the main entry file (main.tsx)

// Modules (Lazy loaded by default)
// export * from './modules';

// ==========================================================================
// DIRECT EXPORTS FOR COMMON USAGE
// ==========================================================================

// Main App Component
import ErpApp from './app/ErpApp';
import LocalLoginGate from './components/LocalLoginGate';

export { ErpApp, LocalLoginGate };

// ==========================================================================
// TYPES
// ==========================================================================

export type { TabType, RoleType, ModuleEntry } from './app/companyNavigation';
export type { LocalSession } from './context/LocalAuthContext';

// ==========================================================================
// NOTES FOR DEVELOPERS
// ==========================================================================

/*
 * IMPORT GUIDELINES:
 * 
 * 1. For components: import from './components'
 *    Example: import { Button, Modal } from './components'
 * 
 * 2. For hooks/context: import from './context'
 *    Example: import { useLocalAuth } from './context'
 * 
 * 3. For data/knowledge: import from './data'
 *    Example: import { KNOWLEDGE_REGISTRY } from './data'
 * 
 * 4. For types: import from './types'
 *    Example: import type { IndustryType } from './types'
 * 
 * 5. For utilities: import from './utils'
 *    Example: import { formatCurrency } from './utils'
 * 
 * 6. For modules: Use lazy loading
 *    Example: const Module = lazy(() => import('./modules/product-studio'))
 * 
 * PERFORMANCE TIPS:
 * - Use lazy() for large modules
 * - Use React.memo for pure components
 * - Use useMemo/useCallback for expensive computations
 * - Keep bundle size small by code splitting
 */
