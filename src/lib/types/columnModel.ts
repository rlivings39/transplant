/**
 * Column model implementation for TransPlant
 * 
 * This file provides concrete implementations of the Column interfaces
 * defined in columnTypes.ts, with methods for working with column data.
 */

import type { 
  BaseColumn, 
  StringColumn, 
  NumberColumn, 
  DateColumn, 
  GpsColumn, 
  GpsCoordinate 
} from './columnTypes';

/**
 * Base column model with shared implementation
 */
export class BaseColumnModel implements BaseColumn {
  name: string;
  isToggled: boolean;
  isMapped?: boolean;
  mappedTo?: string;
  isFormatted: boolean;
  dbMapping?: {
    table: string;
    column: string;
    isRequired: boolean;
  };

  constructor(name: string) {
    this.name = name;
    this.isToggled = true;
    this.isMapped = false;
    this.isFormatted = false;
  }
}

/**
 * String column implementation
 */
export class StringColumnModel extends BaseColumnModel implements StringColumn {
  type: 'string' = 'string';
  values: (string | null)[] = [];
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };

  constructor(name: string) {
    super(name);
  }

  addValue(value: any): string | null {
    const formattedValue = this.formatValue(value);
    this.values.push(formattedValue);
    this.isFormatted = true;
    return formattedValue;
  }

  formatValue(value: any): string | null {
    if (value === null || value === undefined) return null;
    return String(value);
  }
}

/**
 * Number column implementation
 */
export class NumberColumnModel extends BaseColumnModel implements NumberColumn {
  type: 'number' = 'number';
  values: (number | null)[] = [];
  format?: {
    precision?: number;
    useThousandsSeparator?: boolean;
  };
  validation?: {
    min?: number;
    max?: number;
  };

  constructor(name: string, precision?: number) {
    super(name);
    this.format = { precision: precision || 2 };
  }

  addValue(value: any): number | null {
    const formattedValue = this.formatValue(value);
    this.values.push(formattedValue);
    this.isFormatted = true;
    return formattedValue;
  }

  formatValue(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    
    // Convert to number
    const num = Number(value);
    if (isNaN(num)) return null;
    
    // Apply precision if specified
    if (this.format?.precision !== undefined) {
      // Use toFixed for string conversion, then convert back to number
      // This ensures proper rounding to the specified precision
      return Number(num.toFixed(this.format.precision));
    }
    
    return num;
  }
}

/**
 * Date column implementation
 */
export class DateColumnModel extends BaseColumnModel implements DateColumn {
  type: 'date' = 'date';
  values: (string | null)[] = [];
  format?: {
    dateFormat?: string;
  };

  constructor(name: string, dateFormat?: string) {
    super(name);
    this.format = { dateFormat: dateFormat || 'YYYY-MM-DD' };
  }

  addValue(value: any): string | null {
    const formattedValue = this.formatValue(value);
    this.values.push(formattedValue);
    this.isFormatted = true;
    return formattedValue;
  }

  formatValue(value: any): string | null {
    if (value === null || value === undefined || value === '') return null;
    
    // For now, just store as ISO string
    // In a real implementation, would use a date library to parse and format
    try {
      const date = new Date(value);
      return date.toISOString();
    } catch (e) {
      return String(value);
    }
  }
}

/**
 * GPS column implementation
 */
export class GpsColumnModel extends BaseColumnModel implements GpsColumn {
  type: 'gps' = 'gps';
  values: (GpsCoordinate | null)[] = [];
  format?: {
    gpsFormat?: 'DMS' | 'DD';
    precision?: number;
  };

  constructor(name: string, gpsFormat: 'DMS' | 'DD' = 'DD', precision: number = 7) {
    super(name);
    this.format = { 
      gpsFormat: gpsFormat,
      precision: precision
    };
  }

  addValue(value: any): GpsCoordinate | null {
    const formattedValue = this.formatValue(value);
    this.values.push(formattedValue);
    this.isFormatted = true;
    return formattedValue;
  }

  formatValue(value: any): GpsCoordinate | null {
    if (value === null || value === undefined || value === '') return null;
    
    // Handle different input formats
    if (typeof value === 'object' && value.latitude !== undefined && value.longitude !== undefined) {
      // Already a GpsCoordinate object
      return this.formatGpsCoordinate(value);
    } else if (typeof value === 'string' && value.includes(',')) {
      // String in "lat,lon" format
      const [latStr, lonStr] = value.split(',');
      return this.formatGpsCoordinate({
        latitude: Number(latStr.trim()),
        longitude: Number(lonStr.trim())
      });
    } else {
      // Unsupported format
      console.warn(`Unsupported GPS format for value: ${value}`);
      return null;
    }
  }

  private formatGpsCoordinate(coord: GpsCoordinate): GpsCoordinate {
    const precision = this.format?.precision || 7;
    
    return {
      latitude: Number(Number(coord.latitude).toFixed(precision)),
      longitude: Number(Number(coord.longitude).toFixed(precision)),
      format: this.format?.gpsFormat || 'DD',
      precision: precision
    };
  }
}
