// Generic TypeScript Types file.

// Events for the CSV transformation flow
export type CsvPreviewEventMap = {
	// Initial CSV data loaded for preview
	csvLoaded: { data: Record<string, string>[] };
	// Column type change in preview
	columnTypeChange: { columnHeader: string; type: string };
};

// Type for handling CSV preview events
export type CsvPreviewEvent<K extends keyof CsvPreviewEventMap> = CustomEvent<
	CsvPreviewEventMap[K]
>;
