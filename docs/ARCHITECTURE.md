# LedgerFlow Studio - Architecture Documentation

## 📋 Overview

LedgerFlow Studio is a **desktop-first software company operating system** designed for solo founders. It combines ERP functionality, AI-powered workflows, knowledge management, and simulation capabilities into a unified platform.

This document describes the current architecture, recent improvements, and recommendations for future development.

---

## 🏗️ Current Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 19 + TypeScript | UI Framework |
| **Styling** | TailwindCSS v4 + Custom CSS | Design System |
| **State Management** | Zustand | Lightweight state |
| **Routing** | React Router DOM v7 | Client-side routing |
| **Desktop** | Electron 39 | Cross-platform desktop app |
| **Build Tool** | Vite 6 | Fast development & production builds |
| **Backend** | Express.js | API Server |
| **Database** | Local JSON + Supabase | Data persistence |
| **AI Integration** | Google GenAI, @supabase/supabase-js | AI capabilities |

### Project Structure

```
ledgerflow-studio/
├── src/
│   ├── app/                  # Main application components
│   │   ├── ErpApp.tsx        # Root application component
│   │   ├── WorkspaceRenderer.tsx  # Workspace rendering logic
│   │   └── companyNavigation.ts   # Navigation configuration
│   │
│   ├── components/           # Reusable React components
│   │   ├── shared/           # Shared components
│   │   └── ...
│   │
│   ├── context/              # React Context providers
│   │   └── LocalAuthContext.tsx
│   │
│   ├── data/                 # **Data & Knowledge Layer** ⭐
│   │   ├── index.ts          # NEW: Central knowledge registry
│   │   ├── accountingDataModels.ts
│   │   ├── deepConstructionAccountingKnowledge.ts
│   │   ├── simulationRegistry.ts
│   │   ├── multiIndustryCaseBank.ts
│   │   └── ... (53 files total)
│   │
│   ├── modules/              # Feature modules
│   ├── store/                # Zustand stores
│   ├── styles/               # **NEW: Modular CSS** ⭐
│   │   ├── index.css         # Main entry point
│   │   ├── design-tokens.css  # Design system tokens
│   │   ├── components.css    # Component styles
│   │   └── utilities.css     # Utility classes
│   │
│   ├── types/                # TypeScript type definitions
│   └── utils/                # Utility functions
│
├── server/                  # Express backend server
│   ├── services/             # Server services
│   └── assistant-daemon.ts   # AI assistant daemon
│
├── desktop/                 # Electron desktop integration
├── scripts/                 # Build and validation scripts
├── public/                  # Static assets
└── package.json             # Project configuration
```

---

## ✨ Recent Improvements (June 2026)

### 1. **Knowledge & Data Registry System** 🎯

**Problem**: 53 separate data files in `src/data/` with no central organization, making it difficult to:
- Discover available knowledge modules
- Maintain consistency across files
- Import and use data efficiently
- Understand relationships between modules

**Solution**: Created `src/data/index.ts` with:

```typescript
// Central registry mapping all knowledge by domain
export const KNOWLEDGE_REGISTRY = {
  accounting: {
    vietnam: ['accountingVietnamDeepDive', 'taxKnowledgeVietnam'],
    // ...
  },
  audit: {
    knowledge: ['internalAuditKnowledge'],
    deepDive: ['internalAuditDeepDive'],
  },
  // ... 10+ domains
};

// Utility functions for discovery
export function getKnowledgeByDomain(domain: string): string[];
export function searchKnowledge(query: string): Array<{module: string; type: string}>;
export function getAllKnowledgeModules(): string[];

// Standardized type definitions
export interface KnowledgeItem {
  id: string;
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  confidenceLevel?: 'draft' | 'reviewed' | 'validated' | 'deprecated';
}
```

**Benefits**:
- ✅ Single import point: `import { KNOWLEDGE_REGISTRY, searchKnowledge } from './data'`
- ✅ Easy discovery of all available knowledge
- ✅ Type safety across the knowledge system
- ✅ Foundation for future knowledge graph/relationship mapping

### 2. **Modular CSS Architecture** 🎨

**Problem**: Large monolithic `index.css` (400+ lines) with:
- Hard-coded color values
- Inconsistent spacing
- No design system
- Difficult to maintain and extend

**Solution**: Created a modular CSS system in `src/styles/`:

```
src/styles/
├── index.css              # Main entry point (imports all)
├── design-tokens.css      # Design system foundation
├── components.css         # Reusable component styles
└── utilities.css          # Utility classes
```

**Design Tokens** (`design-tokens.css`):
```css
:root {
  /* Spacing Scale (4px grid) */
  --space-1: 0.25rem; --space-2: 0.5rem; --space-3: 0.75rem;
  --space-4: 1rem; --space-5: 1.25rem; --space-6: 1.5rem;
  
  /* Typography */
  --text-xs: 0.625rem; --text-sm: 0.75rem; --text-base: 0.875rem;
  --font-weight-normal: 400; --font-weight-bold: 700;
  
  /* Colors (Dark Theme) */
  --color-bg-primary: #0b0f17;
  --color-text-primary: #f8fafc;
  --color-accent-primary: #6366f1;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  
  /* Light Theme Support */
  [data-theme="light"] {
    --color-bg-primary: #f8fafc;
    --color-text-primary: #0f172a;
    /* ... */
  }
  
  /* Component Tokens */
  --sidebar-width: 264px;
  --sidebar-collapsed-width: 72px;
  --header-height: 72px;
  --nav-item-height: 48px;
}
```

**Benefits**:
- ✅ Consistent design language across the app
- ✅ Easy theming (dark/light mode support)
- ✅ Maintainable and scalable
- ✅ Better performance (shared variables)
- ✅ Backward compatible (legacy styles preserved)

### 3. **Type System Improvements** ⚡

Added standardized interfaces for knowledge management:
- `KnowledgeItem` - Base interface for all knowledge entries
- `CaseStudy` - Standard structure for case studies
- `SimulationConfig` - Configuration for simulation modules
- `IndustryType` - Type-safe industry classifications
- `KnowledgeDomain` - Domain categorization

---

## 📊 Data & Knowledge Architecture

### Knowledge Domains

The application knowledge is organized into the following domains:

| Domain | Modules | Description |
|--------|---------|-------------|
| **Accounting** | 8 | Financial models, VAT, payroll, ecommerce |
| **Audit** | 2 | Internal audit knowledge and deep dives |
| **AI & Automation** | 5 | AI engine, agent operations, command center |
| **Business & Strategy** | 7 | Ideas, founder resources, labs, roadmap |
| **Marketing & Sales** | 13 | Funnel, lead scoring, outbound, email, PLG |
| **Marketing V2** | 6 | Next-gen marketing workspace |
| **Simulations** | 4 | Registry, boundaries, case bank |
| **Data** | 4 | Schemas, sectors, stats, prompts |

### Data Flow

```
User Request
     ↓
[UI Layer] → [Navigation] → [Workspace Renderer]
     ↓
[Knowledge Registry] ← [Data Files] (53 modules)
     ↓
[Context/State] → [Components]
     ↓
[Server API] → [Local DB / Supabase]
```

### Key Data Files

1. **`simulationRegistry.ts`** - All available simulation modules
2. **`multiIndustryCaseBank.ts`** - 20+ case studies across industries
3. **`accountingDataModels.ts`** - Core data structures for accounting
4. **`deepConstructionAccountingKnowledge.ts`** - Comprehensive accounting knowledge
5. **`companyNavigation.ts`** - Navigation and workspace configuration

---

## 🎯 Component Architecture

### Main Application Components

```
ErpApp (Root)
├── LocalLoginGate (Auth wrapper)
│
├── Sidebar
│   ├── Brand
│   ├── Search
│   ├── Navigation
│   └── Footer
│
├── Topbar
│   ├── Page Title
│   ├── Status
│   └── User Actions
│
└── Workspace
    └── WorkspaceRenderer
        ├── Dashboard
        ├── Modules (Dynamic)
        └── Content Areas
```

### Workspace Rendering

The `WorkspaceRenderer` component dynamically renders content based on:
- Current route/hash
- User role
- Available modules
- Navigation configuration

**Navigation Configuration** (`companyNavigation.ts`):
- Defines all workspaces and tabs
- Maps legacy routes to new structure
- Controls visibility based on user role

---

## 🔧 Technical Improvements Made

### 1. Centralized Knowledge Access
**Before**:
```typescript
// Had to know exact filename and import path
import { DEEP_KNOWLEDGE_PRINCIPLES } from '../data/deepConstructionAccountingKnowledge';
import { SIMULATION_REGISTRY } from '../data/simulationRegistry';
```

**After**:
```typescript
// Single import, discover all knowledge
import { 
  KNOWLEDGE_REGISTRY, 
  getKnowledgeByDomain,
  searchKnowledge,
  DEEP_KNOWLEDGE_PRINCIPLES,
  SIMULATION_REGISTRY
} from './data';

// Find all accounting knowledge
const accountingModules = getKnowledgeByDomain('accounting');

// Search for specific knowledge
const results = searchKnowledge('marketing');
```

### 2. Consistent Styling
**Before**:
```css
/* Inline hard-coded values */
.erp-sidebar {
  background: #111722;
  width: 264px;
  border: 1px solid #202735;
}
```

**After**:
```css
/* Using design tokens */
.erp-sidebar {
  background: var(--sidebar-bg);
  width: var(--sidebar-width);
  border: var(--border-width-thin) solid var(--sidebar-border);
}
```

### 3. Type Safety
**Before**:
```typescript
// Implicit any types or inconsistent interfaces
const caseStudy = {
  id: 'trade-001',
  title: 'Trade Case',
  // ... various inconsistent fields
};
```

**After**:
```typescript
// Standardized interface
const caseStudy: CaseStudy = {
  id: 'trade-001',
  title: 'Trade Case',
  industry: 'Thương mại',
  scenario: '...',
  documents: ['Hóa đơn', 'Phiếu nhập kho'],
  redFlags: ['...'],
  accountingFocus: ['...'],
  learningOutcome: '...',
  riskLevel: 'High'
};
```

---

## 🚀 Recommendations for Future Development

### Priority 1: Knowledge System Enhancements

1. **Implement Knowledge Graph**
   ```typescript
   // Future: Map relationships between knowledge modules
   const KNOWLEDGE_GRAPH = {
     nodes: [...],
     edges: [
       { from: 'accountingDataModels', to: 'deepConstructionAccountingKnowledge', type: 'dependsOn' },
       { from: 'multiIndustryCaseBank', to: 'accountingVietnamDeepDive', type: 'references' },
     ]
   };
   ```

2. **Add Metadata to Knowledge Files**
   ```typescript
   // Each knowledge file should have metadata
   export const MODULE_METADATA = {
     id: 'accountingDataModels',
     domain: 'accounting',
     category: 'models',
     version: '1.0.0',
     lastUpdated: '2026-06-23',
     author: 'system',
     dependencies: ['taxKnowledgeVietnam'],
     tags: ['accounting', 'data-model', 'vietnam']
   };
   ```

3. **Implement Knowledge Search API**
   ```typescript
   // Server-side knowledge search
   app.get('/api/knowledge/search', (req, res) => {
     const { query, domain, tags } = req.query;
     const results = searchKnowledgeBase({ query, domain, tags });
     res.json(results);
   });
   ```

### Priority 2: CSS & UI Improvements

1. **Migrate All Styles to Design Tokens**
   - Gradually replace hard-coded colors with `var(--color-*)`
   - Replace pixel values with `var(--space-*)`
   - Standardize all component styles

2. **Create Theme Toggle**
   ```typescript
   // Add to app shell
   function ThemeToggle() {
     const [theme, setTheme] = useState<'dark' | 'light'>('dark');
     
     useEffect(() => {
       document.documentElement.setAttribute('data-theme', theme);
     }, [theme]);
     
     return (
       <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
         {theme === 'dark' ? <Sun /> : <Moon />}
       </button>
     );
   }
   ```

3. **Implement CSS-in-JS (Optional)**
   - Consider using TailwindCSS classes more extensively
   - Or adopt a CSS-in-JS solution for component-scoped styles

### Priority 3: Performance Optimizations

1. **Lazy Load Knowledge Modules**
   ```typescript
   // Load knowledge on demand
   const loadKnowledgeModule = async (moduleName: string) => {
     const module = await import(`./data/${moduleName}`);
     return module;
   };
   ```

2. **Implement Data Indexing**
   ```typescript
   // Create search index for knowledge
   const KNOWLEDGE_INDEX = new Map<string, KnowledgeItem>();
   
   // Index all knowledge on app load
   function initializeKnowledgeIndex() {
     getAllKnowledgeModules().forEach(module => {
       // Index module contents
     });
   }
   ```

3. **Bundle Size Analysis**
   - Run `npm run build -- --analyze` to identify large dependencies
   - Consider code splitting for large modules

### Priority 4: Developer Experience

1. **Create Knowledge Module Generator**
   ```bash
   npm run generate:knowledge --name=newModule --domain=accounting
   ```

2. **Add Storybook for Component Documentation**
   - Document all UI components
   - Show usage examples
   - Include props documentation

3. **Improve TypeScript Configuration**
   - Add more strict type checking
   - Implement path aliases
   - Add type guards

### Priority 5: Testing & Quality

1. **Add Knowledge Module Tests**
   ```typescript
   // Test knowledge registry
   describe('Knowledge Registry', () => {
     it('should return all modules in a domain', () => {
       const modules = getKnowledgeByDomain('accounting');
       expect(modules.length).toBeGreaterThan(0);
     });
     
     it('should search knowledge correctly', () => {
       const results = searchKnowledge('accounting');
       expect(results.some(r => r.module.includes('accounting'))).toBe(true);
     });
   });
   ```

2. **Visual Regression Testing**
   - Add Percy or Chromatic for UI testing
   - Prevent unintended style changes

3. **Performance Testing**
   - Add Lighthouse CI
   - Monitor bundle size
   - Track load times

---

## 📁 File Changes Summary

### New Files Created

| File | Purpose | Lines |
|------|---------|-------|
| `src/data/index.ts` | Central knowledge registry | ~300 |
| `src/styles/index.css` | Main styles entry point | ~50 |
| `src/styles/design-tokens.css` | Design system tokens | ~400 |
| `src/styles/components.css` | Component styles | ~600 |
| `src/styles/utilities.css` | Utility classes | ~250 |

### Modified Files

| File | Changes |
|------|---------|
| `src/index.css` | Reorganized with modular imports | -100 lines (refactored) |

---

## 🎓 Best Practices

### For New Knowledge Modules

1. **Always add to registry**: Add your module to `KNOWLEDGE_REGISTRY` in `src/data/index.ts`
2. **Use standard interfaces**: Implement `KnowledgeItem`, `CaseStudy`, or appropriate type
3. **Include metadata**: Add version, author, lastUpdated, etc.
4. **Export from index**: Add re-export in `src/data/index.ts`

### For New Components

1. **Use design tokens**: Reference `var(--color-*)`, `var(--space-*)`, etc.
2. **Add to component library**: Place in appropriate `src/components/` folder
3. **Document props**: Add TypeScript types and JSDoc comments
4. **Style with Tailwind first**: Use utility classes where possible

### For New Features

1. **Follow existing patterns**: Match existing code style and architecture
2. **Add tests**: Include unit tests for new functionality
3. **Update navigation**: Add to `companyNavigation.ts` if needed
4. **Consider performance**: Lazy load heavy modules

---

## 🔍 Current Issues & Limitations

### Known Issues

1. **CSS Duplication**: Some legacy styles duplicate new component styles
   - **Solution**: Gradually migrate legacy styles to new system

2. **Knowledge Files Not All Imported**: Some data files not yet in registry
   - **Solution**: Complete the registry mapping

3. **No Knowledge Versioning**: Cannot track changes to knowledge modules
   - **Solution**: Implement versioning system

4. **Hard-coded Strings**: Some Vietnamese text hard-coded in components
   - **Solution**: Extract to i18n files or knowledge modules

### Limitations

1. **Static Knowledge**: Knowledge is static JSON data
   - **Future**: Could be dynamic from database or API

2. **No Real-time Updates**: Knowledge updates require app rebuild
   - **Future**: Implement hot reload for knowledge modules

3. **Limited Search**: Current search is simple string matching
   - **Future**: Implement full-text search with ranking

---

## 📈 Next Steps

### Immediate (1-2 weeks)
- [ ] Complete knowledge registry (add all 53 files)
- [ ] Migrate remaining legacy CSS to design tokens
- [ ] Add basic knowledge search functionality
- [ ] Implement theme toggle

### Short-term (1 month)
- [ ] Add knowledge module tests
- [ ] Implement lazy loading for knowledge
- [ ] Create knowledge module generator script
- [ ] Add Storybook for components

### Long-term (3+ months)
- [ ] Implement knowledge graph
- [ ] Add dynamic knowledge loading
- [ ] Create knowledge editing UI
- [ ] Implement full-text search

---

## 📞 Support & Contact

For questions about this architecture or to request changes:
- Open an issue in the repository
- Reference this architecture document
- Include relevant code snippets

---

**Document Version**: 1.0.0  
**Last Updated**: June 23, 2026  
**Author**: Mistral Vibe (with LedgerFlow Team)
