import { bold, green } from 'colorette';
import { strToU8, zip as zipCb } from 'fflate';
import filesize from 'filesize';
import { readFile, writeFile } from 'node:fs/promises';
import { relative } from 'node:path';
import { promisify } from 'node:util';
import { OutputOptions } from 'rollup';

/**
 * @typedef ZipConfigOptions
 * @type {object}
 * @property {string} fileName - name of output zip file
 * @property {string} [dir] - Output directory, defaults to rollup output directory
 */

/**
 * @param {ZipConfigOptions} options
 */
export default function zip(options) {
	return {
		name: 'zip',
		/**
		 * @param {OutputOptions} options
		 * @param {Object.<string, {source: string | Uint8Array}>} bundle
		 */
		writeBundle: async function (_options, bundle) {
			const dir = options?.dir ?? _options?.dir ?? process.cwd();
			const { fileName } = options;

			const data = await promisify(zipCb)(
				await Object.entries(bundle).reduce(
					async (acc, [name, { type, source }]) => ({
						...(await acc),
						[name]:
							type === 'asset'
								? typeof source === 'string'
									? strToU8(source)
									: source
								: await readFile(`${_options?.dir}/${name}`),
					}),
					{}
				)
			);
			await writeFile(`./${relative(process.cwd(), dir)}/${fileName}`, data);
			console.log(green(`zipped to ${bold(`${dir}/${fileName}`)} (${filesize(data.byteLength)})`));
		},
	};
}
