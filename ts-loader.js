import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';

// In-memory mock WS implementation for 0-dependency offline test execution
class MockWebSocket extends EventEmitter {
  readyState = 1; // OPEN
  static OPEN = 1;
  send(data) {
    // mock send
  }
  close() {
    this.emit('close');
  }
}

class MockWSServer extends EventEmitter {
  constructor(options) {
    super();
  }
  close() {}
}

MockWSServer.WebSocket = MockWebSocket;

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'ws') {
    return {
      url: 'data:text/javascript,import { EventEmitter } from "events"; class MockWebSocket extends EventEmitter { readyState = 1; static OPEN = 1; send(data) {} close() { this.emit("close"); } }; class MockWSServer extends EventEmitter { constructor() { super(); } close() {} }; MockWSServer.WebSocket = MockWebSocket; export { MockWSServer as WebSocketServer, MockWebSocket as WebSocket };',
      format: 'module',
      shortCircuit: true,
    };
  }

  if (specifier.startsWith('@monopoly/engine')) {
    const relativePath = specifier.replace('@monopoly/engine', './packages/engine/src/index.ts');
    const fullPath = path.resolve(relativePath);
    return {
      url: `file://${fullPath}`,
      shortCircuit: true,
    };
  }

  if ((specifier.startsWith('.') || specifier.startsWith('file:')) && context.parentURL) {
    try {
      const parentPath = new URL(context.parentURL).pathname;
      const parentDir = path.dirname(parentPath);

      if (specifier.endsWith('.js')) {
        const tsSpecifier = specifier.slice(0, -3) + '.ts';
        const tsPath = path.resolve(parentDir, tsSpecifier);
        if (fs.existsSync(tsPath)) {
          return {
            url: `file://${tsPath}`,
            shortCircuit: true,
          };
        }
      }

      if (!path.extname(specifier)) {
        const tsPath = path.resolve(parentDir, specifier + '.ts');
        if (fs.existsSync(tsPath)) {
          return {
            url: `file://${tsPath}`,
            shortCircuit: true,
          };
        }
        const indexTsPath = path.resolve(parentDir, specifier, 'index.ts');
        if (fs.existsSync(indexTsPath)) {
          return {
            url: `file://${indexTsPath}`,
            shortCircuit: true,
          };
        }
      }
    } catch (e) {
      // fallback
    }
  }

  return nextResolve(specifier, context);
}
