# Deployment & CI/CD

This project deploys as two pieces:

- **Backend** (`packages/server` + `packages/engine`): a WebSocket room server, packaged
  as a Docker image and deployed to **Render** (free tier). It runs `packages/server/serve.js`
  directly using Node's native TypeScript support — no build step needed.
- **Frontend** (`packages/web`): a static React app, built with `vite build` and deployed
  to **Vercel**.

Every push to `main` runs `.github/workflows/ci-cd.yml`:

1. `test` job — installs deps, runs unit tests (`npm test`), the Playwright e2e smoke test
   (`npm run test:e2e`), and the production web build, as a gate.
2. `deploy-backend` job — if `test` passes, hits a Render **deploy hook** URL to redeploy the server.
3. `deploy-frontend` job — if `test` passes, builds and deploys `packages/web` to Vercel production
   using the Vercel CLI.

Both deploy jobs only run on `push` to `main` (not on pull requests), so opening a PR only runs tests.

## One-time setup

### 1. Render (backend)

1. Create a free account at https://dashboard.render.com (can sign up with GitHub).
2. **New +** → **Web Service** → connect this GitHub repository.
3. Render should detect `render.yaml` at the repo root and pre-fill the settings
   (runtime: Docker, plan: free, region: singapore). If it asks for confirmation, accept it.
4. Once the service is created, open it → **Settings** → confirm **Auto-Deploy is set to "No"**
   (already set via `render.yaml`'s `autoDeploy: false`). We deploy explicitly from CI instead,
   after tests pass, so a broken commit never reaches production untested.
5. Go to **Settings → Deploy Hook**, copy the URL shown there
   (looks like `https://api.render.com/deploy/srv-xxxxxxxxxxxx?key=yyyyyyyyyy`).
6. In GitHub: repo → **Settings → Secrets and variables → Actions → New repository secret**:
   - Name: `RENDER_DEPLOY_HOOK_URL`
   - Value: the URL you copied.
7. Note the public URL Render assigns the service (e.g. `https://monopoly-server.onrender.com`) —
   you'll need it for step 2 below. The WebSocket endpoint is the same host over `wss://`.

**About the free tier:** the service spins down after 15 minutes with no traffic and takes
~30-60s to wake back up on the next connection. Fine for checking a feature right after deploy;
upgrade the `plan` in `render.yaml` to `starter` ($7/mo) later if you want it always warm for real players.

### 2. Vercel (frontend)

1. Create a free account at https://vercel.com/signup (sign up with GitHub).
2. **Add New… → Project** → import this repository.
3. When configuring the project:
   - **Root Directory**: `packages/web`
   - **Framework Preset**: Vite (should auto-detect)
   - Leave build/output settings as detected (`vite build`, output `dist`).
4. Before the first deploy, add an environment variable so the deployed site knows where
   the game server lives: **Settings → Environment Variables**:
   - Name: `VITE_WS_URL`
   - Value: `wss://<your-render-service>.onrender.com` (the host from Render step 7 above, `wss://` not `https://`)
   - Environment: Production (and Preview if you want previews to work too)
5. **Important:** since we deploy from GitHub Actions (so deploys only happen after tests pass),
   go to **Settings → Git** and disable "Automatically deploy" for this project, otherwise Vercel
   will *also* deploy on every push on its own, bypassing the test gate.
6. Get the 3 values GitHub Actions needs:
   - `VERCEL_TOKEN`: https://vercel.com/account/tokens → **Create Token**.
   - `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`: run `npx vercel link` locally once inside
     `packages/web` (or from the Vercel dashboard: **Project Settings → General**, the
     project ID is shown there; the org/team ID is under your **Account/Team Settings → General**).
7. In GitHub: repo → **Settings → Secrets and variables → Actions**, add:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

### 3. First deploy

Push to `main` (or merge a PR into it). Watch the **Actions** tab in GitHub — the `test` job
runs first, then `deploy-backend` and `deploy-frontend` run in parallel. Once green:

- Frontend: the Vercel production URL shown on your Vercel project dashboard.
- Backend: the Render service URL from step 1.7 above.

## Day-to-day workflow

Once set up, the loop the project owner asked for is automatic: merge a feature branch into
`main` → CI runs tests → on success both services redeploy → check the Vercel production URL.
No manual deploy steps needed after this one-time setup.
