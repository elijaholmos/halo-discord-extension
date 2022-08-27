<script>
	import { discord_info, halo_cookies } from '../stores';
	import Login from './Login.svelte';
	import Settings from './Settings.svelte';

	// reactive store destructuring https://svelte.dev/repl/a602f67808bb472296459df76af77464?version=3.35.0
	$: ({ discord_uid } = $discord_info || {});
	//confirmed 2022-08-06 that this dynamically updates
</script>

<main>
	{#each Object.entries($halo_cookies) as o}
		{o[0]} = {o[1]}
	{/each}
	{#if true}
		<br />
		<p>{Object.keys($halo_cookies).length}</p>
	{:else if !discord_uid}
		<Login />
	{:else}
		<Settings />
	{/if}
</main>
