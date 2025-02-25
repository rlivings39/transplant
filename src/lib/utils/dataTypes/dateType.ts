export type DateType = 'date';

export interface ValidationResult {
	type: DateType | null;
	isValid: boolean;
	formattedValue: string;
}

// Detect if a column of samples is a date type
export function detectType(header: string, samples: string[]): DateType | null {
	if (!samples.length) return null;

	// If all non-empty samples are valid dates, it's a date column
	const validSamples = samples.filter((s) => s?.trim());
	if (validSamples.every(validate)) {
		return 'date';
	}

	return null;
}

// Validate a single value
function validate(value: string): boolean {
	if (!value?.trim()) return true;

	// If it's a year in range
	const num = Number(value);
	if (!isNaN(num) && num >= 1850 && num <= 2035) {
		return true;
	}

	// Try parsing as date
	const date = new Date(value);
	return !isNaN(date.getTime());
}

// Format a value that's already been validated
function format(value: string): string {
	if (!value?.trim()) return value;

	// If it's a year in range, format as year date
	const num = Number(value);
	if (!isNaN(num) && num >= 1850 && num <= 2035) {
		return `${value}-01-01T00:00:00.000Z`;
	}

	// Format as ISO date
	const date = new Date(value);
	return !isNaN(date.getTime()) ? date.toISOString() : value;
}

// Process a single value, returning validation result
export function validateAndFormat(header: string, value: string): ValidationResult {
	if (!value?.trim()) {
		return { type: null, isValid: true, formattedValue: value };
	}

	const isValid = validate(value);
	return {
		type: isValid ? 'date' : null,
		isValid,
		formattedValue: isValid ? format(value) : value
	};
}
