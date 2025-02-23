import { parseGpsCoordinate, formatGpsCoordinate } from '$lib/utils/dataTypes/gpsType';

export function validate(value: string): boolean {
	if (!value?.trim()) return true;
	return parseGpsCoordinate(value) !== null;
}

export function format(value: string): string {
	if (!value?.trim()) return value;
	const coord = parseGpsCoordinate(value);
	return coord ? formatGpsCoordinate(coord) : value;
}

export function detect(samples: string[]): boolean {
	return samples.every((value) => validate(value));
}


function parseDmsPart(dms: string): number | null {
	console.log('Parsing DMS part:', dms);

	// Handle DMS format (e.g., "48° 51' 24.0"")
	if (dms.includes("'")) {
		// Quick check for DMS format
		const dmsMatch = dms.match(/^(\d+)°\s*(\d+)'\s*(\d+(\.\d+)?)"/);
		console.log('DMS match:', dmsMatch);

		if (dmsMatch) {
			const degrees = Number(dmsMatch[1]);
			const minutes = Number(dmsMatch[2]);
			const seconds = Number(dmsMatch[3] || '0');

			console.log('DMS parts:', { degrees, minutes, seconds });

			if (!isNaN(degrees) && !isNaN(minutes) && !isNaN(seconds)) {
				// DD = Degrees + Minutes/60 + Seconds/3600
				const decimal = degrees + minutes / 60 + seconds / 3600;
				console.log('Converted to decimal:', decimal);
				return decimal;
			}
		}
	}

	// Handle decimal degrees format (e.g., "34.0522°")
	if (!dms.includes("'")) {
		// Only try decimal if not DMS
		const decimalMatch = dms.match(/^(-?\d+\.?\d*)°/);
		if (decimalMatch) {
			console.log('Matched decimal format:', decimalMatch[1]);
			return Number(decimalMatch[1]);
		}
	}

	console.log('Failed to parse DMS part');
	return null;
}

function isValidDecimalCoordinate(value: string): boolean {
	return value.includes('.') && value.split('.')[1].length >= 2;
}

function parseDecimalDegrees(value: string): GpsCoordinate | null {
	// Remove any quotes and trim
	value = value.trim();

	// Try comma-separated format first (with flexible spacing)
	let parts = value.split(',');
	if (parts.length === 2) {
		// Trim each part
		parts = parts.map((p) => p.trim());
	} else {
		// Try space-separated (require 1-5 spaces)
		const spaceMatch = value.match(/^(-?\d+\.\d+)\s{1,5}(-?\d+\.\d+)$/);
		if (!spaceMatch) return null;
		parts = [spaceMatch[1], spaceMatch[2]];
	}

	const [latStr, lonStr] = parts;

	// Parse numbers
	const lat = parseFloat(latStr);
	const lon = parseFloat(lonStr);

	// Validate format and ranges
	if (
		!isNaN(lat) &&
		!isNaN(lon) &&
		isValidDecimalCoordinate(latStr) &&
		isValidDecimalCoordinate(lonStr) &&
		lat >= -90 &&
		lat <= 90 &&
		lon >= -180 &&
		lon <= 180
	) {
		return { latitude: lat, longitude: lon };
	}

	return null;
}

export function parseGpsCoordinate(value: string): GpsCoordinate | null {
	console.log('Parsing GPS coordinate:', value);
	if (!value?.trim()) return null;

	// First try decimal degrees format
	const ddResult = parseDecimalDegrees(value);
	if (ddResult) {
		console.log('Parsed as decimal degrees:', ddResult);
		return ddResult;
	}

	// If not DD, try DMS format
	// Normalize spaces and quotes
	const normalized = value.replace(/[""]/g, '"').replace(/\s+/g, ' ').trim();

	// Split into parts
	const parts = normalized.split(',').map((p) => p.trim());
	if (parts.length !== 2) return null;

	let [latPart, lonPart] = parts;

	// Extract directions
	const latDir = latPart.includes('N') ? 1 : latPart.includes('S') ? -1 : null;
	const lonDir = lonPart.includes('E') ? 1 : lonPart.includes('W') ? -1 : null;

	// Remove direction indicators
	latPart = latPart.replace(/[NS]$/, '').trim();
	lonPart = lonPart.replace(/[EW]$/, '').trim();

	const lat = parseDmsPart(latPart);
	const lon = parseDmsPart(lonPart);

	if (lat === null || lon === null || latDir === null || lonDir === null) {
		return null;
	}

	const latitude = lat * latDir;
	const longitude = lon * lonDir;

	if (!isValidCoordinate(latitude, longitude)) {
		return null;
	}

	return { latitude, longitude };
}

export interface GpsCoordinate {
	latitude: number;
	longitude: number;
}

export function isValidCoordinate(lat: number, lon: number): boolean {
	return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

export function formatGpsCoordinate(coord: GpsCoordinate | null): string {
	if (!coord) return '';
	return `${coord.latitude.toFixed(6)}, ${coord.longitude.toFixed(6)}`;
}

export function isValidLatitude(value: string | number): boolean {
	const num = typeof value === 'string' ? parseFloat(value) : value;
	// Must be a valid number between -90 and 90 with at least 2 decimal places
	return (
		!isNaN(num) &&
		num >= -90 &&
		num <= 90 &&
		value.toString().includes('.') &&
		value.toString().split('.')[1].length >= 2
	);
}

export function isValidLongitude(value: string | number): boolean {
	const num = typeof value === 'string' ? parseFloat(value) : value;
	// Must be a valid number between -180 and 180 with at least 2 decimal places
	return (
		!isNaN(num) &&
		num >= -180 &&
		num <= 180 &&
		value.toString().includes('.') &&
		value.toString().split('.')[1].length >= 2
	);
}

export function detectCoordinateType(
	header: string,
	value: string
): 'latitude' | 'longitude' | null {
	const headerLower = header.toLowerCase();

	// Check if header matches lat/lon pattern
	const isLatHeader = /l.*?a.*?t/.test(headerLower);
	const isLonHeader = /l.*?o.*?n/.test(headerLower);

	// Try to parse as number
	const num = parseFloat(value);
	if (isNaN(num)) return null;

	// First try to match based on header pattern
	if (isLatHeader && isValidLatitude(value)) {
		return 'latitude';
	}
	if (isLonHeader && isValidLongitude(value)) {
		return 'longitude';
	}

	// If header doesn't match pattern, try to infer from value range
	if (isValidLatitude(value) && Math.abs(num) <= 90) {
		return 'latitude';
	}
	if (isValidLongitude(value) && Math.abs(num) <= 180) {
		return 'longitude';
	}

	return null;
}
