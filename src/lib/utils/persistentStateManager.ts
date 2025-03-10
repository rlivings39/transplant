/**
 * PersistentStateManager
 *
 * A utility for managing persistent state that serves as the source of truth
 * for the TransPlant application. This state is stored in localStorage and
 * also maintained as a global variable for real-time access.
 */

// Define the structure of our mapping state
export interface MappingItem {
	imported_column: string;
	database_column: string;
	type?: string;
	table?: string;
}

export interface PersistentState {
	mappings: MappingItem[];
	rules: {
		unique_mapping: boolean;
		required_columns: string[];
		[key: string]: any;
	};
	metadata?: {
		last_updated: string;
		version: string;
		[key: string]: any;
	};
}

// Default state
const DEFAULT_STATE: PersistentState = {
	mappings: [],
	rules: {
		unique_mapping: true,
		required_columns: ['id', 'crop_name', 'planted', 'planting_date']
	},
	metadata: {
		last_updated: new Date().toISOString(),
		version: '1.0.0'
	}
};

// Storage key for localStorage
const STORAGE_KEY = 'transplant_persistent_state';

// Global state variable that components will reference
let globalState: PersistentState = DEFAULT_STATE;

/**
 * Initialize the persistent state
 * Loads from localStorage if available, otherwise uses default state
 */
export function initPersistentState(): PersistentState {
	try {
		const storedState = localStorage.getItem(STORAGE_KEY);
		if (storedState) {
			globalState = JSON.parse(storedState);
			console.log('Loaded persistent state from localStorage');
		} else {
			globalState = { ...DEFAULT_STATE };
			localStorage.setItem(STORAGE_KEY, JSON.stringify(globalState));
			console.log('Initialized default persistent state');
		}
	} catch (error) {
		console.error('Error initializing persistent state:', error);
		globalState = { ...DEFAULT_STATE };
	}

	return globalState;
}

/**
 * Get the current persistent state
 */
export function getPersistentState(): PersistentState {
	return globalState;
}

/**
 * Update the persistent state
 * @param updater Function that takes the current state and returns the updated state
 */
export function updatePersistentState(
	updater: (currentState: PersistentState) => PersistentState
): PersistentState {
	try {
		// Update the global state
		globalState = updater(globalState);

		// Update metadata
		globalState.metadata = {
			...globalState.metadata,
			last_updated: new Date().toISOString()
		};

		// Persist to localStorage
		localStorage.setItem(STORAGE_KEY, JSON.stringify(globalState));

		// Dispatch a custom event to notify components of the state change
		window.dispatchEvent(
			new CustomEvent('persistent-state-changed', {
				detail: { state: globalState }
			})
		);

		return globalState;
	} catch (error) {
		console.error('Error updating persistent state:', error);
		return globalState;
	}
}

/**
 * Add a new mapping
 * @param csvColumn The imported CSV column name
 * @param dbColumn The database column name
 * @param type Optional column type
 * @param table Optional table name
 */
export function addMapping(
	csvColumn: string,
	dbColumn: string,
	type?: string,
	table?: string
): PersistentState {
	return updatePersistentState((state) => {
		// Check if unique_mapping rule is enabled
		if (state.rules.unique_mapping) {
			// Remove any existing mappings for this CSV column
			state.mappings = state.mappings.filter((m) => m.imported_column !== csvColumn);

			// Remove any existing mappings for this database column if it needs to be unique
			state.mappings = state.mappings.filter((m) => m.database_column !== dbColumn);
		}

		// Add the new mapping
		state.mappings.push({
			imported_column: csvColumn,
			database_column: dbColumn,
			type,
			table
		});

		return state;
	});
}

/**
 * Remove a mapping
 * @param csvColumn The imported CSV column name
 */
export function removeMapping(csvColumn: string): PersistentState {
	return updatePersistentState((state) => {
		state.mappings = state.mappings.filter((m) => m.imported_column !== csvColumn);
		return state;
	});
}

/**
 * Update a rule in the persistent state
 * @param ruleName The name of the rule to update
 * @param value The new value for the rule
 */
export function updateRule(ruleName: string, value: any): PersistentState {
	return updatePersistentState((state) => {
		state.rules[ruleName] = value;
		return state;
	});
}

/**
 * Clear all mappings
 */
export function clearMappings(): PersistentState {
	return updatePersistentState((state) => {
		state.mappings = [];
		return state;
	});
}

/**
 * Reset the persistent state to default
 */
export function resetPersistentState(): PersistentState {
	globalState = { ...DEFAULT_STATE };
	localStorage.setItem(STORAGE_KEY, JSON.stringify(globalState));

	// Dispatch a custom event to notify components of the state change
	window.dispatchEvent(
		new CustomEvent('persistent-state-changed', {
			detail: { state: globalState }
		})
	);

	return globalState;
}

// Initialize the state when this module is imported
initPersistentState();
