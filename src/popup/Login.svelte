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
	const launchAuthFlow = function () {
		return chrome.runtime.sendMessage('launch_auth');
	};
</script>

<div class="flex flex-col items-center">
	<img src="../static/icon-128.png" alt="HNS Logo" class="w-24 h-24 mb-4" />
	<h1 class="text-xl">Welcome!</h1>
	<span class="h-4" />
	<a
		id="login-button"
		class="dsl-discord-btn"
		title="Login with Discord"
		on:click={launchAuthFlow}
	>
		<span class="dsl-discord-btn-icon" />
		<span>Login with Discord</span>
	</a>
</div>

<style>
	.dsl-discord-btn {
		display: inline-block;
		border: none;
		padding: 8px 14px 8px 10px;
		margin: 10px 0 20px;
		font-size: 14px;
		text-transform: none;
		text-decoration: none;
		transition: background 0.3s ease;
		white-space: normal;
		background-image: initial;
		background-color: #5865f2;
		border-color: initial;
		color: #ffffff;
		text-decoration-color: initial;
	}

	.dsl-discord-btn:hover {
		background-image: initial;
		background-color: #8189e5;
		cursor: pointer;
	}

	.dsl-discord-btn-icon {
		background-image: url('../static/Discord-Logo-White.svg');
		background-repeat: no-repeat;
		background-size: 100%;
		display: inline-block;
		height: 20px;
		width: 20px;
		vertical-align: middle;
		margin: 3px 6px 0 0;
	}
</style>
