export interface ValidationResult {
	type: 'number' | null;
	isValid: boolean;
	formattedValue: string;
}

export function validate(value: string): boolean {
	if (!value?.trim()) return true;
	const numberRegex = /^-?\d*\.?\d+$/;
	return numberRegex.test(value.trim());
}

export function format(value: string): string {
	if (!value?.trim()) return value;

	// Remove existing commas
	const cleanValue = value.replace(/,/g, '');
	const num = Number(cleanValue);

	if (isNaN(num)) return value;

	// Split into whole and decimal parts
	const [whole, decimal] = num.toString().split('.');

	// Add commas to whole number part
	const formattedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

	// Return with decimal if it exists
	return decimal ? `${formattedWhole}.${decimal}` : formattedWhole;
}

export function detect(samples: string[]): boolean {
	return samples.every((value) => validate(value));
}

export function validateAndFormat(header: string, value: string): ValidationResult {
	if (!value?.trim()) {
		return { type: null, isValid: true, formattedValue: value };
	}

	const isValid = validate(value);
	if (!isValid) {
		return { type: 'number', isValid: false, formattedValue: value };
	}

	return {
		type: 'number',
		isValid: true,
		formattedValue: format(value)
	};
}
