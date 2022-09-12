// https://firebase.google.com/docs/web/setup#available-libraries
import { compare } from 'compare-versions';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { child, ref, set } from 'firebase/database';
import { init, stores } from './stores';
import { triggerDiscordAuthFlow } from './util/auth';
import chromeStorageSyncStore from './util/chromeStorageSyncStore';
import { getHaloUserInfo } from './util/halo';
import { auth, db, getHaloCookies } from './util/util';
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
		chromeStorageSyncStore({ key: 'halo_cookies', initial_value: initial_cookies }),
		chromeStorageSyncStore({ key: 'halo_info', initial_value: () => getHaloUserInfo({ cookie: initial_cookies }) }),
	]);
	console.log('ApplicationStoreManager initialized');
	console.log(stores);

	// FIREFOX RESTRICTION: popup is closed during auth, so it needs to be triggered from background script
	chrome.runtime.onMessage.addListener((msg) => {
		console.log(`msg === 'launch_auth' - ${msg === 'launch_auth'}`)
		console.log(`!auth.currentUser - ${!auth.currentUser}`)
		msg === 'launch_auth' && !auth.currentUser && triggerDiscordAuthFlow()
	});

	if (!auth.currentUser) await firebaseSignIn();
	console.log(auth?.currentUser?.uid);

	//halo_cookies.set(await getHaloCookies()); //should be unnecessary w initial_value

	// currently broken, see https://github.com/GoogleChrome/developer.chrome.com/issues/2602
	chrome.runtime.onInstalled.addListener(
		({ reason }) => reason === chrome.runtime.OnInstalledReason.INSTALL && chrome.action.openPopup()
	);

	//sweeps halo cookies, updates local stores & DB
	const sweepHaloCookies = async function () {
		try {
			console.log('sweeping cookies');
			const cookies = await chrome.cookies.getAll({
				url: 'https://halo.gcu.edu',
			});
			for (const cookie of cookies) {
				await chrome.storage.sync.set({ [cookie.name]: cookie.value });
				!!auth.currentUser &&
					(await set(child(ref(db, `cookies/${auth.currentUser.uid}`), cookie.name), cookie.value));
			}
		} catch (e) {
			console.log(e);
		}
		return;
	};

	//watch for cookie updates
	//store cookies locally to compare changes
	chrome.cookies.onChanged.addListener(async ({ cookie }) => {
		console.log('cookie changed');
		//what about when cookie.value === null/undefined?
		if (cookie.domain !== 'halo.gcu.edu') return;
		const stored_cookie = (await chrome.storage.sync.get(COOKIE_KEY))[COOKIE_KEY]; //check store instead?
		if (stored_cookie[cookie.name] === cookie.value) return console.log(`found dup cookie: ${cookie.name}`);
		stores.halo_cookies.update({ [cookie.name]: cookie.value });
		//refresh halo user info in case of login/logout
		stores.halo_info.update(await getHaloUserInfo({ cookie: stores.halo_cookies.get() }));
	});
})();
