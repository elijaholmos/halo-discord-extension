<script>
	import { onMount } from 'svelte';

	import { test, test2 } from '../stores';
	import { fetchDiscordUser } from '../util/auth';
	import LazyLoader from './LazyLoader.svelte';
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

	// state
	let user;
	let isDropdownOpen = false;

	// daisyui dropdown stuff from https://svelte.dev/repl/4c5dfd34cc634774bd242725f0fc2dab
	const handleDropdownClick = () => (isDropdownOpen = !isDropdownOpen);
	const handleDropdownFocusLoss = ({ relatedTarget, currentTarget }) => {
		if (
			relatedTarget instanceof HTMLElement &&
			currentTarget.contains(relatedTarget)
		)
			return;
		isDropdownOpen = false;
	};

	const lazyLoad = async function () {
		user = await fetchDiscordUser();
		console.log(user);
	};
</script>

<LazyLoader {lazyLoad}>
	<div class="navbar">
		<!-- <div class="flex-1">
		<a class="btn btn-ghost normal-case text-xl">daisyUI</a>
	</div> -->
	<!-- consolidate dropdown to a component? -->
		<div class="navbar-end w-full gap-2">
			<div
				class="dropdown dropdown-end"
				on:focusout={handleDropdownFocusLoss}
			>
				<span
					tabindex="0"
					class="btn btn-ghost btn-circle avatar"
					on:click={handleDropdownClick}
				>
					<div class="w-10 rounded-full">
						<img
							src={!!user.avatar
								? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
								: `https://cdn.discordapp.com/embed/avatars/${
										user.discriminator % 5
								  }.png`}
							alt="Discord avatar"
						/>
					</div>
				</span>
				<ul
					tabindex="0"
					class="mt-3 p-2 shadow menu menu-compact dropdown-content rounded-box bg-base-200 w-52"
					style:visibility={isDropdownOpen ? 'visible' : 'hidden'}
				>
					<li><a>{user.username}#{user.discriminator}</a></li>
					<li><a>Logout</a></li>
				</ul>
			</div>
		</div>
	</div>

	<div class="form-control">
		{#each settings as { name, enabled }}
			<label class="label cursor-pointer">
				<span class="label-text">{name}</span>
				<input
					type="checkbox"
					class="toggle toggle-primary"
					bind:checked={enabled}
				/>
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
			}}>{isDropdownOpen}</button
		>
	</div>
</LazyLoader>
