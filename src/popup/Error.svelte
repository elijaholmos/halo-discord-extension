<script>
    export let error = null;
    !!error && console.error(error);
</script>

<div class="flex flex-col items-center">
		<div class="alert alert-error shadow-lg text-base p-3 m-4">
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
                <slot class="text-center">
                    <span>Error! {error.message ?? 'Join the discord for support'}</span>
                </slot>
			</div>
		</div>
		<a href="https://discord.gg/mY563YHScv" target="_blank">
			<button class="btn gap-2 bg-discord hover:bg-discord-hover m-2 p-2 text-white">
				<img
					class="h-6 w-6"
					src="../static/Discord-Logo-White.svg"
					srcset="../static/Discord-Logo-White.svg"
					alt="Discord logo"
				/>
                Support
			</button>
		</a>
	</div>