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

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import credentials from './credentials';
import { encrypt } from './encryption';
import { AUTHORIZATION_KEY, CONTEXT_KEY } from './halo';

const app = initializeApp(credentials.firebase);
export const auth = getAuth(app);
export const db = getDatabase(app);

/**
 * @returns {boolean}
 */
export const isValidCookieObject = function (obj) {
	return obj?.hasOwnProperty(AUTHORIZATION_KEY) && obj?.hasOwnProperty(CONTEXT_KEY);
};

export const getHaloCookies = async function () {
	try {
		console.log('in getHaloCookies');
		return (await chrome.cookies.getAll({ url: 'https://halo.gcu.edu' })).reduce(
			(acc, { name, value }) => ({ ...acc, [name]: value }),
			{}
		);
	} catch (e) {
		console.log('getHaloCookies error', e);
		return {};
	}
};

export const encryptCookieObject = async function (cookie) {
	try {
		const { [AUTHORIZATION_KEY]: auth, [CONTEXT_KEY]: context } = cookie;
		if (!auth || !context)
			throw new Error(`[encryptCookie] Unable to destructure cookie object, ${JSON.stringify(cookie)}`);

		const encrypted_auth = await encrypt(auth);
		const encrypted_context = await encrypt(context);

		if (!encrypted_auth || !encrypted_context)
			throw new Error(`[encryptCookie] Unable to encrypt cookie object, ${JSON.stringify(cookie)}`);

		return { ...cookie, [AUTHORIZATION_KEY]: encrypted_auth, [CONTEXT_KEY]: encrypted_context };
	} catch (e) {
		console.log(e);
		return null;
	}
};

export const setUninstallURL = async function (access_token) {
	chrome.runtime.setUninstallURL(
		`http://www.glassintel.com/elijah/programs/halodiscord/uninstall2?${new URLSearchParams({
			access_token,
		}).toString()}`
	);
};
