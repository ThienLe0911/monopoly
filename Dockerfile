#syntax=docker/dockerfile:1
# Production image for the Monopoly Vietnam Tycoon WebSocket room server
# (packages/server + packages/engine). Runs on Node's native TypeScript
# type-stripping, the same way the project runs locally via `npm run dev:server`.
FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/engine/package.json packages/engine/package.json
COPY packages/server/package.json packages/server/package.json
COPY packages/web/package.json packages/web/package.json

RUN npm ci

COPY ts-loader.js ./ts-loader.js
COPY packages/engine/src packages/engine/src
COPY packages/server/src packages/server/src
COPY packages/server/serve.js packages/server/serve.js

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "--experimental-loader", "./ts-loader.js", "--experimental-strip-types", "packages/server/serve.js"]
