<!--
  ~ Copyright (C) 2022 Elijah Olmos
  ~
  ~ This program is free software: you can redistribute it and/or modify
  ~ it under the terms of the GNU Affero General Public License as
  ~ published by the Free Software Foundation, version 3.
  ~
  ~ This program is distributed in the hope that it will be useful,
  ~ but WITHOUT ANY WARRANTY; without even the implied warranty of
  ~ MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  ~ GNU Affero General Public License for more details.
  ~
  ~ You should have received a copy of the GNU Affero General Public License
  ~ along with this program. If not, see <http://www.gnu.org/licenses/>.
-->

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
				<li><a href>{user.username}#{user.discriminator}</a></li>
				<!-- <li><a>Logout</a></li> -->
			</ul>
		</div>
	</div>
</div>
