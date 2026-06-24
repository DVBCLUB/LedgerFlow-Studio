/**
 * aiOutputValidator.ts
 * ============================================================
 * AI Output Validator — validate, sanitize, và verify
 * AI outputs trước khi apply hoặc hiển thị cho user.
 *
 * Checks: syntax errors, security issues, completeness,
 * formatting, và consistency với prompt ban đầu.
 */
import { randomUUID } from 'node:crypto';
import fs from 'fs';
import path from 'path';

// ─── Types ──────────────────────────────────────────────────────────
export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  category: string;
  message: string;
  location?: { line: number; column: number };
  suggestion: string;
  autoFixable: boolean;
}

export interface ValidationResult {
  id: string;
  input: string;              // Original user prompt/input
  output: string;             // AI output to validate
  valid: boolean;
  issues: ValidationIssue[];
  errorCount: number;
  warningCount: number;
  infoCount: number;
  summary: string;
  validatedAt: string;
  durationMs: number;
}

export interface OutputSanitizer {
  name: string;
  pattern: RegExp;
  replacement: string;
  description: string;
}

// ─── Sanitizers ─────────────────────────────────────────────────────
const SANITIZERS: OutputSanitizer[] = [
  {
    name: 'html_injection',
    pattern: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    replacement: '[SCRIPT REMOVED]',
    description: 'Remove embedded script tags to prevent XSS',
  },
  {
    name: 'sql_comments',
    pattern: /\/\*[\s\S]*?\*\//g,
    replacement: '',
    description: 'Strip SQL-style multi-line comments from code output',
  },
  {
    name: 'trailing_spaces',
    pattern: /[ \t]+$/gm,
    replacement: '',
    description: 'Remove trailing whitespace',
  },
  {
    name: 'multiple_blank_lines',
    pattern: /\n{3,}/g,
    replacement: '\n\n',
    description: 'Collapse multiple blank lines to max 2',
  },
];

// ─── Validation rules ───────────────────────────────────────────────
interface ValidationRule {
  name: string;
  category: string;
  check: (output: string, input: string) => ValidationIssue[];
}

const VALIDATION_RULES: ValidationRule[] = [
  {
    name: 'empty_output',
    category: 'completeness',
    check: (output) => {
      if (!output || output.trim().length === 0) {
        return [{
          id: `val_empty_${randomUUID().slice(0, 6)}`,
          severity: 'error', category: 'completeness',
          message: 'AI returned empty output.',
          suggestion: 'Retry with a more specific prompt or different model.',
          autoFixable: false,
        }];
      }
      return [];
    },
  },
  {
    name: 'too_short',
    category: 'completeness',
    check: (output, input) => {
      if (output.length < 20 && input.length > 50) {
        return [{
          id: `val_short_${randomUUID().slice(0, 6)}`,
          severity: 'warning', category: 'completeness',
          message: `Output is unusually short (${output.length} chars) compared to input (${input.length} chars).`,
          suggestion: 'AI may not have fully answered. Consider retrying.',
          autoFixable: false,
        }];
      }
      return [];
    },
  },
  {
    name: 'error_messages',
    category: 'quality',
    check: (output) => {
      const issues: ValidationIssue[] = [];
      const errorPatterns = [
        /as an AI/i, /I cannot/i, /I don't have/i, /I am unable/i,
        /sorry.*cannot/i, /I apologize/i,
        /tôi không thể/i, /tôi không có khả năng/i, /xin lỗi/i,
      ];
      for (const pattern of errorPatterns) {
        if (pattern.test(output)) {
          issues.push({
            id: `val_refusal_${randomUUID().slice(0, 6)}`,
            severity: 'warning', category: 'quality',
            message: `AI may have refused or failed to answer: matched "${pattern.source.slice(1, -1).slice(0, 30)}"`,
            suggestion: 'Rephrase the prompt or try a different model.',
            autoFixable: false,
          });
          break;
        }
      }
      return issues;
    },
  },
  {
    name: 'unclosed_brackets',
    category: 'syntax',
    check: (output) => {
      const issues: ValidationIssue[] = [];
      const brackets: Array<{ open: string; close: string; name: string }> = [
        { open: '{', close: '}', name: 'curly braces' },
        { open: '(', close: ')', name: 'parentheses' },
        { open: '[', close: ']', name: 'square brackets' },
      ];

      // Only check code blocks
      const codeBlocks = output.match(/```[\s\S]*?```/g) || [output];
      for (const block of codeBlocks) {
        for (const b of brackets) {
          const openCount = (block.match(new RegExp(`\\${b.open}`, 'g')) || []).length;
          const closeCount = (block.match(new RegExp(`\\${b.close}`, 'g')) || []).length;
          if (openCount !== closeCount) {
            issues.push({
              id: `val_bracket_${randomUUID().slice(0, 6)}`,
              severity: 'error', category: 'syntax',
              message: `Unmatched ${b.name}: ${openCount} ${b.open} vs ${closeCount} ${b.close}`,
              suggestion: `Check for missing ${openCount > closeCount ? b.close : b.open}.`,
              autoFixable: false,
            });
          }
        }
      }
      return issues;
    },
  },
  {
    name: 'code_blocks_incomplete',
    category: 'syntax',
    check: (output) => {
      const issues: ValidationIssue[] = [];
      const ticks = (output.match(/```/g) || []).length;
      if (ticks % 2 !== 0) {
        issues.push({
          id: `val_tick_${randomUUID().slice(0, 6)}`,
          severity: 'error', category: 'syntax',
          message: 'Unclosed code block (unmatched ``` markers).',
          suggestion: 'Add closing ``` to complete the code block.',
          autoFixable: true,
        });
      }
      return issues;
    },
  },
  {
    name: 'sensitive_data',
    category: 'security',
    check: (output) => {
      const issues: ValidationIssue[] = [];
      const sensitivePatterns: Array<{ regex: RegExp; desc: string }> = [
        { regex: /(?:api[_-]?key|apikey|secret|password|token)\s*[:=]\s*['"][^'"]{6,}['"]/gi, desc: 'Potential secret in output' },
        { regex: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/g, desc: 'Private key detected' },
        { regex: /ghp_[a-zA-Z0-9]{36}/g, desc: 'GitHub PAT detected' },
      ];
      for (const sp of sensitivePatterns) {
        if (sp.regex.test(output)) {
          issues.push({
            id: `val_secret_${randomUUID().slice(0, 6)}`,
            severity: 'error', category: 'security',
            message: sp.desc,
            suggestion: 'Redact sensitive data from AI output before sharing.',
            autoFixable: true,
          });
        }
      }
      return issues;
    },
  },
  {
    name: 'inconsistent_language',
    category: 'quality',
    check: (output, input) => {
      const inputIsVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(input);
      const outputIsVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(output);
      if (inputIsVietnamese !== outputIsVietnamese) {
        return [{
          id: `val_lang_${randomUUID().slice(0, 6)}`,
          severity: 'info', category: 'quality',
          message: `Language mismatch: input is ${inputIsVietnamese ? 'Vietnamese' : 'English'}, output is ${outputIsVietnamese ? 'Vietnamese' : 'English'}.`,
          suggestion: 'Explicitly specify desired language in prompt.',
          autoFixable: false,
        }];
      }
      return [];
    },
  },
];

// ─── Core API ───────────────────────────────────────────────────────

export function validateAIOutput(
  input: string,
  output: string,
  options: { strictMode?: boolean; skipSanitization?: boolean } = {}
): ValidationResult {
  const id = `val_${Date.now()}_${randomUUID().slice(0, 6)}`;
  const started = Date.now();
  const issues: ValidationIssue[] = [];

  // Sanitize first (unless skipped)
  let sanitizedOutput = output;
  if (!options.skipSanitization) {
    for (const sanitizer of SANITIZERS) {
      if (sanitizer.pattern.test(sanitizedOutput)) {
        sanitizedOutput = sanitizedOutput.replace(sanitizer.pattern, sanitizer.replacement);
        issues.push({
          id: `san_${randomUUID().slice(0, 6)}`,
          severity: 'warning', category: 'sanitization',
          message: `Sanitized: ${sanitizer.description}`,
          suggestion: 'Original output contained potentially unsafe content.',
          autoFixable: true,
        });
      }
    }
  }

  // Run all validation rules
  for (const rule of VALIDATION_RULES) {
    try {
      const ruleIssues = rule.check(sanitizedOutput, input);
      issues.push(...ruleIssues);
    } catch { /* Rule failed, skip */ }
  }

  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const infoCount = issues.filter(i => i.severity === 'info').length;
  const valid = options.strictMode
    ? (errorCount === 0 && warningCount === 0)
    : errorCount === 0;

  let summary = valid ? 'Output is valid.' : `${errorCount} errors, ${warningCount} warnings found.`;
  if (issues.length === 0) summary = 'No issues detected.';

  return {
    id, input, output: sanitizedOutput, valid, issues,
    errorCount, warningCount, infoCount, summary,
    validatedAt: new Date().toISOString(),
    durationMs: Date.now() - started,
  };
}

export function sanitizeOutput(output: string): string {
  let result = output;
  for (const sanitizer of SANITIZERS) {
    result = result.replace(sanitizer.pattern, sanitizer.replacement);
  }
  return result;
}

export function validateFileOutput(
  input: string,
  filePath: string,
  options?: { strictMode?: boolean }
): ValidationResult {
  let output = '';
  try {
    output = fs.readFileSync(filePath, 'utf8');
  } catch {
    output = `[Cannot read: ${filePath}]`;
  }
  return validateAIOutput(input, output, options);
}

export function getValidationRules(): Array<{ name: string; category: string }> {
  return VALIDATION_RULES.map(r => ({ name: r.name, category: r.category }));
}

export function autoFix(output: string): string {
  let fixed = output;

  // Fix unclosed code blocks
  const ticks = (fixed.match(/```/g) || []).length;
  if (ticks % 2 !== 0) fixed += '\n```';

  // Collapse multiple blank lines
  fixed = fixed.replace(/\n{3,}/g, '\n\n');

  // Remove trailing spaces
  fixed = fixed.replace(/[ \t]+$/gm, '');

  // Remove leading/trailing empty lines
  fixed = fixed.replace(/^\n+/, '').replace(/\n+$/, '\n');

  return fixed;
}
