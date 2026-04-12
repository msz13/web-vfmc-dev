import sveltePlugin from 'eslint-plugin-svelte';
import tseslint from 'typescript-eslint';
import svelteParser from 'svelte-eslint-parser';

export default [
  ...tseslint.configs.recommended,
  ...sveltePlugin.configs['flat/recommended'],
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
  {
    ignores: ['node_modules/', '.svelte-kit/', 'build/', 'public/', 'specs/'],
  },
];
