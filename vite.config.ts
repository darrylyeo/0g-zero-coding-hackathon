import tailwindcss from '@tailwindcss/vite'
import devtoolsJson from 'vite-plugin-devtools-json'
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), devtoolsJson()],
	define: {
		global: 'globalThis',
		'process.browser': true,
	},
	optimizeDeps: {
		include: ['crypto-browserify', 'readable-stream', 'stream-browserify'],
	},
	build: {
		commonjsOptions: {
			transformMixedEsModules: true,
		},
	},
	resolve: {
		alias: {
			'node:crypto': 'crypto-browserify',
			'node:fs/promises': path.resolve(__dirname, 'src/lib/stubs/empty-node.ts'),
			'fs/promises': path.resolve(__dirname, 'src/lib/stubs/empty-node.ts'),
			'fs': path.resolve(__dirname, 'src/lib/stubs/empty-fs.ts'),
			'path': 'path-browserify',
			stream: 'stream-browserify',
		},
	},
	test: {
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					environment: 'browser',
					browser: {
						enabled: true,
						provider: 'playwright',
						instances: [{ browser: 'chromium' }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					setupFiles: ['./vitest-setup-client.ts']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
