<script lang="ts">
	import { logger } from '$lib/utils/logger';

	const { data, columnTypes } = $props<{
		data: Record<string, string>[];
		columnTypes: Record<string, string>;
	}>();

	let transformedData = $state<Record<string, string | number | Date | null>[]>([]);

	$effect(() => {
		transformedData = data.map((row) => {
			const transformed: Record<string, string | number | Date | null> = {};
			for (const [key, value] of Object.entries(row)) {
				transformed[key] = transformValue(value, columnTypes[key]);
			}
			return transformed;
		});
		logger.log('Data transformed:', transformedData);
	});

	function transformValue(value: string, type: string): string | number | Date | null {
		if (!value || value.trim() === '') return null;

		switch (type) {
			case 'number': {
				const num = Number(value.trim());
				return isNaN(num) ? null : num;
			}
			case 'date': {
				const date = new Date(value);
				return isNaN(date.getTime()) ? null : date;
			}
			default:
				return value;
		}
	}
</script>
