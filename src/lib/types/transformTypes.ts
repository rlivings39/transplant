// Generic TypeScript Types file.
// Events for the CSV transformation flow
// <reference lib="dom" />

type CustomEvent<T> = globalThis.CustomEvent<T>;

export type CsvPreviewEventMap = {
	// Initial CSV data loaded for preview
	csvLoaded: { data: Record<string, string>[] };
	// Column type change in preview
	columnTypeChange: { columnHeader: string; type: string };
	// Column visibility toggle
	columnToggle: { columnHeader: string; isActive: boolean };
	// Type change event
	typeChange: { columnHeader: string; type: string };
};

// Type for handling CSV preview events
export type CsvPreviewEvent<K extends keyof CsvPreviewEventMap> = CustomEvent<
	CsvPreviewEventMap[K]
>;
export interface ValidatedTransformData {
	records: Array<{
		[key: string]: string | number | null;
	}>;
	columnTypes: {
		[key: string]: 'string' | 'number' | 'date' | 'gps';
	};
	toggledColumns: {
		[key: string]: boolean;
	};
}
