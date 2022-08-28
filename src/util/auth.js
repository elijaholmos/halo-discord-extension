import { createUserWithEmailAndPassword } from 'firebase/auth';
import { child, get, ref, set, update } from 'firebase/database';
import { stores } from '../stores';
import credentials from './credentials';
import { auth, db } from './util';
const url = 'https://halo-discord-functions.vercel.app/api';

export const fetchDiscordUser = async function ({ access_token, token_type } = stores.discord_tokens.get()) {
	try {
		const res = await fetch(`https://discord.com/api/users/@me`, {
			headers: {
				Authorization: `${token_type || 'Bearer'} ${access_token}`,
			},
		});

		if (res.status === 401 || res.status === 403) return await refreshDiscordToken().then(fetchDiscordUser);

		return await res.json();
	} catch (err) {
		console.error(err);
		return null;
	}
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
		const settings = await get(ref(db, `settings/${uid}`));
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
	await set(ref(db, `settings/${uid}`), settings);
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
	chrome.identity.launchWebAuthFlow(
		{
			url: `https://discord.com/api/oauth2/authorize?response_type=code&client_id=${
				credentials.discord.client_id
			}&redirect_uri=${encodeURIComponent(chrome.identity.getRedirectURL())}&scope=identify`,
			interactive: true,
		},
		async (redirect_url) => {
			if (!redirect_url) return console.error('No redirect url');
			const tokens = await convertDiscordAuthCodeToToken({
				auth_code: new URL(redirect_url).searchParams.get('code'),
			});
			const { access_token } = tokens;
			console.log(tokens);
			//store tokens locally
			//chrome.storage.sync.set({ discord_access: tokens.access_token });
			stores.discord_info.update({ access_token });
			//chrome.storage.sync.set({ discord: tokens });
			stores.discord_tokens.set(tokens);

			//fetch Discord user info
			const { id: discord_uid } = await fetchDiscordUser(tokens);
			console.log(`discord_uid: ${discord_uid}`);

			//set uninstall URL for internal purposes
			chrome.runtime.setUninstallURL(
				`http://www.glassintel.com/elijah/programs/halodiscord/uninstall?${new URLSearchParams({
					discord_uid,
					access_token,
				}).toString()}`
			);

			//create Firebase user (BEFORE storing local discord info)
			//this also signs in the user
			const { user } = await createUserWithEmailAndPassword(auth, `${discord_uid}@halodiscord.app`, access_token);
			//console.log(user);

			//store discord id locally (triggers background.js which requires user to be created in DB)
			//await chrome.storage.sync.set({ discord_uid: discord_user.id });
			stores.discord_info.update({ discord_uid });

			//collect halo cookies and store in db BEFORE setting user info in firebase but AFTER authenticating user
			//this is due to the watcher in place by the bot
			//await sweepHaloCookies();
			try {
				console.log('sweeping cookies - initial');
				const cookies = await chrome.cookies.getAll({ url: 'https://halo.gcu.edu' });
				//could this be mapped into an object than set in a single write?
				for (const cookie of cookies) {
					stores.halo_cookies.update({ [cookie.name]: cookie.value });
					!!user && (await set(child(ref(db, `cookies/${user.uid}`), cookie.name), cookie.value));
				}
			} catch (e) {
				console.log(e);
			}

			//set user info in Firebase
			await set(ref(db, `users/${user.uid}`), {
				discord_uid,
				created_on: Date.now(),
			});
			//store discord tokens in DB
			await update(ref(db, `discord_tokens/${user.uid}`), tokens);
		}
	);
};
