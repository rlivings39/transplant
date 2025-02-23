// GPS TYPE 🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️
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

// Core validation functions
export function isValidLatitude(value: string | number): boolean {
	if (value === null || value === undefined || value === '') return false;
	const num = typeof value === 'number' ? value : Number(value);
	return !isNaN(num) && num >= -90 && num <= 90;
}

export function isValidLongitude(value: string | number): boolean {
	if (value === null || value === undefined || value === '') return false;
	const num = typeof value === 'number' ? value : Number(value);
	return !isNaN(num) && num >= -180 && num <= 180;
}

// Lat/Lon Detection
export function detectCoordinateType(
	header: string,
	value: string
): 'latitude' | 'longitude' | null {
	if (!value?.trim()) return null;

	const headerLower = header.toLowerCase();
	const isLatHeader = /(^|[^a-z])(lat|latitude)([^a-z]|$)/.test(headerLower);
	const isLonHeader = /(^|[^a-z])(lon|longitude)([^a-z]|$)/.test(headerLower);

	if (isLatHeader && isValidLatitude(value)) return 'latitude';
	if (isLonHeader && isValidLongitude(value)) return 'longitude';

	return null;
}
