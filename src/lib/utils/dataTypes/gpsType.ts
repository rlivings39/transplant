import { convertDMSToDecimal, isDMSFormat } from './dmsConverter';

// GPS TYPE 🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️🌎️
export interface GpsCoordinate {
	latitude: number;
	longitude: number;
}

export interface ValidationResult {
	type: 'gps' | 'latitude' | 'longitude' | 'string';
	isValid: boolean;
	formattedValue: string;
}

// GPS Detection & Validation
export function parseGpsCoordinate(value: string): GpsCoordinate | null {
	if (!value?.trim()) return null;

	// Split on common separators and clean up
	const parts = value
		.split(/[,;|]|\s+/)
		.map((part) => part.trim())
		.filter(Boolean);

	// Need exactly two parts for lat/lon
	if (parts.length !== 2) return null;

	const lat = parseCoordinate(parts[0]);
	const lon = parseCoordinate(parts[1]);

	if (lat === null || lon === null) return null;
	if (!isValidLatitude(lat) || !isValidLongitude(lon)) return null;

	return { latitude: lat, longitude: lon };
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

// LATITUDE AND LONGITUDE 🌐️🌐️🌐️🌐️🌐️🌐️🌐️🌐️🌐️🌐️🌐️🌐️🌐️🌐️🌐️🌐️🌐️🌐️🌐️🌐️🌐️🌐️🌐️🌐️🌐️🌐️🌐️
// Core validation functions
export function isValidLatitude(value: string | number): boolean {
	if (!value && value !== 0) return false;

	if (typeof value === 'number') {
		return !isNaN(value) && value >= -90 && value <= 90;
	}

	// Try parsing as DMS first
	if (isDMSFormat(value)) {
		const decimal = convertDMSToDecimal(value);
		if (decimal !== null) {
			return decimal >= -90 && decimal <= 90;
		}
	}

	// Fall back to decimal degrees
	const num = Number(value);
	return !isNaN(num) && num >= -90 && num <= 90;
}

export function isValidLongitude(value: string | number): boolean {
	if (!value && value !== 0) return false; // Allow 0 but not empty/null/undefined

	// If it's already a number, validate it directly
	if (typeof value === 'number') {
		return !isNaN(value) && value >= -180 && value <= 180;
	}

	// Try parsing as DMS first
	const dmsValue = parseDMS(value);
	if (dmsValue !== null) {
		return dmsValue >= -180 && dmsValue <= 180;
	}

	// Fall back to decimal degrees
	const num = Number(value);
	return !isNaN(num) && num >= -180 && num <= 180;
}

// Lat/Lon Detection
export function detectCoordinateType(
	header: string,
	samples: string[]
): 'latitude' | 'longitude' | null {
	const headerLower = header.toLowerCase();

	// More flexible patterns that match any string containing l-a-t or l-o-n in that order
	const latPattern = /l.*?a.*?t/;
	const lonPattern = /l.*?o.*?n/;

	if (latPattern.test(headerLower)) {
		return 'latitude';
	}
	if (lonPattern.test(headerLower)) {
		return 'longitude';
	}

	return null;
}

// Clean up coordinate input
function cleanCoordinateString(value: string): string {
	return value
		.trim()
		.replace(/\s+/g, ' ') // normalize spaces
		.replace(/[°˚⁰º]/g, '°') // normalize degree symbols
		.replace(/['′']/g, "'") // normalize minute symbols
		.replace(/["″"]/g, '"') // normalize second symbols
		.replace(/\s*([NSEW])\s*$/i, '$1'); // remove spaces before direction
}

// Parse DMS to decimal degrees
function parseDMS(value: string): number | null {
	const cleaned = cleanCoordinateString(value);

	// Try various patterns from most specific to least
	const patterns = [
		// 48° 51' 24.0" N or 48° 51' 24.0'' N
		/^(-?\d+)\s*°?\s*(\d+)\s*'?\s*(\d+(?:\.\d+)?)\s*(?:''|"|″)?\s*([NSEWnsew])?$/,
		// 48°51'24.0"N or 48°51'24.0''N
		/^(-?\d+)°(\d+)'(\d+(?:\.\d+)?)(?:''|"|″)?([NSEWnsew])?$/,
		// 48 51 24.0 N
		/^(-?\d+)\s+(\d+)\s+(\d+(?:\.\d+)?)\s*([NSEWnsew])?$/,
		// 48° 51' N
		/^(-?\d+)\s*°?\s*(\d+)\s*'?\s*([NSEWnsew])?$/,
		// 48° N
		/^(-?\d+)\s*°?\s*([NSEWnsew])?$/
	];

	for (const pattern of patterns) {
		const match = cleaned.match(pattern);
		if (match) {
			const degrees = parseFloat(match[1]);
			const minutes = match[2] ? parseFloat(match[2]) : 0;
			const seconds = match[3] ? parseFloat(match[3]) : 0;
			const direction = match[match.length - 1]?.toUpperCase();

			if (minutes >= 60 || seconds >= 60) continue;

			let decimal = degrees + minutes / 60 + seconds / 3600;
			if (direction === 'S' || direction === 'W') {
				decimal = -decimal;
			}

			return decimal;
		}
	}
	return null;
}

// Parse any coordinate format
function parseCoordinate(value: string): number | null {
	if (!value?.trim()) return null;

	// Try decimal degrees first
	const ddValue = parseFloat(value);
	if (!isNaN(ddValue)) {
		const direction = value
			.trim()
			.match(/[NSEWnsew]$/)?.[0]
			?.toUpperCase();
		return direction === 'S' || direction === 'W' ? -ddValue : ddValue;
	}

	// Try DMS format
	return parseDMS(value);
}

// Type handlers that TransformManager can use
export const latitudeHandler = {
	validate: isValidLatitude,
	format: (value: string) => {
		if (isDMSFormat(value)) {
			const decimal = convertDMSToDecimal(value);
			return decimal !== null ? decimal.toFixed(6) : value;
		}
		return parseFloat(value).toFixed(6);
	},
	detect: (samples: string[], header?: string) =>
		detectCoordinateType(header || '', samples) === 'latitude'
};

export const longitudeHandler = {
	validate: isValidLongitude,
	format: (value: string) => {
		if (isDMSFormat(value)) {
			const decimal = convertDMSToDecimal(value);
			return decimal !== null ? decimal.toFixed(6) : value;
		}
		return parseFloat(value).toFixed(6);
	},
	detect: (samples: string[], header?: string) =>
		detectCoordinateType(header || '', samples) === 'longitude'
};

// The main validation and formatting function for TransformManager
export function validateAndFormat(header: string, value: string): ValidationResult {
	if (!value?.trim()) {
		return { type: null, isValid: true, formattedValue: value };
	}

	// Check if it's a GPS coordinate pair
	const gpsCoord = parseGpsCoordinate(value);
	if (gpsCoord) {
		return {
			type: 'gps',
			isValid: true,
			formattedValue: formatGpsCoordinate(gpsCoord)
		};
	}

	// Check if it's latitude
	const headerLower = header.toLowerCase();
	if (/lat|latitude/.test(headerLower)) {
		if (isValidLatitude(value)) {
			return {
				type: 'latitude',
				isValid: true,
				formattedValue: latitudeHandler.format(value)
			};
		}
		return { type: 'latitude', isValid: false, formattedValue: value };
	}

	// Check if it's longitude
	if (/lon|longitude/.test(headerLower)) {
		if (isValidLongitude(value)) {
			return {
				type: 'longitude',
				isValid: true,
				formattedValue: longitudeHandler.format(value)
			};
		}
		return { type: 'longitude', isValid: false, formattedValue: value };
	}

	// Not a GPS-related value
	return { type: null, isValid: true, formattedValue: value };
}
