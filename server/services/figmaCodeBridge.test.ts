import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractMockFigmaDesignTokens,
  convertFigmaToReactComponent,
} from './figmaCodeBridge.ts';

test('figmaCodeBridge - extracts design tokens and converts Figma URL to React JSX', async () => {
  const tokens = extractMockFigmaDesignTokens('https://www.figma.com/file/sample123');
  assert.ok(tokens.primaryColor);

  const result = await convertFigmaToReactComponent({
    figmaUrl: 'https://www.figma.com/file/sample123',
    componentName: 'DashboardHeader',
  });

  assert.ok(result.id);
  assert.equal(result.componentName, 'DashboardHeader');
  assert.ok(result.jsxCode.length > 0);
  assert.ok(result.cssVariables.includes('--color-primary'));
});

