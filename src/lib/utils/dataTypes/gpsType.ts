// GPS TYPE 🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️
export interface GpsCoordinate {
	latitude: number;
	longitude: number;
}

// GPS Detection & Validation
export function parseGpsCoordinate(value: string): GpsCoordinate | null {
	if (!value?.trim()) return null;
	const parts = value.split(/[,\s]+/).filter(Boolean);
	
	if (parts.length !== 2) return null;
	if (!isValidLatitude(parts[0]) || !isValidLongitude(parts[1])) return null;
	
	return {
		latitude: Number(parts[0]),
		longitude: Number(parts[1])
	};
}

// Required by TransformManager for GPS type
export function detect(samples: string[]): boolean {
	const nonEmptySamples = samples.filter((s) => s.trim());
	if (nonEmptySamples.length === 0) return true;
	return nonEmptySamples.every((value) => parseGpsCoordinate(value) !== null);
}

export function validate(value: string): boolean {
	return parseGpsCoordinate(value) !== null;
}

// GPS Formatting
export function formatGpsCoordinate(coord: GpsCoordinate | null): string {
	if (!coord) return '';
	return `${coord.latitude.toFixed(6)}, ${coord.longitude.toFixed(6)}`;
}

// LATITUDE AND LONGITUDE 🌐️🌐️🌐️🌐️🌐️🌐️🌐️🌐️🌐️🌐️🌐️🌐️🌐️🌐️🌐️🌐️🌐️🌐️🌐️🌐️🌐️🌐️🌐️🌐️🌐️🌐️


// Type handlers that TransformManager can use
export const latitudeHandler = {
	validate: isValidLatitude,
	format: (value: string) => parseFloat(value).toFixed(6),
	detect: (samples: string[], header?: string) =>
		detectCoordinateType(header || '', samples) === 'latitude'
};

export const longitudeHandler = {
	validate: isValidLongitude,
	format: (value: string) => parseFloat(value).toFixed(6),
	detect: (samples: string[], header?: string) =>
		detectCoordinateType(header || '', samples) === 'longitude'
};

// Core validation functions
export function isValidLatitude(value: string | number): boolean {
	if (!value && value !== 0) return false; // Allow 0 but not empty/null/undefined
	const num = typeof value === 'number' ? value : Number(value);
	return !isNaN(num) && num >= -90 && num <= 90;
}

export function isValidLongitude(value: string | number): boolean {
	if (!value && value !== 0) return false; // Allow 0 but not empty/null/undefined
	const num = typeof value === 'number' ? value : Number(value);
	return !isNaN(num) && num >= -180 && num <= 180;
}

// Lat/Lon Detection
export function detectCoordinateType(
	header: string,
	samples: string[]
): 'latitude' | 'longitude' | null {
	if (!samples.length) return null;

	const headerLower = header.toLowerCase();
	const isLatHeader = /lat|latitude/.test(headerLower);
	const isLonHeader = /lon|longitude/.test(headerLower);

	// Get non-empty samples
	const validSamples = samples.filter((value) => value?.trim());
	if (!validSamples.length) return null;

	// Check if all valid samples match the type
	if (isLatHeader && validSamples.every((value) => isValidLatitude(value))) {
		return 'latitude';
	}
	if (isLonHeader && validSamples.every((value) => isValidLongitude(value))) {
		return 'longitude';
	}

	return null;
}
