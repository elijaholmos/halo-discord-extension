import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import { defineConfig } from 'rollup';
import { chromeExtension, simpleReloader } from 'rollup-plugin-chrome-extension';
import copy from 'rollup-plugin-copy';
import { emptyDir } from 'rollup-plugin-empty-dir';
import license from 'rollup-plugin-license';
import postcss from 'rollup-plugin-postcss';
import svelte from 'rollup-plugin-svelte';
import { terser } from 'rollup-plugin-terser';
import sveltePreprocess from 'svelte-preprocess';
import credentials from './credentials';

const production = !process.env.ROLLUP_WATCH;

const chrome = defineConfig({
	input: 'src/manifest.json',
	output: {
		dir: 'build/chrome',
		format: 'esm',
		sourcemap: !production,
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
		replace({
			__CREDENTIALS__: JSON.stringify(production ? credentials.production : credentials.development),
		}),
		//license({}),
		copy({
			targets: [
				{
					src: 'src/static/*',
					dest: 'build/chrome/static',
				},
			],
			// seems to be some issues w svelte & copy plugins (https://github.com/vladshcherbin/rollup-plugin-copy/issues/55)
			hook: 'writeBundle',
			verbose: true,
		}),
		production && terser(),
	],
});

const firefox = defineConfig({
	input: 'src/manifest.json',
	output: {
		dir: 'build/firefox',
		format: 'esm',
		sourcemap: true,
	},
	plugins: [
		emptyDir(),
		replace({
			'chrome.': 'browser.',
			delimiters: ['', ''],
		}),
		chromeExtension({
			extendManifest: (manifest) => {
				const remove = ['host_permissions', 'action'];
				Object.assign(manifest, {
					manifest_version: 2,
					permissions: [...manifest.permissions, ...manifest.host_permissions],
					browser_action: manifest.action,
					background: { page: 'background.html' },
					browser_specific_settings: { gecko: { id: 'hns@hns.com' } },
				});
				for (const key of remove) delete manifest[key];

				return manifest;
			},
		}),
		//simpleReloader(),
		svelte({
			//will throw bundle errors since I haven't configured external css
			//emitCss: false,
			compilerOptions: {
				// enable run-time checks when not in production
				dev: !production,
			},
			preprocess: sveltePreprocess({
				sourceMap: true,
			}),
		}),
		postcss(),
		resolve({
			browser: true,
			dedupe: ['svelte'],
		}),
		replace({
			__CREDENTIALS__: JSON.stringify(production ? credentials.production : credentials.development),
		}),
		copy({
			targets: [
				{
					src: 'src/static/*',
					dest: 'build/firefox/static',
				},
			],
			// seems to be some issues w svelte & copy plugins (https://github.com/vladshcherbin/rollup-plugin-copy/issues/55)
			hook: 'writeBundle',
			verbose: true,
		}),
	],
});

export default (cmdArgs) => {
	const res = [];
	if (!!cmdArgs.configChrome) res.push(chrome);
	if (!!cmdArgs.configFirefox) res.push(firefox);
	return res;
};
