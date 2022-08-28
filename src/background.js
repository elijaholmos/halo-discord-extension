// https://firebase.google.com/docs/web/setup#available-libraries
import { signInWithEmailAndPassword } from 'firebase/auth';
import { child, ref, set } from 'firebase/database';
import { init, stores } from './stores';
import chromeStorageSyncStore from './util/chromeStorageSyncStore';
import { getHaloUserInfo } from './util/halo';
import { auth, db, getHaloCookies } from './util/util';
// no stores - code is not shared between background and popup

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
	console.log(`${chrome.runtime.getManifest().name} v${chrome.runtime.getManifest().version}`);

	console.log('initializing ApplicationStoreManager');
	const initial_cookies = await getHaloCookies();
	await init([
		chromeStorageSyncStore({ key: 'test', initial_value: 'a' }),
		chromeStorageSyncStore({ key: 'test2' }),
		chromeStorageSyncStore({ key: 'discord_tokens' }),
		chromeStorageSyncStore({ key: 'discord_info' }),
		chromeStorageSyncStore({ key: 'halo_cookies', initial_value: initial_cookies }),
		chromeStorageSyncStore({ key: 'halo_info', initial_value: () => getHaloUserInfo({ cookie: initial_cookies }) }),
	]);
	console.log('ApplicationStoreManager initialized');
	console.log(stores);

	console.log(() => console.log(stores.test.get()));

	if (!auth.currentUser) await firebaseSignIn();
	console.log(auth?.currentUser?.uid);

	//halo_cookies.set(await getHaloCookies()); //should be unnecessary w initial_value

	//if(!await chrome.storage.sync.get('last_cleared')) clear

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
		const stored_cookie = (await chrome.storage.sync.get(COOKIE_KEY))[COOKIE_KEY];
		if (stored_cookie[cookie.name] === cookie.value) return console.log(`found dup cookie: ${cookie.name}`);
		stores.halo_cookies.update({ [cookie.name]: cookie.value });
	});
})();
