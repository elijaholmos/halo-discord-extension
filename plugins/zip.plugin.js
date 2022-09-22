/*
 * Copyright (C) 2022 Elijah Olmos
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

import { bold, green } from 'colorette';
import { strToU8, zip as zipCb } from 'fflate';
import filesize from 'filesize';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
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
			//create dir if it does not exist
			await mkdir(`./${relative(process.cwd(), dir)}`, { recursive: true });
			await writeFile(`./${relative(process.cwd(), dir)}/${fileName}`, data);
			console.log(green(`zipped to ${bold(`${dir}/${fileName}`)} (${filesize(data.byteLength)})`));
		},
	};
}
