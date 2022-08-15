<script>
	export let user;

	// ------- state -------
	let isDropdownOpen = false;

	// daisyui dropdown stuff from https://svelte.dev/repl/4c5dfd34cc634774bd242725f0fc2dab
	const handleDropdownClick = () => (isDropdownOpen = !isDropdownOpen);
	const handleDropdownFocusLoss = ({ relatedTarget, currentTarget }) => {
		if (relatedTarget instanceof HTMLElement && currentTarget.contains(relatedTarget)) return;
		isDropdownOpen = false;
	};
</script>

<div class="navbar">
	<!-- <div class="flex-1">
    <a class="btn btn-ghost normal-case text-xl">daisyUI</a>
    </div> -->
	<div class="navbar-end w-full gap-2">
		<div class="dropdown dropdown-end" on:focusout={handleDropdownFocusLoss}>
			<span tabindex="0" class="btn btn-ghost btn-circle avatar" on:click={handleDropdownClick}>
				<div class="w-10 rounded-full">
					<img
						src={!!user.avatar
							? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
							: `https://cdn.discordapp.com/embed/avatars/${user.discriminator % 5}.png`}
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
				<!-- <li><a>Logout</a></li> -->
			</ul>
		</div>
	</div>
</div>
