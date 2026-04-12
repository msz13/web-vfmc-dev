# CI/CD Workflow Contract

**Phase**: 1 — Design  
**Branch**: `001-fmc-solution-builder`

---

## Overview

| Workflow | File | Repo | Trigger | Purpose |
|---|---|---|---|---|
| CI + Test Deploy | `.github/workflows/ci.yml` | `web-vfmc-dev` | Push to `main` / PR | Run tests, then publish test site |
| Production Deploy | `.github/workflows/deploy.yml` | `web-vfmc-dev` | Manual dispatch | Build + push to prod repo |

**Test site URL**: `https://msz13.github.io/web-vfmc-dev/`  
**Production URL**: `https://msz13.github.io/web_vfmc/`

---

## `paths.base` per environment

SvelteKit must know the URL subpath it is deployed under. Since both environments are project repos (not user/org root pages), each has a different base path.

| Environment | Repo | GitHub Pages URL | `paths.base` |
|---|---|---|---|
| Test | `web-vfmc-dev` | `msz13.github.io/web-vfmc-dev/` | `/web-vfmc-dev` |
| Production | `msz13/web_vfmc` | `msz13.github.io/web_vfmc/` | `/web_vfmc` |

Pass the base path via an environment variable at build time so the same codebase serves both environments:

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const base = process.env.BASE_PATH ?? '';

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({ fallback: 'index.html' }),
    paths: { base }
  }
};
```

Workflows set `BASE_PATH` in the build step:
- CI test deploy: `BASE_PATH=/web-vfmc-dev npm run build`
- Production deploy: `BASE_PATH=/web_vfmc npm run build`

---

## Workflow 1: CI + Test Deploy (`ci.yml`)

**Repo**: `web-vfmc-dev`  
**Trigger**: `push` to `main`; `pull_request` on all branches

### Jobs

**Job `test`** — runs on every push and PR:
1. Checkout
2. Node.js 20 + `npm ci`
3. `npx vitest run` — fails the job if any domain test fails

**Job `deploy-test`** — runs on push to `main` only, after `test` passes:
1. Checkout
2. Node.js 20 + `npm ci`
3. `BASE_PATH=/web-vfmc-dev npm run build`
4. Deploy `./build/` to the `gh-pages` branch of `web-vfmc-dev` using `peaceiris/actions-gh-pages` with `GITHUB_TOKEN` (no PAT needed — same repo)

### Intent

- `test` job enforces constitution principle III on all PRs and pushes.
- `deploy-test` gives a live, inspectable URL after every merge to `main` — this is the test site reviewed before triggering a production deploy.
- No secrets required beyond the automatically available `GITHUB_TOKEN`.

### Annotated workflow

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx vitest run

  deploy-test:
    needs: test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - run: npm run build
        env:
          BASE_PATH: /web-vfmc-dev

      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_branch: gh-pages
          publish_dir: ./build
          commit_message: "test-deploy: ${{ github.sha }}"
```

### Repository setup for test site

- In `web-vfmc-dev`: Settings → Pages → Source: **Deploy from a branch** → Branch: `gh-pages` → `/ (root)`.
- The `gh-pages` branch is created automatically on first deploy.
- No extra secrets required.

---

## Workflow 2: Production Deploy (`deploy.yml`)

**Repo**: `web-vfmc-dev`  
**Trigger**: `workflow_dispatch` (manual only)

### Intent

Triggered by the developer after the test site has been manually verified against SC-001–SC-006. Builds the static site with the production base path and pushes to the `gh-pages` branch of `msz13/web_vfmc`.

### Prerequisites

- Repository secret `DEPLOY_PAT` set in `web-vfmc-dev` with `contents: write` permission on `msz13/web_vfmc`.
- `msz13/web_vfmc`: Settings → Pages → Source: **Deploy from a branch** → Branch: `gh-pages` → `/ (root)`.

### Annotated workflow

```yaml
name: Deploy to Production

on:
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - run: npm run build
        env:
          BASE_PATH: /web_vfmc

      - uses: peaceiris/actions-gh-pages@v4
        with:
          personal_token: ${{ secrets.DEPLOY_PAT }}
          external_repository: msz13/web_vfmc
          publish_branch: gh-pages
          publish_dir: ./build
          commit_message: "deploy: ${{ github.sha }}"
```

---

## Required Secrets

| Secret | Set in repo | Value |
|---|---|---|
| `GITHUB_TOKEN` | Automatic | Built-in; used for test deploy to same repo |
| `DEPLOY_PAT` | `web-vfmc-dev` settings | PAT with `contents: write` on `msz13/web_vfmc` |

---

## Deploy Gate

No automated production deploy occurs. The developer must:
1. Verify the test site at `https://msz13.github.io/web-vfmc-dev/` against manual test criteria (SC-001–SC-006).
2. Trigger the `Deploy to Production` workflow manually via the GitHub Actions UI.
