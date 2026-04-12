# Quickstart: FMC Solution Builder

**Branch**: `001-fmc-solution-builder`

---

## Prerequisites

- Node.js 20+ and npm 10+
- Modern browser (Chrome/Firefox/Safari last 2 major versions)

---

## Project Setup (greenfield)

The repository currently has no `src/` directory. Bootstrap a SvelteKit static project:

```bash
# From repo root
npm create svelte@latest .
# Select: SvelteKit minimal, TypeScript, no additional tools (add Vitest manually)

npm install
npm install -D vitest @vitest/ui
npm install @cubing/cubing
```

Configure static adapter in `svelte.config.js`:

```js
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({ fallback: 'index.html' })
  }
};
```

Add Vitest config in `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node'   // domain tests run in Node; no browser needed
  }
});
```

---

## Source Layout

```
src/
├── lib/
│   ├── domain/                  # Pure TypeScript domain modules (TDD required)
│   │   ├── types.ts             # Shared types: Move, Variation, Session, SolutionPath
│   │   ├── moves.ts             # Move parsing & validation
│   │   ├── moves.test.ts
│   │   ├── session.ts           # Session & variation tree operations
│   │   ├── session.test.ts
│   │   ├── cube.ts              # Cube state computation (wraps @cubing/cubing)
│   │   ├── cube.test.ts
│   │   ├── scramble.ts          # Scramble generation (wraps @cubing/cubing/scramble)
│   │   └── persistence.ts       # localStorage read/write (NOT unit-tested)
│   └── components/
│       ├── ScrambleInput.svelte
│       ├── MoveInput.svelte      # Calculator-style buttons + keyboard handler
│       ├── CubeNet.svelte        # SVG 2D cube net
│       ├── VariationList.svelte
│       └── SolutionView.svelte   # Step-by-step + simple sequence display
├── routes/
│   └── +page.svelte             # Single-page layout (SPA)
└── app.html
```

---

## Running Locally

```bash
npm run dev          # dev server at http://localhost:5173
npm run build        # static output to ./build/
npm run preview      # preview static build
```

---

## Running Tests

```bash
npx vitest run       # domain unit tests only (Node environment)
npx vitest           # watch mode during development
```

Tests in `src/lib/domain/**/*.test.ts` are the only automated tests. Component and E2E behaviour is verified manually.

---

## TDD Workflow (mandatory for domain modules)

Per constitution principle III:

1. Write a failing test in `*.test.ts` first.
2. Confirm it fails (`npx vitest run`).
3. Write the minimum implementation to make it pass.
4. Refactor.
5. Never commit a domain module without a corresponding test file.

---

## Key Domain Concepts (quick reference)

| Concept | Where | Summary |
|---|---|---|
| `Move` | `types.ts` | Single face turn; `notation: "R" \| "U'" \| "F2"` etc. |
| `Sequence` | `types.ts` | Saved move sequence for one step; has `stepName`, `moves[]`, and `parentId` linking to the prior step's sequence |
| `SessionState` | `types.ts` | Serialisable snapshot of one FMC attempt; holds `scramble`, `sequences[]`, and `activeSequenceIds` per step |
| `Active Path` | `session.ts` | The currently selected chain of sequences from EO through to the latest saved step; computed via `getActiveSolution()` |
| `STEP_ORDER` | `types.ts` | `['EO','DR','HTR','Floppy','Finish']` — the five solving phases in order |

---

## Deployment

```bash
npm run build
# Upload ./build/ to any static host (GitHub Pages, Cloudflare Pages, etc.)
```

No server process is needed at runtime.
