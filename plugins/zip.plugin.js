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
import { zip as zipCb } from 'fflate';
import { filesize } from 'filesize';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { promisify } from 'node:util';

/**
 * @typedef ZipConfigOptions
 * @type {object}
 * @property {string} fileName - name of output zip file
 * @property {string} [dir] - Output directory, defaults to rollup output directory
 */

/**
 * nifty method I adapted from https://stackoverflow.com/a/66083078/8396479
 * @returns {Promise<string[]>}
 */
const walkDir = async function (dir) {
	const res = [];
	for await (const fname of (async function* _walkDir(dir) {
		for (const file of await readdir(dir, { withFileTypes: true }))
			file.isDirectory() ? yield* await walkDir(join(dir, file.name)) : yield join(dir, file.name);
	})(dir))
		res.push(fname);
	return res;
};

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
		writeBundle: {
			sequential: true,
			order: 'post',
			handler: async function (_options) {
				const [outputDir, inputDir, targetFiles, { fileName }] = [
					options?.dir ?? _options?.dir ?? process.cwd(),
					_options?.dir ?? process.cwd(),
					await walkDir(_options?.dir),
					options,
				];
				const data = await promisify(zipCb)(
					await targetFiles.reduce(
						async (acc, file) => ({
							...(await acc),
							[relative(inputDir, file)]: await readFile(file),
						}),
						{}
					)
				);

				//create dir if it does not exist
				await mkdir(`.${sep}${relative(process.cwd(), outputDir)}`, { recursive: true });
				await writeFile(`.${sep}${relative(process.cwd(), outputDir)}${sep}${fileName}`, data);
				console.log(green(`zipped to ${bold(`${outputDir}${sep}${fileName}`)} (${filesize(data.byteLength)})`));
			},
		},
	};
}
