export interface GpsCoordinate {
	latitude: number;
	longitude: number;
}

export function isValidCoordinate(lat: number, lon: number): boolean {
	return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

function parseDmsValue(dms: string): number | null {
	// Handle decimal degrees format (e.g., "34.0522°")
	const decimalMatch = dms.match(/^(-?\d+\.?\d*)°/);
	if (decimalMatch) {
		return Number(decimalMatch[1]);
	}

	// Handle DMS format (e.g., "51° 30' 26\"")
	const dmsMatch = dms.match(/(\d+)°\s*(\d+)'\s*(\d+(\.\d+)?)?"/);
	if (dmsMatch) {
		const degrees = Number(dmsMatch[1]);
		const minutes = Number(dmsMatch[2]);
		const seconds = Number(dmsMatch[3] || '0');

		if (!isNaN(degrees) && !isNaN(minutes) && !isNaN(seconds)) {
			return degrees + minutes / 60 + seconds / 3600;
		}
	}

	return null;
}

export function parseGpsCoordinate(value: string): GpsCoordinate | null {
	if (!value?.trim()) return null;

	// Normalize spaces and quotes
	const normalized = value.replace(/[""]/g, '"').replace(/\s+/g, ' ').trim();

	// Try to split into lat/lon parts
	const parts = normalized.split(',').map((p) => p.trim());
	if (parts.length !== 2) return null;

	let [latPart, lonPart] = parts;

	// Extract values and directions
	const latDir = latPart.includes('N') ? 1 : latPart.includes('S') ? -1 : null;
	const lonDir = lonPart.includes('E') ? 1 : lonPart.includes('W') ? -1 : null;

	// Remove direction indicators for parsing
	latPart = latPart.replace(/[NS]$/, '').trim();
	lonPart = lonPart.replace(/[EW]$/, '').trim();

	const lat = parseDmsValue(latPart);
	const lon = parseDmsValue(lonPart);

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

export function formatGpsCoordinate(coord: GpsCoordinate | null): string {
	if (!coord) return '';
	return `${coord.latitude.toFixed(6)}, ${coord.longitude.toFixed(6)}`;
}
