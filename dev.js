import { startWebSocketServer } from './packages/server/serve.js';
import { startWebServer } from './packages/web/serve.js';

console.log('🎲 [Monopoly Vietnam Tycoon] Starting All Development Servers...\n');

startWebSocketServer(8080);
startWebServer(3000);
