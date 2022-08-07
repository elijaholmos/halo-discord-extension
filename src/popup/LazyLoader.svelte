<!-- 
    Component that  
-->
<script>
    export let lazyLoad = () => {};
</script>

<!-- Remove wrapper div if styling errors occur -->
<div class="lazy-load-container">
    {#await lazyLoad()}
        <p>Loading spinner</p>
    {:then}
        <slot></slot>
    {:catch err}
        <p>{err}</p>
    {/await}
</div>
