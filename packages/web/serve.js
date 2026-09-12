import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

let tsInstance = null;

async function getTypeScript() {
  if (tsInstance) return tsInstance;
  try {
    const mod = await import('typescript');
    tsInstance = mod.default || mod;
    return tsInstance;
  } catch (err) {
    const fallbackPaths = [
      '/Applications/Visual Studio Code.app/Contents/Resources/app/extensions/node_modules/typescript/lib/typescript.js',
      '/Applications/Antigravity IDE.app/Contents/Resources/app/extensions/node_modules/typescript/lib/typescript.js',
    ];
    for (const p of fallbackPaths) {
      if (fs.existsSync(p)) {
        const mod = await import(`file://${p}`);
        tsInstance = mod.default || mod;
        return tsInstance;
      }
    }
    throw new Error('TypeScript module not found for runtime transpilation');
  }
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.ts': 'application/javascript; charset=utf-8',
  '.tsx': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

function resolveFilePath(pathname) {
  let targetPath;
  if (pathname.startsWith('/packages/')) {
    targetPath = path.join(rootDir, pathname);
  } else {
    targetPath = path.join(__dirname, pathname);
  }

  const resolved = path.resolve(targetPath);

  // Security check: prevent traversal outside rootDir
  if (!resolved.startsWith(rootDir)) {
    return null;
  }

  // Exact file match
  if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
    return resolved;
  }

  // Auto-extension candidates for imports without extensions
  const candidates = [
    resolved + '.tsx',
    resolved + '.ts',
    resolved + '.jsx',
    resolved + '.js',
    path.join(resolved, 'index.tsx'),
    path.join(resolved, 'index.ts'),
    path.join(resolved, 'index.jsx'),
    path.join(resolved, 'index.js'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  return null;
}

export function startWebServer(port = 3000) {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let pathname = url.pathname;

    if (pathname === '/') {
      pathname = '/index.html';
    }

    const resolvedFile = resolveFilePath(pathname);

    if (!resolvedFile) {
      // Fallback to index.html for SPA routing if HTML requested
      if (req.headers.accept?.includes('text/html') || req.headers['sec-fetch-dest'] === 'document') {
        const indexPath = path.join(__dirname, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.writeHead(200, { 'Content-Type': MIME_TYPES['.html'] });
          res.end(fs.readFileSync(indexPath));
          return;
        }
      }

      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }

    const ext = path.extname(resolvedFile).toLowerCase();

    try {
      if (ext === '.ts' || ext === '.tsx') {
        const ts = await getTypeScript();
        const content = fs.readFileSync(resolvedFile, 'utf-8');
        const transpileResult = ts.transpileModule(content, {
          compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2022,
            jsx: ts.JsxEmit.ReactJSX,
            jsxImportSource: 'react',
            inlineSourceMap: true,
            inlineSources: true,
          },
          fileName: resolvedFile,
        });

        res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
        res.end(transpileResult.outputText);
        return;
      }

      if (ext === '.css') {
        const content = fs.readFileSync(resolvedFile, 'utf-8');
        const isStyleLink = req.headers['sec-fetch-dest'] === 'style' || req.headers.accept?.includes('text/css');
        if (isStyleLink) {
          res.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8' });
          res.end(content);
        } else {
          // JS wrapper for CSS import in ES modules
          const jsCode = `
const style = document.createElement('style');
style.setAttribute('data-file', ${JSON.stringify(pathname)});
style.textContent = ${JSON.stringify(content)};
document.head.appendChild(style);
`;
          res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
          res.end(jsCode);
        }
        return;
      }

      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const content = fs.readFileSync(resolvedFile);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch (err) {
      console.error(`[Web UI Server Error] ${pathname}:`, err);
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`Internal Server Error: ${err.message}`);
    }
  });

  server.listen(port, '127.0.0.1', () => {
    console.log(`🚀 [Web UI Server] Live at http://localhost:${port}`);
  });

  return server;
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('packages/web/serve.js')) {
  startWebServer(3000);
}
