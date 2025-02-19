<script lang="ts">
	// Types for GPS data
	interface GpsPoint {
		lat: number;
		lon: number;
		source: string;
	}

	// Props
	const { row, columnHeaders, toggledColumns } = $props<{
		row: Record<string, string>;
		columnHeaders: string[];
		toggledColumns: Record<string, boolean>;
	}>();

	// Parse DD format (e.g., "49.266446, -123.071453" or separate lat/lon)
	function parseDD(value: string): GpsPoint | null {
		// Try parsing combined format first
		const combined = value.match(/(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/);
		if (combined) {
			const [_, lat, lon] = combined;
			return {
				lat: parseFloat(lat),
				lon: parseFloat(lon),
				source: 'dd'
			};
		}
		return null;
	}

	// Parse DMS format (e.g., "49°15'59.2"N 123°04'17.2"W")
	function parseDMS(value: string): GpsPoint | null {
		const dms = value.match(/(\d+)°(\d+)'(\d+\.?\d*)"([NS])\s*(\d+)°(\d+)'(\d+\.?\d*)"([EW])/);
		if (dms) {
			const [_, latD, latM, latS, latDir, lonD, lonM, lonS, lonDir] = dms;
			const lat =
				(parseInt(latD) + parseInt(latM) / 60 + parseFloat(latS) / 3600) *
				(latDir === 'N' ? 1 : -1);
			const lon =
				(parseInt(lonD) + parseInt(lonM) / 60 + parseFloat(lonS) / 3600) *
				(lonDir === 'E' ? 1 : -1);
			return {
				lat,
				lon,
				source: 'dms'
			};
		}
		return null;
	}

	// Get primary GPS point from row data
	function getPrimaryGpsPoint(): GpsPoint | null {
		// Filter out toggled-off columns
		const activeColumns = columnHeaders.filter((header) => !toggledColumns[header]);

		for (const header of activeColumns) {
			const value = row[header];
			if (!value) continue;

			// Try parsing as DD format
			const ddPoint = parseDD(value);
			if (ddPoint) return ddPoint;

			// Try parsing as DMS format
			const dmsPoint = parseDMS(value);
			if (dmsPoint) return dmsPoint;
		}

		// TODO: Implement address geocoding fallback
		return null;
	}

	// Format GPS point for display
	function formatGpsPoint(point: GpsPoint | null): string {
		if (!point || typeof point.lat !== 'number' || typeof point.lon !== 'number') return '';
		try {
			return `${point.lat.toFixed(6)}, ${point.lon.toFixed(6)}`;
		} catch (e) {
			return '';
		}
	}

	// Reactive GPS point calculation
	let gpsPoint = $derived(getPrimaryGpsPoint());
	let displayValue = $derived(formatGpsPoint(gpsPoint));
</script>

<td class="gps-column">
	{displayValue}
</td>

<style>
	.gps-column {
		width: 12.5rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		padding: 0.25rem 0.5rem;
	}
</style>
