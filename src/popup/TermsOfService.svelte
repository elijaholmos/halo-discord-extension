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
	const { accepted_tos } = stores;
</script>

<div class="flex flex-col items-center">
	<div class="alert shadow-lg text-base p-3 m-2 w-auto">
		<div>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				class="stroke-info flex-shrink-0 w-6 h-6"
				><path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/></svg
			>

			<div class="text-center">
				<span
					>You must accept the <a
						class="link link-hover text-info"
						href="https://elijaho.notion.site/Terms-of-Service-e341190b0998499ea7f31cee2d49f786"
						target="_blank"
						>Terms of Service
					</a> in order to use this application</span
				>
			</div>
		</div>
	</div>

	<div class="flex flex-col items-center [&>p]:w-11/12">
		<p class="text-base">I have read and agree to the Terms of Service.</p>
		<p class="text-base">I authorize Halo Notification Service to view my education records.</p>
		<button class="btn btn-outline btn-primary w-24 m-4">Agree</button>
	</div>
</div>
