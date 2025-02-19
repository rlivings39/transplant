export interface GpsCoordinate {
	latitude: number;
	longitude: number;
}

export function isValidCoordinate(lat: number, lon: number): boolean {
	return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

export function formatGpsCoordinate(coord: GpsCoordinate | null): string {
	if (!coord) return '';
	// Don't use toFixed, just return the numbers as they are
	return `${coord.latitude}, ${coord.longitude}`;
}

export function parseGpsCoordinate(value: string): GpsCoordinate | null {
	// DD format (decimal degrees)
	const ddMatch = value.match(/^\s*(-?\d+\.?\d*)\s*[,\s]\s*(-?\d+\.?\d*)\s*$/);
	if (ddMatch) {
		const lat = parseFloat(ddMatch[1]);
		const lon = parseFloat(ddMatch[2]);
		if (!isNaN(lat) && !isNaN(lon) && isValidCoordinate(lat, lon)) {
			return { latitude: lat, longitude: lon };
		}
	}

	// DMS format
	const dmsMatch = value.match(
		/^\s*(\d+)°\s*(\d+)'\s*(\d+(\.\d+)?)?\"?\s*([NS])\s*(\d+)°\s*(\d+)'\s*(\d+(\.\d+)?)?\"?\s*([EW])\s*$/i
	);
	if (dmsMatch) {
		const latDeg = parseInt(dmsMatch[1]);
		const latMin = parseInt(dmsMatch[2]);
		const latSec = parseFloat(dmsMatch[3] || '0');
		const latDir = dmsMatch[5].toUpperCase();

		const lonDeg = parseInt(dmsMatch[6]);
		const lonMin = parseInt(dmsMatch[7]);
		const lonSec = parseFloat(dmsMatch[8] || '0');
		const lonDir = dmsMatch[10].toUpperCase();

		let lat = latDeg + latMin / 60 + latSec / 3600;
		let lon = lonDeg + lonMin / 60 + lonSec / 3600;

		if (latDir === 'S') lat = -lat;
		if (lonDir === 'W') lon = -lon;

		if (isValidCoordinate(lat, lon)) {
			return { latitude: lat, longitude: lon };
		}
	}

	return null;
}
