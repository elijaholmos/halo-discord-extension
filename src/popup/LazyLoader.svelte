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

<!-- 
    Component that displays a loading spinner until async function
    lazyLoad is fulfilled (or rejected) 
-->
<script>
	import Error from './Error.svelte';

	export let lazyLoad = () => {};
</script>

<!-- Removed wrapper div becayse styling errors occurred -->

{#await lazyLoad()}
	<div class="flex flex-col justify-center h-screen">
		<button class="btn btn-ghost btn-lg text-primary loading" />
	</div>
{:then}
	<slot />
{:catch error}
	<Error {error} />
{/await}
