/*
 * Copyright (C) 2023 Elijah Olmos
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import { config as dotenv_config } from 'dotenv';
import { defineConfig } from 'rollup';
import { chromeExtension, simpleReloader } from 'rollup-plugin-chrome-extension';
import copy from 'rollup-plugin-copy';
import { emptyDir } from 'rollup-plugin-empty-dir';
import postcss from 'rollup-plugin-postcss';
import svelte from 'rollup-plugin-svelte';
import { terser } from 'rollup-plugin-terser';
import zipDir from 'rollup-plugin-zipdir';
import sveltePreprocess from 'svelte-preprocess';
import _env from './.env.js';
dotenv_config();

const production = !process.env.ROLLUP_WATCH;
const env = _env[production ? 'production' : 'development'];

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
			__CREDENTIALS__: JSON.stringify(env.credentials),
			__API_URL__: JSON.stringify(env.api_url),
			preventAssignment: false,
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
		production && zipDir({ name: 'chrome.zip', outputDir: 'dist' }),
	],
});

const firefox = defineConfig({
	input: 'src/manifest.json',
	output: {
		dir: 'build/firefox',
		format: 'esm',
		sourcemap: !production,
	},
	plugins: [
		emptyDir(),
		replace({
			'chrome.': 'browser.',
			delimiters: ['', ''],
			preventAssignment: false,
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
				sourceMap: !production,
			}),
		}),
		postcss(),
		resolve({
			browser: true,
			dedupe: ['svelte'],
		}),
		replace({
			__CREDENTIALS__: JSON.stringify(env.credentials),
			__API_URL__: JSON.stringify(env.api_url),
			preventAssignment: false,
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
		production && terser(),
		production && zipDir({ name: 'firefox.zip', outputDir: 'dist' }),
	],
});

export default (cmdArgs) => {
	const res = [];
	if (!!cmdArgs.configChrome) res.push(chrome);
	if (!!cmdArgs.configFirefox) res.push(firefox);
	return res;
};
