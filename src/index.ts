/**
 * LedgerFlow Studio - Main Entry Point
 * 
 * This file exports all public APIs for the application.
 * Use this for cleaner imports throughout the app.
 * 
 * Usage:
 *   import { ErpApp, LocalLoginGate } from '@/src'
 *   import { useLocalAuth } from '@/src/context'
 */

// ==========================================================================
// RE-EXPORTS BY CATEGORY
// ==========================================================================

// Components
export * from './components';

// App
// Use the explicit index path to avoid Windows resolving ./app as ./App.tsx.
export * from './app/index';

// Context
export * from './context';

// Config
export * from './config';

// Store (Zustand)
export * from './store';

// Types
export * from './types';

// Utils
export * from './utils';

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
