<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	
	// Props
	export let isToggled: boolean = true;
	
	// Event dispatcher
	const dispatch = createEventDispatcher();
	
	// Handle toggle change
	function handleToggle() {
		isToggled = !isToggled;
		dispatch('toggle', { isToggled });
	}
</script>

<button 
	type="button"
	class="toggle-switch" 
	class:toggled={isToggled} 
	onclick={handleToggle}
	onkeydown={(e) => e.key === 'Enter' && handleToggle()}
	role="switch"
	aria-checked={isToggled}
	aria-label="Toggle column">
	<span class="toggle-slider"></span>
</button>

<!-- <style>
	.toggle-switch {
		position: relative;
		display: inline-block;
		width: 36px;
		height: 20px;
		background-color: #ccc;
		border-radius: 10px;
		cursor: pointer;
		transition: background-color 0.3s;
	}
	
	.toggle-switch.toggled {
		background-color: var(--color-primary, #4caf50);
	}
	
	.toggle-slider {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 16px;
		height: 16px;
		background-color: white;
		border-radius: 50%;
		transition: transform 0.3s;
	}
	
	.toggle-switch.toggled .toggle-slider {
		transform: translateX(16px);
	}
</style> -->
