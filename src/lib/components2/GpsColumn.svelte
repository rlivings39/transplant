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

	// Parse DD format (e.g., "45.123, -122.456")
	function parseDD(value: string): GpsPoint | null {
		const ddMatch = value.match(/^\s*(-?\d+\.?\d*)\s*[,\s]\s*(-?\d+\.?\d*)\s*$/);
		if (ddMatch) {
			const lat = parseFloat(ddMatch[1]);
			const lon = parseFloat(ddMatch[2]);
			if (!isNaN(lat) && !isNaN(lon) && isValidCoordinate(lat, lon)) {
				return { lat, lon, source: 'dd' };
			}
		}
		return null;
	}

	interface GpsPoint {
		lat: number;
		lon: number;
		source: 'dd' | 'dms' | 'split';
	}

	// Parse DMS format (e.g., "49°15'59.2"N 123°04'17.2"W")
	function parseDMS(value: string): GpsPoint | null {
		const dmsMatch = value.match(
			/^\s*(\d+)°\s*(\d+)'\s*(\d+(\.\d+)?)?"?\s*([NS])\s*(\d+)°\s*(\d+)'\s*(\d+(\.\d+)?)?"?\s*([EW])\s*$/i
		);
		if (dmsMatch) {
			try {
				const [_, latD, latM, latS, , latDir, lonD, lonM, lonS, , lonDir] = dmsMatch;
				const lat =
					(parseInt(latD) + parseInt(latM) / 60 + parseFloat(latS || '0') / 3600) *
					(latDir.toUpperCase() === 'N' ? 1 : -1);
				const lon =
					(parseInt(lonD) + parseInt(lonM) / 60 + parseFloat(lonS || '0') / 3600) *
					(lonDir.toUpperCase() === 'E' ? 1 : -1);
				if (!isNaN(lat) && !isNaN(lon) && isValidCoordinate(lat, lon)) {
					return { lat, lon, source: 'dms' };
				}
			} catch (e) {
				return null;
			}
		}
		return null;
	}

	// Try to find matching lat/lon columns
	function findLatLonPair(): GpsPoint | null {
		let lat: number | null = null;
		let lon: number | null = null;

		const activeColumns = columnHeaders.filter((header) => !toggledColumns[header]);

		for (const header of activeColumns) {
			const value = row[header]?.trim();
			if (!value) continue;

			const num = parseFloat(value);
			if (isNaN(num)) continue;

			const headerLower = header.toLowerCase();
			if (headerLower.includes('lat') && Math.abs(num) <= 90) {
				lat = num;
			} else if (headerLower.includes('lon') && Math.abs(num) <= 180) {
				lon = num;
			}
		}

		if (lat !== null && lon !== null) {
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

		return null;
	}

	// Format GPS point for display
	function formatGpsPoint(point: GpsPoint | null): string {
		if (!point || typeof point.lat !== 'number' || typeof point.lon !== 'number') return '';
		try {
			// Preserve full precision
			return `${point.lat}, ${point.lon}`;
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
