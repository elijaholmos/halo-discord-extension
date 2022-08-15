<script>
	import { test, test2 } from '../stores';
	import { fetchDiscordUser } from '../util/auth';
	import LazyLoader from './LazyLoader.svelte';
	import Navbar from './Navbar.svelte';
	// reactive store destructuring https://svelte.dev/repl/a602f67808bb472296459df76af77464?version=3.35.0
	$: ({ a } = $test);
	//console.log($test, $test2);

	const settings = [
		{
			name: 'Announcement Notifications',
			enabled: true,
		},
		{
			name: 'Grade Notifications',
			enabled: true,
		},
		{
			name: 'Message Notifications',
			enabled: true,
		},
	];

	// ----- state -----
	let user;

	const lazyLoad = async function () {
		user = await fetchDiscordUser();
		console.log(user);
	};
</script>

<LazyLoader {lazyLoad}>
	<Navbar {user} />

	<div class="form-control">
		{#each settings as { name, enabled }}
			<label class="label cursor-pointer">
				<span class="label-text">{name}</span>
				<input type="checkbox" class="toggle toggle-primary" bind:checked={enabled} />
			</label>
		{/each}

		{#each settings as { name, enabled }}
			<p>{name} is {enabled ? 'enabled' : 'disabled'}</p>
		{/each}
		{a}
		{$test2}
		<button
			on:click={() => {
				console.log(test.get());
				test.update({ ree: 'ree', a: Date.now() });
				test2.set(-Date.now());
			}}
		>
			{JSON.stringify(user)}
		</button>
	</div>
</LazyLoader>
