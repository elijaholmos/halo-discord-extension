<!--
  ~ Copyright (C) 2023 Elijah Olmos
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
	import { stores } from '../../stores';
	import { setUserCookies } from '../../util/auth';
	import { validateCookie } from '../../util/halo';
	import { auth, getHaloCookies, isValidCookieObject } from '../../util/util';

	export let user;

	// ------- state -------
	let isDropdownOpen = false;
	let isSyncingInfo = false;

	// daisyui dropdown stuff from https://svelte.dev/repl/4c5dfd34cc634774bd242725f0fc2dab
	const handleDropdownClick = () => (isDropdownOpen = !isDropdownOpen);
	const handleDropdownFocusLoss = ({ relatedTarget, currentTarget }) => {
		if (relatedTarget instanceof HTMLElement && currentTarget.contains(relatedTarget)) return;
		isDropdownOpen = false;
	};

	const syncHaloInfo = async function () {
		if (isSyncingInfo) return;
		isSyncingInfo = true;
		try {
			console.log('sweeping cookies - manual');
			const cookies = await getHaloCookies();
			if (!isValidCookieObject(cookies)) throw new Error('Invalid cookie object');
			if (!(await validateCookie({ cookie: cookies }))) throw new Error('cookie failed validateCookie check');

			stores.halo_cookies.update(cookies);
			!!auth.currentUser && (await setUserCookies({ uid: auth.currentUser.uid, cookies }));
		} catch (e) {
			console.error('[error] sweping cookies manual', e);
			alert('Failed to resync Halo info');
		} finally {
			isSyncingInfo = false;
		}
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
				<li>
					<a>{user.username}#{user.discriminator} </a>
				</li>
				<li on:click={syncHaloInfo}>
					<a
						>Sync Halo Info
						{#if isSyncingInfo}
							<div class="badge badge-lg">
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 512 512"
									><circle cx="256" cy="256" r="48" /><circle cx="416" cy="256" r="48" /><circle
										cx="96"
										cy="256"
										r="48"
									/></svg
								>
							</div>
						{:else}
							<div class="badge badge-lg">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="16"
									height="16"
									fill="currentColor"
									class="bi bi-check"
									viewBox="0 0 16 16"
								>
									<path
										d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"
									/>
								</svg>
							</div>
						{/if}
					</a>
				</li>
			</ul>
		</div>
	</div>
</div>
