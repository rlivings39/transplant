<script lang="ts">
	let {
		header,
		data,
		type = $bindable<string>('string')
	} = $props<{
		header: string;
		data: Record<string, string>[];
		type?: string;
	}>();

	const types = ['string', 'number', 'date', 'gps', 'delete'];

	// Auto-detect type from first 10 non-empty values
	$effect(() => {
		if (data.length === 0) return;

		const typeCounts = new Map<string, number>();
		let samplesChecked = 0;

		for (const row of data) {
			const value = row[header]?.trim();
			if (!value) continue; // Skip empty cells

			const detected = detectType(value);
			typeCounts.set(detected, (typeCounts.get(detected) || 0) + 1);

			if (++samplesChecked >= 10) break;
		}

		if (typeCounts.size > 0) {
			type = Array.from(typeCounts.entries()).reduce((a, b) => (b[1] > a[1] ? b : a))[0];
		}
	});

	function isValidCoordinate(lat: number, lon: number): boolean {
		return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
	}

	function parseDD(value: string): { lat: number; lon: number } | null {
		// Match DD format: 37.7749, -122.4194
		const ddMatch = value.match(/^\s*(-?\d+\.?\d*)\s*[,\s]\s*(-?\d+\.?\d*)\s*$/);
		if (ddMatch) {
			const lat = parseFloat(ddMatch[1]);
			const lon = parseFloat(ddMatch[2]);
			if (!isNaN(lat) && !isNaN(lon) && isValidCoordinate(lat, lon)) {
				return { lat, lon };
			}
		}
		return null;
	}

	function parseDMS(value: string): { lat: number; lon: number } | null {
		// Match DMS format: 37°46'29"N 122°25'10"W
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
					return { lat, lon };
				}
			} catch (e) {
				return null;
			}
		}
		return null;
	}

	function detectType(value: string): string {
		if (/^-?\d+\.?\d*$/.test(value)) return 'number';
		if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?Z?)?$/.test(value)) {
			const date = new Date(value);
			if (!isNaN(date.getTime())) return 'date';
		}

		// Check for GPS coordinates
		if (parseDD(value) || parseDMS(value)) {
			return 'gps';
		}

		// Check for single coordinate (lat or lon)
		const singleCoord = parseFloat(value);
		if (!isNaN(singleCoord) && (Math.abs(singleCoord) <= 90 || Math.abs(singleCoord) <= 180)) {
			return 'gps';
		}

		return 'string';
	}
	
  function detectColumnType(values: string[]): string {
		const sample = values.slice(0, 10).filter(Boolean);

		if (sample.every((v) => !isNaN(Number(v)))) return 'number';
		if (sample.every((v) => !isNaN(Date.parse(v)))) return 'date';
		if (sample.every((v) => EMAIL_REGEX.test(v))) return 'email';

		return 'string';
	}
</script>

<select bind:value={type}>
	{#each types as t}
		<option value={t}>{t.toUpperCase()}</option>
	{/each}
</select>
