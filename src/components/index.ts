/**
 * Components Barrel
 * Central export point for all reusable components
 */

// Shared components
export { default as CompanyOS } from './CompanyOS';
export { default as FounderLabsDock } from './shared/FounderLabsDock';
export { default as StartHereLab } from './StartHereLab';
export { default as FinanceLabMini } from './FinanceLabMini';
export { default as DistributionLeadBoard } from './DistributionLeadBoard';
export { default as ExperimentDashboard } from './ExperimentDashboard';
export { default as ExperimentDecisionLog } from './ExperimentDecisionLog';
export { default as AIOutputQualityReview } from './AIOutputQualityReview';

// Shared components
export * from './shared';

// Auth
export { default as LocalLoginGate } from './LocalLoginGate';

// ==========================================================================
// LAZY-LOADABLE COMPONENTS
// These components are heavy and should be lazy loaded
// ==========================================================================

// Instead of direct exports, use lazy loading in your components:
// const Component = lazy(() => import('./components/SomeHeavyComponent'));

// ==========================================================================
// COMMON COMPONENTS (Lightweight, safe to import directly)
// ==========================================================================

// Add exports for lightweight components here
// Example: export { default as Button } from './Button';
// Example: export { default as Modal } from './Modal';

// ==========================================================================
// NOTES:
// For heavy components (with many dependencies), use React.lazy:
//
//   const HeavyComponent = lazy(() => import('./components/HeavyComponent'));
//
// For lightweight, frequently used components, export here for convenience
// ==========================================================================
