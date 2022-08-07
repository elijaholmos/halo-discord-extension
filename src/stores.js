import chromeStorageSyncStore from './util/chromeStorageSyncStore';

export const test = chromeStorageSyncStore({
	key: 'test',
	initial_value: { a: 'test' },
});
export const test2 = chromeStorageSyncStore({
	key: 'test2',
	//initial_value: 'test2',
});
export const discord_tokens = chromeStorageSyncStore({ key: 'discord_tokens' });
export const discord_info 	= chromeStorageSyncStore({ key: 'discord_info' });
export const halo_cookies	= chromeStorageSyncStore({ key: 'halo_cookies' });
