// https://firebase.google.com/docs/web/setup#available-libraries
import { signInWithEmailAndPassword } from 'firebase/auth';
import { child, ref, set } from 'firebase/database';
import { auth, db } from './util/util';

console.log(`${chrome.runtime.getManifest().name} v${chrome.runtime.getManifest().version}`);

chrome.runtime.onInstalled.addListener(
	({ reason }) => reason === chrome.runtime.OnInstalledReason.INSTALL && chrome.action.openPopup()
);

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
//chrome.cookies.onChanged.addListener(async ({cookie}) => {
//    //what about when cookie.value === null/undefined?
//    if(cookie.domain !== 'halo.gcu.edu') return;
//    if((await chrome.storage.sync.get(cookie.name))[cookie.name] === cookie.value) return console.log(`found dup cookie: ${cookie.name}`);
//    await sweepHaloCookies();
//});

async function main() {
	console.log('in beginning of main');
	// let's modularize the below sign in code and same with the registration stuff, if possible
	// rather than this jank watcher thing yeah
	//const { discord_uid, discord_access } = await chrome.storage.sync.get(['discord_uid','discord_access']);

	if (!discord_uid || !discord_access) return setTimeout(main, 1000);
	try {
		console.log('attempting to login');
		await signInWithEmailAndPassword(auth, `${discord_uid}@halodiscord.app`, discord_access);
		console.log(auth.currentUser);
	} catch (e) {
		console.error(e);
		return setTimeout(main, 1000);
	}

	//console.log(auth.currentUser);
	//await triggerDiscordAuthFlow();
	//const { claims } = await user.getIdTokenResult();
	//console.log(claims);
	//console.log(credentials);
}
