import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import sveltePlugin from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import prettier from 'eslint-config-prettier';

export default [
	js.configs.recommended,
	{
		files: ['**/*.{js,ts,svelte}'],
		plugins: {
			'@typescript-eslint': tsPlugin,
			svelte: sveltePlugin
		},
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				sourceType: 'module',
				ecmaVersion: 2020,
				extraFileExtensions: ['.svelte']
			},
			globals: {
				window: true,
				document: true,
				Event: true,
				DragEvent: true,
				HTMLElement: true,
				HTMLInputElement: true,
				File: true,
				sessionStorage: true
			}
		},

		rules: {
			// TypeScript rules
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^\\$'
				}
			],
			'no-unused-vars': 'off', // Turn off base rule

			// Svelte rules
			'svelte/valid-compile': 'error',
			'svelte/no-unused-svelte-ignore': 'error',
			'svelte/spaced-html-comment': 'error',

			// General rules
			'no-console': 'off', // Disabled during development
			'no-debugger': 'warn'
		}
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parser: svelteParser,
			parserOptions: {
				parser: tsParser // Use TypeScript parser for script blocks
			}
		}
	},
	prettier,
	...sveltePlugin.configs['flat/prettier']
];
