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
	import { derived } from 'svelte/store';
	import { stores } from '../stores';
	import { validateCookie } from '../util/halo';
	import Error from './components/Error.svelte';
	import Footer from './components/Footer.svelte';
	import LazyLoader from './components/LazyLoader.svelte';
	import Login from './Login.svelte';
	import Settings from './Settings.svelte';
	import TermsOfService from './TermsOfService.svelte';
	const { discord_tokens, halo_cookies, halo_info, require_discord_reauth, accepted_tos } = stores;

	console.log('in popup');
	console.log(discord_tokens);

	// reactive store destructuring https://svelte.dev/repl/a602f67808bb472296459df76af77464?version=3.35.0
	$: ({ access_token } = $discord_tokens || {}); //confirmed 2022-08-06 that this dynamically updates
	$: ({ roles } = $halo_info || {});

	let halo_logged_in;
	const lazyLoad = async function () {
		//https://svelte.dev/docs#run-time-svelte-store-derived
		halo_logged_in = derived(
			halo_cookies,
			async ($halo_cookies, set) => void set(await validateCookie({ cookie: $halo_cookies })),
			await validateCookie({ cookie: $halo_cookies })
		);
	};
</script>

<LazyLoader {lazyLoad}>
	{#if !$halo_logged_in}
		<Error>
			<p>
				You need to log into <a href="https://halo.gcu.edu" class="link" target="_blank" rel="noreferrer"
					>halo.gcu.edu</a
				> for the extension to work
			</p>
		</Error>
	{:else if !roles?.some(({ baseRole, isActive }) => baseRole === 'Student' && isActive)}
		<Error>
			<p>You must be an active GCU student to use this extension</p>
		</Error>
	{:else if !$accepted_tos}
		<TermsOfService />
	{:else if !access_token || $require_discord_reauth === true}
		<Login />
	{:else}
		<Settings />
	{/if}

	<Footer />
</LazyLoader>
