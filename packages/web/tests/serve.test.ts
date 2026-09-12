import { describe, it, expect } from '../../engine/tests/vitest-shim.ts';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Web UI Server - Real-time TSX/TS Transpilation and Path Resolution', () => {
  it('should verify index.html contains importmap script', () => {
    const indexPath = path.join(__dirname, '../index.html');
    const content = fs.readFileSync(indexPath, 'utf-8');
    expect(content.includes('<script type="importmap">')).toBe(true);
    expect(content.includes('https://esm.sh/react@18.2.0')).toBe(true);
    expect(content.includes('/packages/engine/src/index.ts')).toBe(true);
  });

  it('should verify typescript transpileModule generates valid React JSX code', async () => {
    const fallbackPath = '/Applications/Visual Studio Code.app/Contents/Resources/app/extensions/node_modules/typescript/lib/typescript.js';
    let ts;
    if (fs.existsSync(fallbackPath)) {
      const mod = await import(`file://${fallbackPath}`);
      ts = mod.default || mod;
    } else {
      ts = (await import('typescript')).default;
    }

    const sourceCode = `import React from 'react'; export const App = () => <div>Hello World</div>;`;
    const result = ts.transpileModule(sourceCode, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        jsxImportSource: 'react',
      },
    });

    expect(result.outputText.includes('react/jsx-runtime')).toBe(true);
    expect(result.outputText.includes('_jsx("div"')).toBe(true);
  });
});
