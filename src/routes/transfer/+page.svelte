<script lang="ts">
	import { onMount } from 'svelte';
	import TransferManager from '$lib/transferComponents/TransferManager.svelte';
	import { goto } from '$app/navigation';

	// Debug flag to control logging
	const DEBUG = true;

	// Logger utility for consistent and controlled logging
	const logger = {
		debug: (message: string, ...args: any[]) => {
			if (DEBUG) console.log(`[TransferPage] ${message}`, ...args);
		},
		info: (message: string, ...args: any[]) => {
			console.log(`[TransferPage] ${message}`, ...args);
		},
		warn: (message: string, ...args: any[]) => {
			console.warn(`[TransferPage] ${message}`, ...args);
		},
		error: (message: string, ...args: any[]) => {
			console.error(`[TransferPage] ${message}`, ...args);
		}
	};

	// Handle navigation to TransPlant
	function navigateToTransplant() {
		logger.info('Navigating to TransPlant page');
		goto('/transplant');
	}

	onMount(() => {
		logger.info('Transfer page mounted');
	});
</script>

<div class="transfer-page">
	<div class="header">
		<h1>Transfer</h1>
		<p>Import and transform your data using the new Column architecture</p>
	</div>

	<TransferManager on:dataReady={navigateToTransplant} />

	<div class="footer">
		<button on:click={navigateToTransplant} class="next-button">
			Continue to TransPlant
		</button>
	</div>
</div>

<!-- <style>
	.transfer-page {
		display: flex;
		flex-direction: column;
		height: 100%;
		padding: 1rem;
		gap: 1rem;
	}

	.header {
		margin-bottom: 1rem;
	}

	.header h1 {
		margin: 0;
		color: var(--color-primary);
	}

	.header p {
		margin: 0.5rem 0 0 0;
		color: var(--color-text-secondary);
	}

	.footer {
		margin-top: 1rem;
		display: flex;
		justify-content: flex-end;
	}

	.next-button {
		background-color: var(--color-primary);
		color: white;
		border: none;
		border-radius: 4px;
		padding: 0.5rem 1rem;
		cursor: pointer;
		font-weight: 500;
	}

	.next-button:hover {
		background-color: var(--color-primary-dark);
	}
</style> -->
