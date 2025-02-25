// dmsConverter.ts

// Types for DMS components
interface DMSParts {
	degrees: number;
	minutes: number;
	seconds: number;
	direction?: 'N' | 'S' | 'E' | 'W';
}

// Clean up DMS string input
export function cleanDMSString(value: string): string {
	return value
		.trim()
		.replace(/\s+/g, ' ')
		.replace(/[°˚⁰º]/g, '°')
		.replace(/['′']/g, "'")
		.replace(/["″"]/g, '"')
		.replace(/\s*([NSEW])\s*$/i, '$1');
}

// Parse DMS string into parts
export function parseDMSParts(value: string): DMSParts | null {
	const cleaned = cleanDMSString(value);

	// Pattern for DMS format with direction
	const pattern = /(-?\d+)\s*°?\s*(\d+)\s*'?\s*(\d+(?:\.\d+)?)\s*(?:''|"|″)?\s*([NSEWnsew])/i;

	const match = cleaned.match(pattern);
	if (!match) return null;

	return {
		degrees: Math.abs(Number(match[1])),
		minutes: Number(match[2]),
		seconds: Number(match[3]),
		direction: match[4].toUpperCase() as 'N' | 'S' | 'E' | 'W'
	};
}

// Convert DMS parts to decimal degrees
export function dmsToDecimal(parts: DMSParts): number {
	let decimal = parts.degrees + parts.minutes / 60 + parts.seconds / 3600;

	// Apply negative for South or West
	if (parts.direction === 'S' || parts.direction === 'W') {
		decimal = -decimal;
	}

	return decimal;
}

// Detect if a string is in DMS format
export function isDMSFormat(value: string): boolean {
	const cleaned = cleanDMSString(value);
	// Pattern that matches a single DMS coordinate with required direction
	const pattern = /^-?\d+\s*°?\s*\d+\s*'?\s*\d+(?:\.\d+)?\s*(?:''|"|″)?\s*[NSEWnsew]$/i;
	return pattern.test(cleaned);
}

// Convert a coordinate pair from DMS to decimal degrees
export function convertCoordinatePair(value: string): string | null {
	// console.log('convertCoordinatePair input:', value);
	if (!value?.trim()) return null;

	// First split the raw string into coordinates
	const parts = value.split(',').map((p) => p.trim());
	// console.log('Split coordinates:', parts);

	if (parts.length !== 2) {
		// console.log('Did not find exactly 2 parts');
		return null;
	}

	const [latStr, lonStr] = parts;
	// console.log('Processing coordinates:', { lat: latStr, lon: lonStr });

	// Now process each coordinate separately
	let lat: number | null = null;
	let lon: number | null = null;

	// Handle latitude
	const cleanedLat = cleanDMSString(latStr);
	// console.log('Cleaned latitude:', cleanedLat);
	if (isDMSFormat(cleanedLat)) {
		const latParts = parseDMSParts(cleanedLat);
		if (latParts) {
			lat = dmsToDecimal(latParts);
			// console.log('Converted lat from DMS:', {
			// 	original: latStr,
			// 	cleaned: cleanedLat,
			// 	parts: latParts,
			// 	converted: lat
			// });
		}
	} else {
		lat = Number(cleanedLat);
		// console.log('Parsed lat as number:', lat);
	}

	// Handle longitude
	const cleanedLon = cleanDMSString(lonStr);
	// console.log('Cleaned longitude:', cleanedLon);
	if (isDMSFormat(cleanedLon)) {
		const lonParts = parseDMSParts(cleanedLon);
		if (lonParts) {
			lon = dmsToDecimal(lonParts);
			// console.log('Converted lon from DMS:', {
			// 	original: lonStr,
			// 	cleaned: cleanedLon,
			// 	parts: lonParts,
			// 	converted: lon
			// });
		}
	} else {
		lon = Number(cleanedLon);
		// console.log('Parsed lon as number:', lon);
	}

	if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) {
		// console.log('Failed to convert coordinates:', { lat, lon });
		return null;
	}

	const result = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
	// console.log('Final converted pair:', result);
	return result;
}

// Convert DMS to decimal degrees
export function convertDMSToDecimal(value: string): number | null {
	const parts = parseDMSParts(value);
	if (!parts) return null;
	return dmsToDecimal(parts);
}
