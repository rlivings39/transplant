// dmsConverter.ts

// Types for DMS components
interface DMSParts {
    degrees: number;
    minutes: number;
    seconds: number;
    direction?: 'N' | 'S' | 'E' | 'W';
}

// Clean up DMS string input
export function cleanDMSString(value: string): string {
    return value
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[°˚⁰º]/g, '°')
        .replace(/['′']/g, "'")
        .replace(/["″"]/g, '"')
        .replace(/\s*([NSEW])\s*$/i, '$1');
}

// Parse DMS string into parts
export function parseDMSParts(value: string): DMSParts | null {
    const cleaned = cleanDMSString(value);
    
    // Pattern for full DMS format with direction
    const pattern = /^(-?\d+)\s*°?\s*(\d+)\s*'?\s*(\d+(?:\.\d+)?)\s*(?:''|"|″)?\s*([NSEWnsew])?$/;
    
    const match = cleaned.match(pattern);
    if (!match) return null;
    
    return {
        degrees: Math.abs(Number(match[1])),
        minutes: Number(match[2]),
        seconds: Number(match[3]),
        direction: match[4]?.toUpperCase() as 'N' | 'S' | 'E' | 'W'
    };
}

// Convert DMS parts to decimal degrees
export function dmsToDecimal(parts: DMSParts): number {
    let decimal = parts.degrees + parts.minutes / 60 + parts.seconds / 3600;
    
    // Apply negative for South or West
    if (parts.direction === 'S' || parts.direction === 'W') {
        decimal = -decimal;
    }
    
    return decimal;
}

// Main conversion function
export function convertDMSToDecimal(value: string): number | null {
    const parts = parseDMSParts(value);
    if (!parts) return null;
    return dmsToDecimal(parts);
}

// Detect if a string is in DMS format
export function isDMSFormat(value: string): boolean {
    const cleaned = cleanDMSString(value);
    return /^-?\d+\s*°?\s*\d+\s*'?\s*\d+(?:\.\d+)?\s*(?:''|"|″)?\s*[NSEWnsew]?$/i.test(cleaned);
}