import type { ColumnDef } from '$lib/types/columnModel';
export type DateType = 'date';


export interface DateColumn extends ColumnDef {
	type: 'date';
	values: (string | null)[];
	format?: {
	  timezone?: string;
	};
  }

export interface ValidationResult {
	type: DateType | null;
	isValid: boolean;
	formattedValue: string;
}

// Common date formats - ordered from most to least specific
const DATE_FORMATS = [
	/^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD (ISO)
	/^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
	/^\d{4}\.\d{2}\.\d{2}$/, // YYYY.MM.DD
	/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$/i, // Month YYYY
	/^\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$/i, // DD Month YYYY
	/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}$/i, // Month DD, YYYY
	/^\d{1,2}-(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{4}$/i, // DD-MMM-YYYY
	/^\d{4}-(?:Q[1-4])$/, // YYYY-Q[1-4] (Quarter)
	/^\d{4}-W(?:0[1-9]|[1-4][0-9]|5[0-3])$/ // YYYY-W[01-53] (ISO week)
];

function isValidDate(dateStr: string): boolean {
	// Check if it's a year number between 1850-2035
	// First reject if it contains a decimal point
	if (dateStr.includes('.')) {
		return false;
	}

	// Check for valid integer year
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
