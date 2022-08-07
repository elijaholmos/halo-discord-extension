import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set, update, child } from 'firebase/database';
import { discord_info, discord_tokens } from '../stores';
import credentials from './credentials';
import { auth, db } from './util';
const url = 'https://halo-discord-functions.vercel.app/api';

export const fetchDiscordUser = async function () {
	const res = await fetch(`https://discord.com/api/users/@me`, {
		headers: {
			Authorization: `Bearer ${discord_tokens.get().access_token}`,
		},
	});

	return await res.json();
};

export const refreshDiscordToken = async function (refresh_token) {
	try {
		//get an access token using the refresh token
		const tokens = await (
			await fetch(`${url}/refresh`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({ refresh_token }).toString(),
			})
		).json();

		console.log(`Refreshed token response: ${tokens}`);

		const { access_token } = tokens;
		//store token locally
		discord_tokens.set(tokens);
		//store tokens in DB
		update(ref(db, `discord_tokens/${auth.currentUser.uid}`), tokens);

		//lastly, return the access token
		return access_token;
	} catch (err) {
		console.error(err);
		throw err;
	}
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
			}&redirect_uri=${encodeURIComponent(
				chrome.identity.getRedirectURL()
			)}&scope=identify`,
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
			discord_info.update({ access_token });
			//chrome.storage.sync.set({ discord: tokens });
			discord_tokens.set(tokens);

			//fetch Discord user info
			const discord_user = await fetchDiscordUser(access_token);
			console.log(discord_user);

			//temp for testing
			discord_info.update({ discord_uid: discord_user.id });

			//create Firebase user (BEFORE storing local discord info)
			//this also signs in the user
			const { user } = await createUserWithEmailAndPassword(
				auth,
				`${discord_user.id}@halodiscord.app`,
				access_token
			);
			//console.log(user);

			//store discord id locally (triggers background.js which requires user to be created in DB)
			//await chrome.storage.sync.set({ discord_uid: discord_user.id });
			discord_info.update({ discord_uid: discord_user.id });

			//collect halo cookies and store in db BEFORE setting user info in firebase but AFTER authenticating user
			//this is due to the watcher in place by the bot
			//await sweepHaloCookies();
			try {
				console.log('sweeping cookies');
				const cookies = await chrome.cookies.getAll({
					url: 'https://halo.gcu.edu',
				});
				for (const cookie of cookies) {
					await chrome.storage.sync.set({
						[cookie.name]: cookie.value,
					});
					!!user &&
						(await set(
							child(ref(db, `cookies/${user.uid}`), cookie.name),
							cookie.value
						));
				}
			} catch (e) {
				console.log(e);
			}

			//set user info in Firebase
			await set(ref(db, `users/${user.uid}`), {
				discord_uid: discord_user.id,
				created_on: Date.now(),
			});
			//store discord tokens in DB
			await update(ref(db, `discord_tokens/${user.uid}`), tokens);
		}
	);
};
