/**
 * App Barrel
 * Central export point for all app-related components and utilities
 */

// Main components
export { default as ErpApp } from './ErpApp';
export { default as WorkspaceRenderer } from './WorkspaceRenderer';

// Navigation
export * from './companyNavigation';

// Types
export type { TabType, RoleType, ModuleEntry, DeptConfig } from './companyNavigation';
