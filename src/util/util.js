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
