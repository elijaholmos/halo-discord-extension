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

// https://firebase.google.com/docs/web/setup#available-libraries
import { compare } from 'compare-versions';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { init, stores } from './stores';
import { health, setUserCookies, triggerDiscordAuthFlow } from './util/auth';
import chromeStorageSyncStore from './util/chromeStorageSyncStore';
import { getHaloUserInfo, validateCookie } from './util/halo';
import { auth, getHaloCookies, isValidCookieObject } from './util/util';
// no stores - code is not shared between background and popup

const VERSION = chrome.runtime.getManifest().version;
const COOKIE_KEY = 'halo_cookies';
const firebaseSignIn = async function () {
	console.log('in firebaseSignIn');
	try {
		const { discord_uid, access_token } = stores.discord_info.get();
		if (!discord_uid) throw new Error('no discord_uid');
		if (!access_token) throw new Error('no access_token');
		await signInWithEmailAndPassword(auth, `${discord_uid}@halodiscord.app`, access_token);
	} catch (e) {
		console.warn('Firebase signin failed', e);
	}
};

(async function () {
	console.log(`${chrome.runtime.getManifest().name} v${VERSION}`);

	// check & clear localstorage
	const { last_cleared_version } = await chrome.storage.sync.get('last_cleared_version');
	if (!last_cleared_version || compare(last_cleared_version, '2.0.0', '<')) {
		console.log('clearing local storage');
		await chrome.storage.sync.clear();
		chrome.storage.sync.set({ last_cleared_version: VERSION });
	}

	console.log('initializing ApplicationStoreManager');
	const initial_cookies = await getHaloCookies();
	await init([
		//chromeStorageSyncStore({ key: 'test', initial_value: 'a' }),
		//chromeStorageSyncStore({ key: 'test2' }),
		chromeStorageSyncStore({ key: 'discord_tokens' }),
		chromeStorageSyncStore({ key: 'discord_info' }),
		chromeStorageSyncStore({ key: COOKIE_KEY, initial_value: initial_cookies }),
		chromeStorageSyncStore({ key: 'halo_info', initial_value: () => getHaloUserInfo({ cookie: initial_cookies }) }),
		chromeStorageSyncStore({ key: 'require_discord_reauth' }),
		chromeStorageSyncStore({ key: 'accepted_tos' }),
		chromeStorageSyncStore({ key: 'health', initial_value: () => health() }),
	]);
	console.log('ApplicationStoreManager initialized');
	console.log(stores);

	// FIREFOX RESTRICTION: popup is closed during auth, so it needs to be triggered from background script
	chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
		(async () => {
			try {
				if (sender.id !== chrome.runtime.id) return console.log('ids are not equal');
				console.log('auth.currentUser', auth.currentUser);
				msg === 'launch_auth' && (await triggerDiscordAuthFlow());
				sendResponse(null);
			} catch (error) {
				sendResponse(JSON.stringify(error?.message || error));
			}
		})();
		return true; //required if using async/await in a message listener
	});

	if (!auth.currentUser) await firebaseSignIn();
	console.log(auth?.currentUser?.uid);

	//halo_cookies.set(await getHaloCookies()); //should be unnecessary w initial_value

	chrome.runtime.onInstalled.addListener(({ reason }) => {
		console.log('onInstalled', reason);
		switch (reason) {
			case chrome.runtime.OnInstalledReason.INSTALL:
				// currently broken, see https://github.com/GoogleChrome/developer.chrome.com/issues/2602
				chrome.action.openPopup();
				break;
			// case chrome.runtime.OnInstalledReason.UPDATE:
			// 	!!auth?.currentUser && set(ref(db, `users/${auth.currentUser.uid}/extension_version`), VERSION);
			// 	break;
		}
	});

	//watch for cookie updates
	//store cookies locally to compare changes
	chrome.cookies.onChanged.addListener(async ({ cookie }) => {
		console.log(`cookie changed: ${cookie.name}`);
		//what about when cookie.value === null/undefined?
		if (cookie.domain !== 'halo.gcu.edu') return;
		const stored_cookie = stores.halo_cookies.get(cookie.name); //assumes store is in sync with localstorage
		if (stored_cookie[cookie.name] !== cookie.value) {
			//filter duplicates to avoid extra work
			console.log(`found non-dup cookie: ${cookie.name}`);
			stores.halo_cookies.update({ [cookie.name]: cookie.value });
			//refresh halo user info in case of login/logout
			stores.halo_info.update(await getHaloUserInfo({ cookie: stores.halo_cookies.get() }));
		}

		// push cookies to db every COOKIE_PUSH_INTERVAL
		await pushCookiesToDatabase();
	});

	// push cookies to db every COOKIE_PUSH_INTERVAL
	let currently_pushing_cookies = false;
	const pushCookiesToDatabase = async function pushCookiesToDatabaseWrapper() {
		if (currently_pushing_cookies) return;
		currently_pushing_cookies = true;

		await (async () => {
			if (!auth?.currentUser) return;
			console.log('beginning pushCookiesToDatabase');
			const COOKIE_PUSH_INTERVAL = 1000 * 60 * 60 * 1; //1h
			const { last_cookie_push } = await chrome.storage.sync.get('last_cookie_push');
			if (!last_cookie_push) return await chrome.storage.sync.set({ last_cookie_push: Date.now() });
			if (Date.now() - last_cookie_push < COOKIE_PUSH_INTERVAL) return;

			//retrieve new cookies and merge w old ones
			const cookie = await getHaloCookies();
			console.log('cookies', cookie);
			//don't push empty cookies or invalid cookie objects
			if (!cookie || !Object.keys(cookie).length || !isValidCookieObject(cookie))
				return console.log('cookie object was determined to be invalid');
			if (!(await validateCookie({ cookie }))) return console.log('cookie failed validateCookie check');

			stores.halo_cookies.update(cookie);
			//push to db
			await setUserCookies({ uid: auth.currentUser.uid, cookies: cookie });
			//update last_cookie_push
			await chrome.storage.sync.set({ last_cookie_push: Date.now() });
		})();
		currently_pushing_cookies = false; //as soon as IIFE returns, set currently_pushing_cookies to false
	};
	pushCookiesToDatabase(); //call whenever background script is loaded
})();
