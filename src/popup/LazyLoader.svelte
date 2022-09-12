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
