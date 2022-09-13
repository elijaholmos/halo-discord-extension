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

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import credentials from './credentials';

const app = initializeApp(credentials.firebase);
export const auth = getAuth(app);
export const db = getDatabase(app);

export const getHaloCookies = async function () {
	try {
		console.log('getHaloCookies');
		const cookies = (await chrome.cookies.getAll({ url: 'https://halo.gcu.edu' }))
			.reduce((acc, { name, value }) => ({ ...acc, [name]: value }), {});
		// for (const cookie of cookies) {
		// 	await chrome.storage.sync.set({ [cookie.name]: cookie.value });
		// 	!!auth.currentUser &&
		// 		(await set(child(ref(db, `cookies/${auth.currentUser.uid}`), cookie.name), cookie.value));
		// }
		return cookies;
	} catch (e) {
		console.log('getHaloCookies error', e);
		return {};
	}
};
