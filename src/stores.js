import chromeStorageSyncStore from './util/chromeStorageSyncStore';

class ApplicationStoreManager {
	stores = {};

	constructor() {
		//listen for store updates
		//currently unneeded since chromeStorageSyncStore tracks localstorage changes
		// chrome.runtime.onConnect.addListener((port) => {
		// 	console.log('new port', port);
		// 	if (port.name !== 'store_update') return;
		// 	port.onMessage.addListener(this.updateStore.bind(this));
		// });
	}

	async init(i_stores = []) {
		console.log('init', this);
		await this.#init(i_stores);

		//create listener for reconstruct message
		chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
			console.log('beginning of onMessage', message);
			if (sender.id !== chrome.runtime.id) return console.log('ids are not equal');
			if (message !== 'store_reconstruct') return console.log('message is not store_reconstruct');
			//stringify stores and send as response
			sendResponse(JSON.stringify(Object.entries(this.stores).map(([key, store]) => [key, store.get()])));
		});

		return this;
	}

	/**
	 *
	 * @param {Promise[]} i_stores
	 */
	async #init(i_stores) {
		for await (const store of i_stores) this.addStore(store);
	}

	async reconstruct() {
		console.log('in reconstruct, stores', this.stores);
		const res = await chrome.runtime.sendMessage('store_reconstruct');
		console.log('received response', res);
		//reconstruct stores from JSON
		await this.#init(JSON.parse(res).map(([key, initial_value]) => chromeStorageSyncStore({ key, initial_value })));
		console.log('reconstruction complete', this.stores);

		return this;
	}

	get(key) {
		return this.stores[key];
	}

	getMany(keys) {
		return keys.reduce((acc, key) => ({ ...acc, [key]: this.get(key) }), {});
	}

	addStore(store) {
		this.stores[store.key] = store;
	}

	updateStore(obj) {
		console.log('in updateStore, stores: ', this.stores);
		for (const [key, val] of Object.entries(obj)) {
			console.log('updating Store', key, val);
			this.stores[key].update(val);
		}
	}
}

export const { stores, init, reconstruct } = new Proxy(new ApplicationStoreManager(), {
	//https://stackoverflow.com/a/50104359/8396479
	get: (target, prop) => {
		const value = target[prop];
		// if method, and not bound, bind the method
		return value instanceof Function && !value.name.startsWith('bound ') ? value.bind(target) : value;
	},
});
