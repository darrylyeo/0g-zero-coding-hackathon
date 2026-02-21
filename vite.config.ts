import tailwindcss from '@tailwindcss/vite'
import devtoolsJson from 'vite-plugin-devtools-json'
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const stubDir = path.resolve(__dirname, 'src/lib/stubs')

export default defineConfig(({ isSsrBuild }) => ({
	plugins: [tailwindcss(), sveltekit(), devtoolsJson()],
	define: {
		global: 'globalThis',
		'process.browser': true,
	},
	optimizeDeps: {
		include: ['crypto-browserify', 'path-browserify', 'readable-stream', 'stream-browserify'],
	},
	build: {
		commonjsOptions: {
			transformMixedEsModules: true,
			include: [/node_modules/],
		},
	},
	resolve: {
		alias: {
			'node:crypto': 'crypto-browserify',
			'node:fs/promises': path.resolve(stubDir, 'empty-node.ts'),
			'fs/promises': path.resolve(stubDir, 'empty-node.ts'),
			'fs': path.resolve(stubDir, 'empty-fs.ts'),
			'path': 'path-browserify',
			stream: 'stream-browserify',
			...(isSsrBuild === false
				? { child_process: path.resolve(stubDir, 'empty-child-process.ts') }
				: {}),
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
}))
