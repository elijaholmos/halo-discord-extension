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
	import Error from './components/Error.svelte';
	import Login from './Login.svelte';
	import Settings from './Settings.svelte';
	const { discord_info, halo_cookies, halo_info, require_discord_reauth } = stores;

	console.log('in popup');
	console.log(discord_info);

	// reactive store destructuring https://svelte.dev/repl/a602f67808bb472296459df76af77464?version=3.35.0
	$: ({ access_token } = $discord_info || {}); //confirmed 2022-08-06 that this dynamically updates
	$: halo_logged_in =
		!$halo_cookies?.hasOwnProperty(AUTHORIZATION_KEY) || !$halo_cookies?.hasOwnProperty(CONTEXT_KEY);
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
	{:else if !roles.some(({ baseRole, isActive }) => baseRole === 'Student' && isActive)}
		<Error>
			<p>You must be an active GCU student to use this extension</p>
		</Error>
	{:else if !access_token || $require_discord_reauth === true}
		<Login />
	{:else}
		<Settings />
	{/if}

	<footer
		class="footer justify-center [&>*]:place-items-center p-3 bg-transparent text-neutral-content absolute bottom-0"
	>
		<div>
			<p class="text-primary">
				<a
					class="link link-hover text-primary"
					href="https://elijaho.notion.site/Privacy-Policy-d3c58e616cfa474b8dbcfc587892af46"
					target="_blank">Privacy Policy</a
				>
				|
				<a
					class="link link-hover text-primary"
					href="https://elijaho.notion.site/Terms-of-Service-e341190b0998499ea7f31cee2d49f786"
					target="_blank"
					>Terms of Use
				</a>
			</p>
			<a href="https://github.com/elijaholmos/halo-discord-extension" target="_blank"
				><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" class="fill-neutral"
					><path
						d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
					/></svg
				></a
			>
		</div>
	</footer>
</main>
