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
	import { stores } from '../stores';
	import { AUTHORIZATION_KEY, CONTEXT_KEY } from '../util/halo';
	import Error from './Error.svelte';
	import Login from './Login.svelte';
	import Settings from './Settings.svelte';
	const { discord_info, halo_cookies, halo_info } = stores;

	console.log('in popup');
	console.log(discord_info);

	// reactive store destructuring https://svelte.dev/repl/a602f67808bb472296459df76af77464?version=3.35.0
	$: ({ discord_uid } = $discord_info || {}); //confirmed 2022-08-06 that this dynamically updates
	$: halo_logged_in = !$halo_cookies?.hasOwnProperty(AUTHORIZATION_KEY) || !$halo_cookies?.hasOwnProperty(CONTEXT_KEY)
	$: ({ roles } = $halo_info || []);
</script>

<main>
	{#if halo_logged_in}
		<Error>
			<p>
				You need to log into <a href="https://halo.gcu.edu" class="link" target="_blank">halo.gcu.edu</a> for the
				extension to work
			</p>
		</Error>
	{:else if !roles.some(({baseRole, isActive}) => baseRole === 'Student' && isActive)}
		<Error>
			<p>You must be an active GCU student to use this extension</p>
		</Error>
	{:else if !discord_uid}
		<Login />
	{:else}
		<Settings />
	{/if}
</main>
