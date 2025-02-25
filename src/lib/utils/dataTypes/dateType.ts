export type DateType = 'date';

export interface ValidationResult {
	type: DateType | null;
	isValid: boolean;
	formattedValue: string;
}

// Common date formats
const DATE_FORMATS = [
	/^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
	/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/, // DD-MM-YYYY or MM-DD-YYYY
	/^\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}$/i // DD MMM YYYY
];

function isValidDate(dateStr: string): boolean {
	// Check if it's a year number between 1850-2035
	if (/^\d+$/.test(dateStr)) {
		const year = parseInt(dateStr);
		return year >= 1850 && year <= 2035;
	}

	// Try parsing as ISO date first
	const date = new Date(dateStr);
	if (!isNaN(date.getTime())) {
		const year = date.getFullYear();
		// Only accept dates between 1850 and 2035
		return year >= 1850 && year <= 2035;
	}

	// Try other date formats
	for (const format of DATE_FORMATS) {
		if (format.test(dateStr)) {
			// Extract year and validate range
			const yearMatch = dateStr.match(/\d{4}/);
			if (yearMatch) {
				const year = parseInt(yearMatch[0]);
				return year >= 1850 && year <= 2035;
			}
		}
	}

	return false;
}

function formatDate(dateStr: string): string {
	// If it's a year number, format as January 1st of that year
	if (/^\d+$/.test(dateStr)) {
		const year = parseInt(dateStr);
		if (year >= 1850 && year <= 2035) {
			return `${year}-01-01T00:00:00.000Z`;
		}
	}

	// Otherwise format as ISO date
	const date = new Date(dateStr);
	if (!isNaN(date.getTime())) {
		return date.toISOString();
	}
	return dateStr;
}

// Detect if a column of samples is a date type
export function detectType(header: string, samples: string[]): DateType | null {
	if (!samples.length) return null;

	// If all non-empty samples are valid dates, it's a date column
	const validSamples = samples.filter((s) => s?.trim());
	if (validSamples.every(isValidDate)) {
		return 'date';
	}

	return null;
}

// Process a single value, returning validation result
export function validateAndFormat(header: string, value: string): ValidationResult {
	if (!value?.trim()) {
		return { type: null, isValid: true, formattedValue: value };
	}

	const isValid = isValidDate(value);
	return {
		type: isValid ? 'date' : null,
		isValid,
		formattedValue: isValid ? formatDate(value) : value
	};
}
