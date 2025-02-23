import { parseGpsCoordinate } from '$lib/utils/dataTypes/gpsType';
export interface TransformState {
    data: Record<string, string>[];
    headers: string[];
    types: Record<string, string>;
    invalidCells: Record<string, Set<number>>;
    toggledColumns: Record<string, boolean>;
}

export function canTransform(state: TransformState): boolean {
    const { data, types, invalidCells, toggledColumns } = state;
    
    // Check if we have data
    if (data.length === 0) return false;

    // Check if all columns have valid types
    const hasValidTypes = Object.entries(types).every(([header, type]) => {
        return type !== 'delete' && !toggledColumns[header];
    });

    // Check if all visible data is valid
    const hasValidData = Object.entries(invalidCells).every(([header, invalid]) => {
        return toggledColumns[header] || invalid.size === 0;
    });

    return hasValidTypes && hasValidData;
}

export function transformData(state: TransformState) {
    const { data, headers, types, invalidCells, toggledColumns } = state;

    // Filter out deleted and toggled-off columns
    const validHeaders = headers.filter(
        header => types[header] !== 'delete' && !toggledColumns[header]
    );

    // Create transformed dataset
    const transformedDataset = data
        .map((row, index) => {
            const newRow: Record<string, any> = {};

            for (const header of validHeaders) {
                // Skip if cell is invalid
                if (invalidCells[header]?.has(index)) continue;

                const value = row[header]?.trim();
                if (!value) continue;

                // Transform value based on type
                switch (types[header]) {
                    case 'number':
                        newRow[header] = Number(value.replace(/,/g, ''));
                        break;
                    case 'date':
                        newRow[header] = new Date(value).toISOString();
                        break;
                    case 'gps':
                        const coord = parseGpsCoordinate(value);
                        if (coord) newRow[header] = formatGpsCoordinate(coord);
                        break;
                    case 'latitude':
                        newRow[header] = parseFloat(value);
                        break;
                    case 'longitude':
                        newRow[header] = parseFloat(value);
                        break;
                    default:
                        newRow[header] = value;
                }
            }
            return newRow;
        })
        .filter(row => Object.keys(row).length > 0);

    return {
        data: transformedDataset,
        headers: validHeaders,
        types
    };
}