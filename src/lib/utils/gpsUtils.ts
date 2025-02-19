export interface GpsCoordinate {
	latitude: number;
	longitude: number;
}

export function isValidCoordinate(lat: number, lon: number): boolean {
	return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

export function formatGpsCoordinate(coord: GpsCoordinate | null): string {
	if (!coord) return '';
	// Format with consistent precision
	return `${coord.latitude}, ${coord.longitude}`;
}

export function parseGpsCoordinate(value: string): GpsCoordinate | null {
	// DD format (decimal degrees)
	const ddMatch = value.match(/^\s*(-?\d+\.?\d*)\s*[,\s]\s*(-?\d+\.?\d*)\s*$/);
	if (ddMatch) {
		const lat = Number(ddMatch[1]); // Use Number instead of parseFloat to preserve precision
		const lon = Number(ddMatch[2]);
		if (!isNaN(lat) && !isNaN(lon) && isValidCoordinate(lat, lon)) {
			return { latitude: lat, longitude: lon };
		}
	}

	// DMS format (e.g., "48° 51' 24.0" N, 2° 21' 03.0" E")
	const dmsMatch = value.match(
		/^\s*(\d+)°\s*(\d+)'\s*(\d+(\.\d+)?)?\"?\s*([NS])\s*,?\s*(\d+)°\s*(\d+)'\s*(\d+(\.\d+)?)?\"?\s*([EW])\s*$/i
	);
	if (dmsMatch) {
		const latDeg = Number(dmsMatch[1]);
		const latMin = Number(dmsMatch[2]);
		const latSec = Number(dmsMatch[3] || '0');
		const latDir = dmsMatch[5].toUpperCase();

		const lonDeg = Number(dmsMatch[6]);
		const lonMin = Number(dmsMatch[7]);
		const lonSec = Number(dmsMatch[8] || '0');
		const lonDir = dmsMatch[10].toUpperCase();

		// Convert to decimal degrees with high precision
		let lat = latDeg + (latMin + latSec / 60) / 60;
		let lon = lonDeg + (lonMin + lonSec / 60) / 60;

		if (latDir === 'S') lat = -lat;
		if (lonDir === 'W') lon = -lon;

		if (isValidCoordinate(lat, lon)) {
			return { latitude: lat, longitude: lon };
		}
	}

	return null;
}
