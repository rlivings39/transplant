# GPS Column Component Documentation

## Overview
The GpsColumn component processes and displays location data in the DataPreviewTable. It handles multiple GPS formats and provides address-based geocoding as a fallback.

## GPS Point Processing Workflow

### 1. Primary GPS Processing
- Processes active columns in order (respects toggleOff state)
- Takes first valid GPS point found
- Supports multiple formats:
  - Decimal Degrees (DD): "49.266446, -123.071453"
  - Degrees, Minutes, Seconds (DMS): "49°15'59.2"N 123°04'17.2"W"
  - Split lat/lon columns

### 2. Format Priority
1. Direct GPS Coordinates
   - Combined DD format
   - Split lat/lon columns
   - DMS format
2. Address Fallback (if no GPS found)
   - Specific addresses first (e.g., "225 West 8th Ave. Suite 300, Vancouver BC V5Y1N3")
   - General locations second (e.g., "Portland Oregon")

### 3. Address Geocoding System
- Local caching for batch requests
- External API integration (e.g., Google Geocoding)
- Batch processing for efficiency

## Component Integration
```svelte
<GpsColumn 
  row={rowData}
  columnHeaders={headers}
  toggledColumns={toggleState}
/>
```

## Display Format
- All coordinates displayed in DD format: "49.266446, -123.071453"
- Fixed width column (12.5rem)
- Overflow handling with ellipsis

## Future Enhancements
- [ ] Implement address geocoding fallback
- [ ] Add local caching system
- [ ] Add coordinate range validation
- [ ] Support additional GPS formats