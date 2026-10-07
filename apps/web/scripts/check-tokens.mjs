#!/usr/bin/env node
/**
 * Design-token guard for apps/web.
 *
 * Tailwind's default scales are already reset in src/styles/tokens.css, so off-system classes
 * generate no CSS — they fail *silently*. This script makes them fail *loudly* in lint/CI.
 *
 * Rejects in .ts/.tsx under src/:
 *   - arbitrary values            e.g. w-[37px], bg-[#fff], grid-cols-[1fr_2fr]
 *   - hard-coded colours          e.g. '#004737', rgb(…) — colours live in tokens.css only
 *   - Tailwind default palettes   e.g. bg-slate-100, text-red-600, text-white
 *   - non-token type/radius/shadow/weight utilities (text-sm, rounded-lg, shadow-md, font-bold, tracking-*, leading-*)
 *   - spacing values that are not on the spacing scale (p-3, gap-5, w-72 …)
 *   - inline styles, except data-driven widths (`width: \`${n}%\``) and CSS custom properties
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');

/** Keep in sync with --spacing-* in src/styles/tokens.css. */
const SPACING = new Set([0, 1, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48, 56, 64, 80, 120, 160].map(String));

const PALETTES =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black|brand';
const COLOR_UTILS = 'bg|text|border|ring|fill|stroke|outline|decoration|divide|placeholder|accent|caret|from|to|via';
const SPACING_UTILS =
  'p|px|py|pt|pr|pb|pl|ps|pe|m|mx|my|mt|mr|mb|ml|ms|me|gap|gap-x|gap-y|space-x|space-y|w|h|size|min-w|min-h|max-h|inset|inset-x|inset-y|top|right|bottom|left|translate-x|translate-y|scroll-m|scroll-p';

const rules = [
  { name: 'arbitrary value', re: /(?<![\w$])-?[a-z][\w-]*-\[[^\]\s]+\]/g },
  { name: 'hard-coded colour', re: /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/g },
  { name: 'default palette colour', re: new RegExp(`\\b(?:${COLOR_UTILS})-(?:${PALETTES})(?:-\\d+)?\\b`, 'g') },
  { name: 'non-token font weight', re: /\bfont-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black)\b/g },
  { name: 'non-token text size', re: /\btext-(?:xs|sm|base|lg|xl|[2-9]xl)\b/g },
  { name: 'non-token radius', re: /\brounded(?:-[trblse]{1,2})?-(?:none|xs|sm|md|lg|xl|[2-4]xl|full)\b|\brounded(?=["'`\s])/g },
  { name: 'non-token shadow', re: /\bshadow-(?:2xs|xs|sm|md|lg|xl|2xl|inner)\b|\bshadow(?=["'`\s])/g },
  { name: 'tracking/leading (built into text tokens)', re: /\b(?:tracking|leading)-[\w.]+/g },
];

const spacingRe = new RegExp(`(?<=^|[\\s"'\`:])-?(?:${SPACING_UTILS})-(\\d+(?:\\.\\d+)?)(?=$|[\\s"'\`])`, 'g');
const styleRe = /style=\{\{([^}]*)\}\}/g;

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return walk(full);
    return /\.(tsx?|jsx?)$/.test(name) && !/\.test\./.test(name) ? [full] : [];
  });
}

const problems = [];
for (const file of walk(root)) {
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;
    const where = `${path.relative(path.dirname(root), file)}:${i + 1}`;
    for (const { name, re } of rules) {
      for (const m of line.matchAll(re)) problems.push(`${where}  ${name}: ${m[0]}`);
    }
    for (const m of line.matchAll(spacingRe)) {
      if (!SPACING.has(m[1])) problems.push(`${where}  off-scale spacing: ${m[0].trim()}`);
    }
    for (const m of line.matchAll(styleRe)) {
      const body = m[1].trim();
      const allowed = /^width:\s*`\$\{[^}]+\}%`$/.test(body) || /^'--[\w-]+':/.test(body);
      if (!allowed) problems.push(`${where}  inline style: ${m[0]}`);
    }
  });
}

if (problems.length) {
  console.error(`Design-token check failed (${problems.length}):\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log('Design-token check passed.');
