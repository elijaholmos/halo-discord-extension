import { writable } from 'svelte/store';

/**
 * A Svelte store that syncs with `chrome.storage.sync`.
 *
 * Changes to the store update the Chrome Sync storage, and
 * changes to the Chrome Sync storage update the store.
 */
class ChromeStorageSyncStore {
	constructor({ key, initial_value }) {
		return (async () => {
			console.log(`creating ${key} store`);
			this.key = key;
			this.store = writable(initial_value);
			this.value = null;

			chrome.storage.onChanged.addListener(
				(changes, areaName) =>
					areaName === 'sync' && changes.hasOwnProperty(key) && this.#setStoreOnly(changes[key].newValue)
			);

			// chrome.storage.sync.get(key, (item) => {
			// 	console.log(`in callback for ${key}`, initial_value, item);
			// 	//if initial_value null, load from localstorage (if localstorage item exists)
			// 	initial_value === null && !!Object.keys(item).length ? this.set(item[key]) : this.set(initial_value);
			// });
			const item = await chrome.storage.sync.get(key);
			console.log(`in callback for ${key}`, initial_value, item);
			//if initial_value null, load from localstorage (if localstorage item exists)
			initial_value === null && !!Object.keys(item).length ? this.set(item[key]) : this.set(initial_value);
			return this;
		})();
	}

	get() {
		return this.value;
	}

	set(value) {
		const { store, key } = this;
		//synchronously update store
		this.value = value;
		store.set(value);
		chrome.storage.sync.set({ [key]: value });
	}

	/**
	 * Update only `this.value` and the Svelte store
	 */
	#setStoreOnly(value) {
		this.value = value;
		this.store.set(value);
	}

	/**
	 * Merge two objects or arrays together, then set the merged object to the store.
	 * Deeply nested updating not supported
	 */
	update(new_value) {
		const isLiteralObject = (o) => !!o && o.constructor === Object; //https://stackoverflow.com/a/16608074/8396479
		const { value } = this;
		if (isLiteralObject(value) && isLiteralObject(new_value)) new_value = { ...value, ...new_value };
		else if (Array.isArray(value) && Array.isArray(new_value)) new_value = [...value, ...new_value];
		this.set(new_value);
	}
}

// if initial_value null, will attempt to load from browser storage
// if initial_value is a function, function will be called and return value passed into store
export default async function ({ key, initial_value = null } = {}) {
	initial_value instanceof Function && (initial_value = await initial_value());
	const custom_store = await new ChromeStorageSyncStore({ key, initial_value });
	let {
		store: { subscribe },
		get,
		set,
		update,
	} = custom_store;
	get = get.bind(custom_store);
	set = set.bind(custom_store);
	update = update.bind(custom_store);

	return { key, subscribe, get, set, update };
}
