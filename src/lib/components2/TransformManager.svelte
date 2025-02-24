<script lang="ts">
	import * as dateType from '$lib/utils/dataTypes/dateType';
	import * as numberType from '$lib/utils/dataTypes/numberType';
	import * as gpsType from '$lib/utils/dataTypes/gpsType';
	import CSVImporter from './CSVImporter.svelte';
	import DataPreviewTable from './DataPreviewTable.svelte';

	// State
	let data = $state<Record<string, string>[]>([]);
	let columnTypes = $state<Record<string, string>>({});
	let toggledColumns = $state<Record<string, boolean>>({});
	let invalidCells = $state<Record<string, Set<number>>>({});
	let transformedData = $state<Record<string, string>[]>([]);
	let originalData = $state<Record<string, string>[]>([]);

	// Available types and their validation/formatting functions
	const types = ['string', 'number', 'date', 'gps', 'latitude', 'longitude', 'delete'] as const;
	type ValidType = (typeof types)[number];

	// Let each type handler validate and format its own data
	function validateAndFormatData(
		header: string,
		value: string
	): {
		type: ValidType;
		isValid: boolean;
		formattedValue: string;
	} {
		// Try GPS types first
		const gpsResult = gpsType.validateAndFormat(header, value);
		if (gpsResult.type) {
			return gpsResult;
		}

		// Try date
		const dateResult = dateType.validateAndFormat(header, value);
		if (dateResult.type) {
			return dateResult;
		}

		// Try number
		const numberResult = numberType.validateAndFormat(header, value);
		if (numberResult.type) {
			return numberResult;
		}

		// Default to string
		return {
			type: 'string',
			isValid: true,
			formattedValue: value
		};
	}

	// Column validation
	function validateColumns() {
		const newInvalidCells: Record<string, Set<number>> = {};

		for (const [header, type] of Object.entries(columnTypes)) {
			if (type === 'delete' || toggledColumns[header]) continue;

			const invalidSet = new Set<number>();
			data.forEach((row, index) => {
				const value = row[header]?.trim();
				if (!value) return;

				const result = validateAndFormatData(header, value);
				if (!result.isValid) {
					invalidSet.add(index);
				}
			});

			if (invalidSet.size > 0) {
				newInvalidCells[header] = invalidSet;
			}
		}

		invalidCells = newInvalidCells;
	}

	// Handle type changes
	function handleTypeChange(event: CustomEvent<{ columnHeader: string; type: string }>) {
		const { columnHeader, type } = event.detail;
		columnTypes = { ...columnTypes, [columnHeader]: type };
		validateColumns();
		transformedData = formatDataForDisplay();
	}

	function handleColumnToggle(header: string, isActive: boolean) {
		toggledColumns = { ...toggledColumns, [header]: !isActive };
		validateColumns();
		transformedData = formatDataForDisplay();
	}

	// Initialize types and validation on data change
	$effect(() => {
		if (!data.length) return;

		// Detect types for new columns
		const headers = Object.keys(data[0]);
		headers.forEach((header) => {
			if (!columnTypes[header]) {
				const result = validateAndFormatData(header, data[0][header]);
				columnTypes[header] = result.type;
			}
		});

		validateColumns();
		transformedData = formatDataForDisplay();
	});

	function transformData() {
		// Filter out deleted and toggled-off columns
		const headers = Object.keys(data[0]);
		const validHeaders = headers.filter(
			(header) => columnTypes[header] !== 'delete' && !toggledColumns[header]
		);

		// Create transformed dataset
		const transformedDataset = data
			.map((row, index) => {
				const newRow: Record<string, any> = {};

				for (const header of validHeaders) {
					// Skip if cell is invalid
					if (invalidCells[header]?.has(index)) continue;

					const value = row[header]?.trim();
					if (!value) continue;

					const result = validateAndFormatData(header, value);
					newRow[header] = result.formattedValue;
				}
				return newRow;
			})
			.filter((row) => Object.keys(row).length > 0);

		return {
			data: transformedDataset,
			headers: validHeaders,
			types: columnTypes
		};
	}

	async function handleTransform() {
		if (!canTransform()) {
			console.error('Data not ready for transformation');
			return;
		}

		try {
			const transformed = transformData();
			sessionStorage.setItem('transformedData', JSON.stringify(transformed));
			await import('$app/navigation').then(({ goto }) => goto('/transplant'));
		} catch (error) {
			console.error('Error in transform:', error);
		}
	}

	function handleDataLoaded(event: CustomEvent<{ data: Record<string, string>[] }>) {
		originalData = event.detail.data.map((row) => ({ ...row }));
		data = originalData;
	}

	function formatDataForDisplay(): Record<string, string>[] {
    return data.map((row) => {
        const formattedRow: Record<string, string> = {};
        for (const [key, value] of Object.entries(row)) {
            if (toggledColumns[key] || !value?.trim()) {
                formattedRow[key] = value;
                continue;
            }
            
            // Get formatted value from type handlers
            const result = validateAndFormatData(key, value);
            formattedRow[key] = result.formattedValue;
        }
        return formattedRow;
    });
}
</script>

<div class="transform-manager">
	<CSVImporter on:dataLoaded={handleDataLoaded} />
	{#if data.length}
		<DataPreviewTable
			rows={transformedData}
			{invalidCells}
			{columnTypes}
			on:typeChange={handleTypeChange}
			on:columnToggle={handleColumnToggle}
		/>
	{/if}
	<button onclick={handleTransform}>Transform</button>
</div>
