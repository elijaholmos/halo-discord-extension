import chromeStorageSyncStore from './util/chromeStorageSyncStore';
import { getHaloCookies } from './util/util';

export let test 	= chromeStorageSyncStore({ key: 'test', initial_value: 'a' });;
export let test2 	= chromeStorageSyncStore({ key: 'test2' });;
export let discord_tokens 	= chromeStorageSyncStore({ key: 'discord_tokens' });;
export let discord_info 	= chromeStorageSyncStore({ key: 'discord_info' });;
export let halo_cookies 	= chromeStorageSyncStore({ key: 'halo_cookies', initial_value: await getHaloCookies() });;

let initialized = false;
async function initializeStores () {
	if(initialized) return true;
	console.log(`initializing stores - ${initialized}`);
	console.log(!!test)
	test 			??= await chromeStorageSyncStore({ key: 'test', initial_value: 'a' });
	test2 			??= await chromeStorageSyncStore({ key: 'test2' });
	discord_tokens 	??= await chromeStorageSyncStore({ key: 'discord_tokens' });
	discord_info 	??= await chromeStorageSyncStore({ key: 'discord_info' });
	halo_cookies	??= await chromeStorageSyncStore({ key: 'halo_cookies', initial_value: getHaloCookies });
	
	console.log(`stores initialized - ${initialized}`);
	initialized = true;
	console.log(!!test)
	console.log(`final initialized - ${initialized}`);
	return;
};

