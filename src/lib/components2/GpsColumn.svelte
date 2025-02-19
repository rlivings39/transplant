<script lang="ts">
	import {
		parseGpsCoordinate,
		formatGpsCoordinate,
		type GpsCoordinate,
		isValidCoordinate
	} from '$lib/utils/gpsUtils';

	// Props
	const { row, columnHeaders, toggledColumns } = $props<{
		row: Record<string, string>;
		columnHeaders: string[];
		toggledColumns: Record<string, boolean>;
	}>();

	interface GpsPoint {
		lat: number;
		lon: number;
		source: 'dd' | 'dms' | 'split';
	}

	// Find matching lat/lon columns
	function findLatLonPair(): GpsPoint | null {
		let lat: number | null = null;
		let lon: number | null = null;
		let latHeader: string | null = null;
		let lonHeader: string | null = null;

		for (const header of columnHeaders) {
			if (toggledColumns[header]) continue;

			const value = row[header]?.trim();
			if (!value) continue;

			const num = parseFloat(value);
			if (isNaN(num)) continue;

			const headerLower = header.toLowerCase();
			if (headerLower.includes('lat') && Math.abs(num) <= 90) {
				lat = num;
				latHeader = header;
			} else if (headerLower.includes('lon') && Math.abs(num) <= 180) {
				lon = num;
				lonHeader = header;
			}
		}

		if (lat !== null && lon !== null && latHeader && lonHeader) {
			return { lat, lon, source: 'split' };
		}

		return null;
	}

	// Get primary GPS point from row data
	function getPrimaryGpsPoint(): GpsPoint | null {
		// First try to find matching lat/lon columns
		const splitPoint = findLatLonPair();
		if (splitPoint) return splitPoint;

		// Then try combined formats
		for (const header of columnHeaders) {
			if (!toggledColumns[header]) continue;

			const value = row[header];
			if (!value) continue;

			const coord = parseGpsCoordinate(value);
			if (coord) {
				return {
					lat: coord.latitude,
					lon: coord.longitude,
					source: 'dd' // We convert everything to DD format
				};
			}
		}

		return null;
	}

	function formatGpsPoint(point: GpsPoint | null): string {
		if (!point) return '';
		// Format in DD with 6 decimal places
		return `${point.lat.toFixed(6)}, ${point.lon.toFixed(6)}`;
	}

	// Reactive GPS point calculation
	let gpsPoint = $derived(getPrimaryGpsPoint());
	let displayValue = $derived(formatGpsPoint(gpsPoint));
	let isValid = $derived(gpsPoint !== null);
</script>

<td class="gps-column" class:invalid={!isValid}>
	{displayValue}
</td>

<style>
	.gps-column {
		font-family: monospace;
		width: 12.5rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		padding: 0.25rem 0.5rem;
	}
	.invalid {
		color: #999;
		font-style: italic;
	}
</style>
