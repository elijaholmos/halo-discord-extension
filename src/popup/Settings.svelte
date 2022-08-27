<script>
	import { test, test2 } from '../stores';
	import { fetchDiscordUser } from '../util/auth';
	import { getCookie, getUserId, getUserOverview } from '../util/halo';
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
	let classes = [];

	const lazyLoad = async function () {
		user = await fetchDiscordUser();
		console.log(user);
		const cookie = await getCookie();
		const uid = await getUserId({ cookie });
		const class_res = await getUserOverview({ uid, cookie });
		console.log(class_res);
		for (const { classCode } of class_res.classes.courseClasses) classes.push(classCode);
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
		{#each settings as { name, enabled }}
			<label class="label cursor-pointer">
				<span class="text-base">{name}</span>
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
