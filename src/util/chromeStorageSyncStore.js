import { writable } from 'svelte/store';

class ChromeStorageSyncStore {
	constructor({ key, initial_value }) {
		this.key = key;
		this.store = writable(initial_value);
		this.value = initial_value;

		if (initial_value === null)
			chrome.storage.sync.get(key).then((val) => {
				console.log(`in callback for ${key}`);
				console.log(val);
				!!Object.keys(val).length && this.set(val[key]);
			});
		else this.set(initial_value);
	}

	get() {
		return this.value;
	}

	set(value) {
		const { store, key } = this;
		//synchronously update store
		this.value = value;
		store.set(value);
		chrome.storage.sync.set({
			[key]: value,
		});
	}

	update(new_value) {
		const { value } = this;
		if (value == Object(value) && new_value == Object(new_value))
			new_value = { ...value, ...new_value };
		this.set(new_value);
	}
}

// if initial_value null, will attempt to load from browser storage
export default function ({ key, initial_value = null } = {}) {
	const custom_store = new ChromeStorageSyncStore({ key, initial_value });
	let {
		store: { subscribe },
		get,
		set,
		update,
	} = custom_store;
	get = get.bind(custom_store);
	set = set.bind(custom_store);
	update = update.bind(custom_store);

	return { subscribe, get, set, update };
}
