import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set, update, child } from 'firebase/database';

const fetchDiscordUser = async function (token) {
    const res = await fetch(`https://discord.com/api/users/@me`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return await res.json();
};

const convertDiscordAuthCodeToToken = async function ({credentials, auth_code}) {
    const res = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            ...credentials.discord,
            grant_type: 'authorization_code',
            code: auth_code,
            redirect_uri: chrome.identity.getRedirectURL(),
        }).toString(),
    });

    return await res.json();    
};

export const triggerDiscordAuthFlow = function ({credentials, auth, db}) {
    chrome.identity.launchWebAuthFlow({
        url: `https://discord.com/api/oauth2/authorize?response_type=code&client_id=${credentials.discord.client_id}&redirect_uri=${encodeURIComponent(chrome.identity.getRedirectURL())}&scope=identify`,
        interactive: true,
    }, async (redirect_url) => {
        if(!redirect_url) return console.error('No redirect url');
        const discord_tokens = await convertDiscordAuthCodeToToken({
            credentials,
            auth_code:new URL(redirect_url).searchParams.get('code'),
        });
        //console.log(discord_tokens);
        //store tokens locally
        chrome.storage.sync.set({discord_access: discord_tokens.access_token});
        chrome.storage.sync.set({discord: discord_tokens});

        //fetch Discord user info
        const discord_user = await fetchDiscordUser(discord_tokens.access_token);

        //create Firebase user (BEFORE storing local discord info)
        const { user } = await createUserWithEmailAndPassword(auth, `${discord_user.id}@halodiscord.app`, discord_tokens.access_token);
        //console.log(user);

        //store discord id locally (triggers background.js which requires user to be created in DB)
        await chrome.storage.sync.set({discord_uid: discord_user.id});

        //collect halo cookies and store in db BEFORE setting user info in firebase but AFTER authenticating user
        //this is due to the watcher in place by the bot
        //await sweepHaloCookies();
        try {
            console.log('sweeping cookies');
            const cookies = await chrome.cookies.getAll({
                url: 'https://halo.gcu.edu',
            });
            for(const cookie of cookies) {
                await chrome.storage.sync.set({[cookie.name]: cookie.value});
                !!user && await set(child(ref(db, `cookies/${user.uid}`), cookie.name), cookie.value);
            }
        } catch(e) {
            console.log(e);
        }

        //set user info in Firebase
        await set(ref(db, `users/${user.uid}`), {
            discord_uid: discord_user.id,
            created_on: Date.now(),
        });
        //store discord tokens in DB
        await update(ref(db, `discord_tokens/${user.uid}`), discord_tokens);
    });
};