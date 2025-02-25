<script lang="ts">
	import TransformManager from '$lib/transformComponents/TransformManager.svelte';
	import { goto } from '$app/navigation';

	function pushToTransplant() {
		goto('/transplant');
	}
</script>

<div class="transform-container">
	<div class="transform-header">
		<h1>TransForm Data Import</h1>
	</div>
	<TransformManager />
</div>
<!-- 
<style>
	.transform-container {
		width: 100%;
	}

	.transform-header {
		width: 100%;
		padding: 1rem 0;
		margin-bottom: 1rem;
	}

	h1 {
		margin: 0;
		font-size: 2rem;
	}
</style> -->
