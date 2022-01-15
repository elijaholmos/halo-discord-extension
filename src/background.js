import { signInWithEmailAndPassword } from 'firebase/auth';
import { ref, set, child, update, } from 'firebase/database';
// https://firebase.google.com/docs/web/setup#available-libraries
import util from './util/util.js';

//IIFE to get top-level await
(async () => { 
    const { 
        credentials,
        auth,
        db,
    } = await util();

    const sweepHaloCookies = async function () {
        try {
            console.log('sweeping cookies');
            const cookies = await chrome.cookies.getAll({
                url: 'https://halo.gcu.edu',
            });
            for(const cookie of cookies) {
                await chrome.storage.sync.set({[cookie.name]: cookie.value});
                auth.currentUser && await set(child(ref(db, `cookies/${auth.currentUser.uid}`), cookie.name), cookie.value);
            }
        } catch(e) {
            console.log(e);
        }
        return;
    };

    (async function main() {
        console.log('in beginning of main')
        const { discord_uid, discord_access } = await chrome.storage.sync.get(['discord_uid', 'discord_access']);
        if(!discord_uid || !discord_access) return setTimeout(main, 1000);
        try {
            console.log('attempting to login');
            await signInWithEmailAndPassword(auth, `${discord_uid}@halodiscord.app`, discord_access);
            console.log(auth.currentUser);
        } catch (e) {
            console.error(e);
            return setTimeout(main, 1000);
        }
        //watch for cookie updates
        //store cookies locally to compare changes
        chrome.cookies.onChanged.addListener(async ({cookie}) => {
            //what about when cookie.value === null/undefined?
            if(cookie.domain !== 'halo.gcu.edu') return;
            if((await chrome.storage.sync.get(cookie.name))[cookie.name] === cookie.value) return console.log(`found dup cookie: ${cookie.name}`);
            await sweepHaloCookies();
        });
        //console.log(auth.currentUser);
        //await triggerDiscordAuthFlow();
        //const { claims } = await user.getIdTokenResult();
        //console.log(claims);
        //console.log(credentials);
    })();

    const refreshDiscordToken = async function (refresh_token) {
        try {
            //get an access token using the refresh token
            const res = await fetch('https://discord.com/api/oauth2/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    ...credentials.discord,
                    grant_type: 'refresh_token',
                    refresh_token,
                }),
            });

            //get json response
            const res_json = await res.json();
            
            //store token locally
            chrome.storage.sync.set({discord: res_json});
            //store tokens in DB
            update(ref(db, `discord_tokens/${auth.currentUser.uid}`), res_json);

            console.log(`Refreshed access token: ${res_json.access_token}`);

            //lastly, return the access token
            return res_json.access_token;
        } catch (err) {
            console.error(err);
            throw err;
        }
    };
})();