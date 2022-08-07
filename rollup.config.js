import resolve from '@rollup/plugin-node-resolve';
import { defineConfig } from 'rollup';
import {
	chromeExtension,
	simpleReloader,
} from 'rollup-plugin-chrome-extension';
import copy from 'rollup-plugin-copy';
import { emptyDir } from 'rollup-plugin-empty-dir';
import postcss from 'rollup-plugin-postcss';
import svelte from 'rollup-plugin-svelte';
import { terser } from 'rollup-plugin-terser';
import zip from 'rollup-plugin-zip';
import sveltePreprocess from 'svelte-preprocess';

const production = !process.env.ROLLUP_WATCH;

export default defineConfig({
	input: 'src/manifest.json',
	output: {
		dir: 'dist',
		format: 'esm',
		sourcemap: true,
	},
	plugins: [
		emptyDir(),
		chromeExtension(),
		simpleReloader(),
		svelte({
			//will throw bundle errors since I haven't configured external css
			//emitCss: false,
			compilerOptions: {
				// enable run-time checks when not in production
				dev: !production,
			},
			preprocess: sveltePreprocess({
				sourceMap: !production,
			}),
		}),
		postcss(),
		resolve({
			browser: true,
			dedupe: ['svelte'],
		}),
		copy({
			targets: [
				{
					src: 'src/static/*',
					dest: 'dist/static',
				},
			],
			// seems to be some issues w svelte & copy plugins (https://github.com/vladshcherbin/rollup-plugin-copy/issues/55)
			hook: 'writeBundle',
			verbose: true,
		}),
		production && terser(),
		production && zip({ dir: 'dist_packed' }),
	],
});
