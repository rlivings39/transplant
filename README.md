# Transplant

A open source data pipeline for collecting and interacting with large-scale reforestation data. The intention is to provide a public resource for science and practitioners to drive transparency and efficiency in large scale reforestation production. 
"Reforesation data" is the actual claims on tree planting and silviculture including who planted what trees and where (polygons). The app imports CSV's in various formats and maps them to the database.  

## Features

- **CSV Data Import**: Upload and process raw data stored as JSON in a submission log
- **Data Transformation**: Users select column types (GPS, number, date) and apply validation
- **Schema Mapping**: Drag-and-drop UI to map transformed data to relational tables
- **Deduplication Logic**: Prevents duplicate entries by using a user-defined key (e.g., `land_name`)
- **Database Integration**: Normalized storage using PostgreSQL and Drizzle ORM
- **Modern UI**: Built with Svelte 5 for an interactive experience
- **Data Recall**: Ability to reconstruct original spreadsheets from structured data

## Data Pipeline Overview

| **Stage**         | **Description**                                        |
| ----------------- | ------------------------------------------------------ |
| **1. Import**     | Users upload raw, flat data (spreadsheet format).      |
| **2. Transform**  | Users manually select column types and validate data.  |
| **3. Transplant** | Users map transformed data to a **normalized schema**. |
| **4. Store**      | Transformed data is assigned to relational tables.     |
| **5. Interact**   | Users analyze, filter, and generate reports.           |
| **6. Recall**     | Data is restructured into a flat format for export.    |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm 9+

### Installation

```bash
# Clone the repository
git clone [repository-url]
cd transplant

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Push database schema
npm run db:push

# Start development server
npm run dev
```

## Data Handling

### Storage Overview

| **Data Type**        | **Where It’s Stored?**        | **Purpose**                     |
| -------------------- | ----------------------------- | ------------------------------- |
| **Raw CSV Upload**   | JSON string in submission log | Allows users to reprocess later |
| **Transformed Data** | Linked to normalized tables   | Active working data             |
| **Normalized Data**  | Structured relational tables  | Efficient querying & analysis   |
| **User-Defined Key** | Used for deduplication        | Prevents duplicate entries      |

### Deduplication Logic

- A **user-defined key** (e.g., `land_name`) is used to detect existing records.
- Re-uploading a CSV updates matching records instead of inserting duplicates.

| **Action**                 | **Behavior**                                |
| -------------------------- | ------------------------------------------- |
| First upload               | Inserts new records                         |
| Re-upload with new sites   | Inserts new records, updates existing sites |
| Re-upload with corrections | Only updates modified records               |

## Development

### State Management

Transplant uses Svelte 5's runes for state management:

```typescript
// Primary States
const ParsedDataState = $state<ParsedDataState | null>(null);
const transformedData = $state<TransformedData | null>(null);

// Derived States
const isReady = $derived(transformedData !== null);
```

### Available Scripts

```bash
# Development
npm run dev         # Start development server
npm run lint        # Run ESLint
npm run lint:fix    # Fix ESLint issues

# Database
npm run db:push     # Push schema changes
npm run db:generate # Generate migrations
npm run db:studio   # Open Drizzle Studio

# Testing
npm run test        # Run all tests
npm test:unit      # Run unit tests
npm test:integration # Run integration tests
```

## Architecture

### Database Schema

#### Land Table

```sql
CREATE TABLE Land (
  land_id UUID PRIMARY KEY,
  land_name TEXT,
  gps_lat FLOAT,
  gps_lon FLOAT,
  hectares FLOAT
);
```

#### Crop Table

```sql
CREATE TABLE Crop (
  species_id UUID PRIMARY KEY,
  crop_name TEXT
);
```

#### Planted Table (Join Table)

```sql
CREATE TABLE Planted (
  planted_id UUID PRIMARY KEY,
  land_id UUID REFERENCES Land(land_id),
  crop_id UUID REFERENCES Crop(species_id),
  planted INTEGER,
  planting_date DATE
);
```

### Recall (Export & Transpose)

Users can reconstruct the original flat format at any time using SQL:

```sql
SELECT
  l.land_name AS parcelID,
  CONCAT(l.gps_lat, ' ', l.gps_lon) AS Location,
  l.hectares AS areaHa,
  p.planted AS numberTrees,
  p.planting_date AS plantingYear,
  (p.planted / l.hectares) AS trees_per_ha,
  c.crop_name AS Species
FROM Planted p
JOIN Land l ON p.land_id = l.land_id
JOIN Crop c ON p.crop_id = c.species_id;
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for our development process, coding standards, and best practices.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
