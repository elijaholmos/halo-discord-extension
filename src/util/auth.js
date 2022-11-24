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

import { getIdToken, signInWithCustomToken } from 'firebase/auth';
import { get, increment, ref, serverTimestamp, set, update } from 'firebase/database';
import { stores } from '../stores';
import credentials from './credentials';
import { validateCookie } from './halo';
import { auth, db, encryptCookieObject, getHaloCookies, isValidCookieObject } from './util';
const url = __API_URL__;

export const fetchDiscordUser = async function ({ access_token, count = 0 } = stores.discord_tokens.get()) {
	try {
		const res = await fetch(`${url}/me`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({ access_token }).toString(),
		});

		if (res.status === 401 || res.status === 403)
			return await refreshDiscordToken().then((token) =>
				fetchDiscordUser({ access_token: token, count: ++count })
			);

		return await res.json();
	} catch (err) {
		console.error(err, `Count: ${count++}`);
		if (count >= 5) {
			console.log('count >= 5, prompting reauthentication');
			promptDiscordReauthentication();
			return null;
		}
		return await fetchDiscordUser({ count });
	}
};

export const promptDiscordReauthentication = function () {
	stores.require_discord_reauth.set(true);
};

export const refreshDiscordToken = async function ({ refresh_token } = stores.discord_tokens.get()) {
	try {
		//get an access token using the refresh token
		const res = await fetch(`${url}/refresh`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({ refresh_token }).toString(),
		});

		if (res.status !== 200) throw new Error(await res.text());

		const tokens = await res.json();

		console.log('Refreshed token response:', tokens);

		const { access_token } = tokens;
		//store token locally
		stores.discord_tokens.set(tokens);
		//store tokens in DB
		update(ref(db, `discord_tokens/${auth.currentUser.uid}`), tokens);

		//lastly, return the access token
		return access_token;
	} catch (err) {
		console.error(err);
		throw err;
	}
};

export const getUserJwt = async function ({ access_token } = stores.discord_tokens.get()) {
	try {
		const token = await getIdToken(auth?.currentUser);
		console.log('[getUserJwt] retrieved token', token);
		return token;
	} catch (err) {
		console.log('[getUserJwt] caught error', err);

		if (!access_token) throw new Error('[getUserJwt] No Discord access token');
		const res = await fetch(`${url}/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ access_token }),
		});

		if (res.status !== 200) throw new Error(await res.text());

		return (await res.json()).token;
	}
};

export const getDefaultSettings = async function () {
	try {
		console.log('getDefaultSettings');
		const settings = await get(ref(db, 'default_settings'));
		return settings.exists() ? settings.val() : {};
	} catch (e) {
		console.error('getUserSettings error', e);
		return {};
	}
};

export const getUserSettings = async function () {
	try {
		console.log('getUserSettings');
		const { uid } = auth.currentUser || {};
		if (!uid) throw new Error('Cannot retrieve user settings; user is not signed in');
		const settings = await get(ref(db, `user_settings/${uid}`));
		return settings.exists() ? settings.val() : {};
	} catch (e) {
		console.error('getUserSettings error', e);
		return {};
	}
};

export const updateUserSettings = async function (settings) {
	console.log('updateUserSettings');
	const { uid } = auth.currentUser || {};
	if (!uid) throw new Error('Cannot update user settings; user is not signed in');
	if (!settings || !Object.keys(settings).length)
		throw new Error('Cannot update user settings; no settings provided');
	if (Array.isArray(settings)) settings = { ...settings };
	await update(ref(db, `user_settings/${uid}`), settings);
};

export const setUserCookies = async function ({ uid, cookies }) {
	console.log('in setUserCookies');
	const encrypted_cookie = await encryptCookieObject(cookies);
	if (!isValidCookieObject(encrypted_cookie)) throw new Error('Invalid cookie object');
	return await set(ref(db, `cookies/${uid}`), { ...encrypted_cookie, timestamp: serverTimestamp() });
};

const convertDiscordAuthCodeToToken = async function ({ auth_code }) {
	const res = await fetch(`${url}/code`, {
		method: 'POST',
		//application/x-www-form-urlencoded to avoid preflight which doesn't work w/ my vercel funcs for some reason
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			code: auth_code,
			redirect_uri: chrome.identity.getRedirectURL(),
		}).toString(),
	});

	return await res.json().catch(() => null);
};

export const triggerDiscordAuthFlow = function () {
	return new Promise((resolve, reject) => {
		// CHROME RESTRICTION: is documented as returning a promise, does not actually return a promise
		chrome.identity.launchWebAuthFlow(
			{
				url: `https://discord.com/api/oauth2/authorize?response_type=code&client_id=${
					credentials.discord.client_id
				}&redirect_uri=${encodeURIComponent(chrome.identity.getRedirectURL())}&scope=identify`,
				interactive: true,
			},
			async (redirect_url) => {
				try {
					if (!redirect_url) return console.error('No redirect url');
					const REAUTH = stores.require_discord_reauth.get() === true;
					const tokens = await convertDiscordAuthCodeToToken({
						auth_code: new URL(redirect_url).searchParams.get('code'),
					});
					const { access_token } = tokens;
					console.log('tokens', tokens);
					//fetch Discord user info
					const { id: discord_uid } = await fetchDiscordUser(tokens);
					console.log(`discord_uid: ${discord_uid}`);

					if (REAUTH)
						if (discord_uid === stores.discord_info.get()?.discord_uid) {
							//handle reauth w diff discord ID
							stores.require_discord_reauth.set(false);
							stores.discord_tokens.set(tokens);
							//store discord tokens in DB
							await update(ref(db, `discord_tokens/${auth.currentUser.uid}`), tokens);
							return resolve();
						} else throw new Error('You cannot login with a different Discord account');

					//set uninstall URL for internal purposes
					chrome.runtime.setUninstallURL(
						`http://www.glassintel.com/elijah/programs/halodiscord/uninstall?${new URLSearchParams({
							access_token,
						}).toString()}`
					);

					//retrieve token from api (BEFORE storing local discord info)
					const jwt = await getUserJwt({ access_token });
					//sign in the user
					const { user } = await signInWithCustomToken(auth, jwt);
					console.log('retrieved token and signed in', user);

					//store tokens locally - this triggers settings popup (which requires user to be signed in to firebase)
					stores.discord_tokens.set(tokens);
					stores.discord_info.update({ access_token, discord_uid });

					//collect halo cookies and store in db BEFORE setting user info in firebase but AFTER authenticating user
					//this is due to the watcher in place by the bot
					try {
						console.log('sweeping cookies - initial');
						const cookies = await getHaloCookies();
						if (!isValidCookieObject(cookies)) throw new Error('Invalid cookie object');
						if (!(await validateCookie({ cookie: cookies })))
							throw new Error('cookie failed validateCookie check');

						stores.halo_cookies.update(cookies);
						!!user && (await setUserCookies({ uid: user.uid, cookies }));
					} catch (e) {
						console.error('[error] sweping cookies initial', e);
					}

					//because Firebase is dumb, we don't get a create() method like Firestore
					//so we have to check if the user exists first thru a separate query
					const user_doc_ref = ref(db, `users/${user.uid}`);
					//set created_on field in user info in Firebase (triggers bot)
					await update(user_doc_ref, {
						...(!(await get(user_doc_ref)).exists() && { created_on: serverTimestamp() }),
						ext_devices: increment(1),
					});
					//store discord tokens in DB
					await update(ref(db, `discord_tokens/${user.uid}`), tokens);

					resolve();
				} catch (e) {
					reject(e);
				}
			}
		);
	});
};

export const health = async function () {
	try {
		const version = chrome.runtime.getManifest().version;
		//get an access token using the refresh token
		const res = await fetch(`${url}/health`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ version }),
		});

		if (res.status !== 200) throw new Error(await res.text());

		const json = await res.json();
		console.log('Refreshed health response:', json);
		return json;
	} catch (err) {
		console.error(err);
		throw err;
	}
};
