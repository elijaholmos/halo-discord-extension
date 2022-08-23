<!-- 
    Component that displays a loading spinner until async function
    lazyLoad is fulfilled (or rejected) 
-->
<script>
	export let lazyLoad = () => {};
</script>

<!-- Removed wrapper div becayse styling errors occurred -->

{#await lazyLoad()}
	<div class="flex flex-col justify-center h-screen">
		<button class="btn btn-ghost btn-lg text-primary loading" />
	</div>
{:then}
	<slot />
{:catch err}
	{console.error(err)}
	<div class="flex flex-col items-center">
		<div class="alert alert-error shadow-lg text-base">
			<div>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="stroke-current flex-shrink-0 h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
					/></svg
				>
				<span>Error! {err.message ?? 'Join the discord for support'}</span>
			</div>
		</div>
		<a href="https://discord.gg/mY563YHScv" target="_blank">
			<button class="btn btn-square bg-discord hover:bg-discord-hover m-2 p-2">
				<img
					class="h-6 w-6"
					src="../static/Discord-Logo-White.svg"
					srcset="../static/Discord-Logo-White.svg"
					alt="Discord logo"
				/>
			</button>
		</a>
	</div>
{/await}
