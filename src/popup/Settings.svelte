<script>
	import { stores } from '../stores';
	import { fetchDiscordUser,getDefaultSettings,getUserSettings,updateUserSettings } from '../util/auth';
	import { getUserId,getUserOverview } from '../util/halo';
	import LazyLoader from './LazyLoader.svelte';
	import Navbar from './Navbar.svelte';
	const { halo_cookies } = stores;
	// reactive store destructuring https://svelte.dev/repl/a602f67808bb472296459df76af77464?version=3.35.0

	// ----- state -----
	let user;
	let classes = [];
	let default_settings;
	let user_settings;
	let isSyncingSettings = false;

	const syncUserSettings = async function () {
		if (isSyncingSettings) return;
		isSyncingSettings = true;
		await updateUserSettings(user_settings);
		//wait longer than necessary to prevent excessive writes to db
		await (() => new Promise((resolve) => setTimeout(resolve, 1000)))();
		isSyncingSettings = false;
	};

	const lazyLoad = async function () {
		user = await fetchDiscordUser();
		console.log(user);
		//const cookie = await getCookie();
		const cookie = halo_cookies.get();
		const uid = await getUserId({ cookie });
		const class_res = await getUserOverview({ uid, cookie });
		console.log(class_res);
		for (const { courseCode } of class_res.classes.courseClasses) classes.push(courseCode);

		// settings
		default_settings = await getDefaultSettings();
		//apply default settings to user_settings
		user_settings = Object.values(default_settings).reduce(
			(acc, { id, value }) => (!!acc.hasOwnProperty(id) ? acc : { ...acc, [id]: value }),
			await getUserSettings()
		);
		console.log(default_settings, user_settings);
	};
</script>

<LazyLoader {lazyLoad}>
	<Navbar {user} />

	<div class="text-center">
		<h1 class="text-lg">Active Classes</h1>
		{#each classes as code}
			<div class="badge badge-primary badge-md">{code}</div>
		{:else}
			<div class="badge badge-error badge-md">No active classes</div>
		{/each}
	</div>

	<div class="form-control">
		{#each default_settings as { id, name }}
			<label class="label cursor-pointer">
				<span class="text-base">{name}</span>
				<input type="checkbox" class="toggle toggle-primary" bind:checked={user_settings[id]} />
			</label>
		{/each}
		<button class="btn btn-primary btn-sm" class:loading={isSyncingSettings} on:click={syncUserSettings}>
			Save Settings
		</button>
	</div>
</LazyLoader>
