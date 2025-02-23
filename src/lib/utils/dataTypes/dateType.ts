export function validate(value: string): boolean {
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

export function format(value: string): string {
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

export function detect(samples: string[]): boolean {
    return samples.every(value => validate(value));
}