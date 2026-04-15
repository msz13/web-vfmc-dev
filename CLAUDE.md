# web-vfmc-dev Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-14

## Active Technologies
- TypeScript 5.x + SvelteKit `@sveltejs/adapter-static`, `@cubing/cubing` (TwistyPlayer accepts rotation tokens x/y/z as part of alg string) (002-cube-rotation-substeps)
- `localStorage` via existing `persistence.ts` (002-cube-rotation-substeps)

- TypeScript 5.x, SvelteKit (latest stable) + `@sveltejs/kit`, `@sveltejs/adapter-static`, `@cubing/cubing`, Vitest (001-fmc-solution-builder)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x, SvelteKit (latest stable): Follow standard conventions

## Recent Changes
- 002-cube-rotation-substeps: Added TypeScript 5.x + SvelteKit `@sveltejs/adapter-static`, `@cubing/cubing` (TwistyPlayer accepts rotation tokens x/y/z as part of alg string)

- 001-fmc-solution-builder: Added TypeScript 5.x, SvelteKit (latest stable) + `@sveltejs/kit`, `@sveltejs/adapter-static`, `@cubing/cubing`, Vitest

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
