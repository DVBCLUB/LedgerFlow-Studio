import { describe, it, expect } from 'vitest';
import {
  extractMockFigmaDesignTokens,
  convertFigmaToReactComponent,
} from './figmaCodeBridge.ts';

describe('figmaCodeBridge', () => {
  it('extracts design tokens and converts Figma URL to React JSX', async () => {
    const tokens = extractMockFigmaDesignTokens('https://www.figma.com/file/sample123');
    expect(tokens.primaryColor).toBeDefined();

    const result = await convertFigmaToReactComponent({
      figmaUrl: 'https://www.figma.com/file/sample123',
      componentName: 'DashboardHeader',
    });

    expect(result.id).toBeDefined();
    expect(result.componentName).toBe('DashboardHeader');
    expect(result.jsxCode.length).toBeGreaterThan(0);
    expect(result.cssVariables).toContain('--color-primary');
  });
});
