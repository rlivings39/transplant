<script lang="ts">
    import type { Column } from '$lib/types/columnTypes';
    
    // Props
    export let columns: Column[] = [];
    export let isVisible: boolean = true;
    export let maxHeight: string = '400px';
    
    // Local state
    let selectedColumn: Column | null = null;
    let expandedSections: Record<string, boolean> = {
        'basic': true,
        'values': false,
        'validation': false,
        'cellValidation': false,
        'format': false,
        'dbMapping': false,
        'typeCoercion': false
    };
    
    // Toggle a section's expanded state
    function toggleSection(section: string) {
        expandedSections[section] = !expandedSections[section];
    }
    
    // Format a value for display
    function formatValue(value: any): string {
        if (value === null || value === undefined) {
            return 'null';
        }
        
        if (typeof value === 'object') {
            return JSON.stringify(value, null, 2);
        }
        
        return String(value);
    }
    
    // Get a truncated preview of array values
    function getArrayPreview(arr: any[]): string {
        if (!arr || arr.length === 0) return '[]';
        
        const preview = arr.slice(0, 3).map(item => {
            if (item === null || item === undefined) return 'null';
            if (typeof item === 'object') return JSON.stringify(item);
            return String(item);
        }).join(', ');
        
        return `[${preview}${arr.length > 3 ? ', ...' + (arr.length - 3) + ' more' : ''}]`;
    }
    
    // Get CSS class for a property based on its value
    function getPropertyClass(value: any): string {
        if (value === null || value === undefined) {
            return 'property-null';
        }
        
        if (typeof value === 'boolean') {
            return value ? 'property-true' : 'property-false';
        }
        
        if (typeof value === 'number') {
            return 'property-number';
        }
        
        if (typeof value === 'string') {
            return 'property-string';
        }
        
        if (Array.isArray(value)) {
            return 'property-array';
        }
        
        return 'property-object';
    }
</script>

{#if isVisible}
<div class="debug-panel">
    <div class="panel-header">
        <h3>Column Debug Panel</h3>
        <div class="column-selector">
            <select bind:value={selectedColumn}>
                <option value={null}>Select a column...</option>
                {#each columns as column}
                    <option value={column}>{column.name} ({column.type})</option>
                {/each}
            </select>
        </div>
    </div>
    
    <div class="panel-content" style="max-height: {maxHeight}">
        {#if !selectedColumn && columns.length > 0}
            <div class="columns-overview">
                <h4>Columns Overview ({columns.length})</h4>
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Toggled</th>
                            <th>Formatted</th>
                            <th>Values</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each columns as column}
                            <tr class="column-row" onclick={() => selectedColumn = column}>
                                <td>{column.name}</td>
                                <td class="column-type column-type-{column.type}">{column.type}</td>
                                <td class={column.isToggled ? 'true-value' : 'false-value'}>
                                    {column.isToggled ? 'Yes' : 'No'}
                                </td>
                                <td class={column.isFormatted ? 'true-value' : 'false-value'}>
                                    {column.isFormatted ? 'Yes' : 'No'}
                                </td>
                                <td>{getArrayPreview(column.values)}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {:else if selectedColumn}
            <div class="column-details">
                <button class="back-button" onclick={() => selectedColumn = null}>
                    ← Back to overview
                </button>
                
                <h4>Column: {selectedColumn.name}</h4>
                
                <!-- Basic Properties -->
                <div class="property-section">
                    <button type="button" class="section-header" onclick={() => toggleSection('basic')}>
                        <span class="toggle-icon">{expandedSections.basic ? '▼' : '►'}</span>
                        <h5>Basic Properties</h5>
                    </button>
                    
                    {#if expandedSections.basic}
                        <div class="property-list">
                            <div class="property-item">
                                <span class="property-name">name:</span>
                                <span class="property-value property-string">"{selectedColumn.name}"</span>
                            </div>
                            <div class="property-item">
                                <span class="property-name">type:</span>
                                <span class="property-value property-string">"{selectedColumn.type}"</span>
                            </div>
                            <div class="property-item">
                                <span class="property-name">isToggled:</span>
                                <span class="property-value {getPropertyClass(selectedColumn.isToggled)}">
                                    {String(selectedColumn.isToggled)}
                                </span>
                            </div>
                            <div class="property-item">
                                <span class="property-name">isFormatted:</span>
                                <span class="property-value {getPropertyClass(selectedColumn.isFormatted)}">
                                    {String(selectedColumn.isFormatted)}
                                </span>
                            </div>
                            <div class="property-item">
                                <span class="property-name">isMapped:</span>
                                <span class="property-value {getPropertyClass(selectedColumn.isMapped)}">
                                    {String(selectedColumn.isMapped || false)}
                                </span>
                            </div>
                            <div class="property-item">
                                <span class="property-name">mappedTo:</span>
                                <span class="property-value {getPropertyClass(selectedColumn.mappedTo)}">
                                    {selectedColumn.mappedTo || 'null'}
                                </span>
                            </div>
                        </div>
                    {/if}
                </div>
                
                <!-- Values -->
                <div class="property-section">
                    <button type="button" class="section-header" onclick={() => toggleSection('values')}>
                        <span class="toggle-icon">{expandedSections.values ? '▼' : '►'}</span>
                        <h5>Values ({selectedColumn.values.length})</h5>
                    </button>
                    
                    {#if expandedSections.values}
                        <div class="values-list">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Index</th>
                                        <th>Value</th>
                                        <th>Type</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {#each selectedColumn.values.slice(0, 10) as value, index}
                                        <tr>
                                            <td>{index}</td>
                                            <td class="value-cell">
                                                <pre>{formatValue(value)}</pre>
                                            </td>
                                            <td>{value === null ? 'null' : typeof value}</td>
                                        </tr>
                                    {/each}
                                    {#if selectedColumn.values.length > 10}
                                        <tr>
                                            <td colspan="3" class="more-values">
                                                ... {selectedColumn.values.length - 10} more values
                                            </td>
                                        </tr>
                                    {/if}
                                </tbody>
                            </table>
                        </div>
                    {/if}
                </div>
                
                <!-- Format -->
                {#if selectedColumn.type === 'number' || selectedColumn.type === 'date' || selectedColumn.type === 'gps'}
                    <div class="property-section">
                        <button type="button" class="section-header" onclick={() => toggleSection('format')}>
                            <span class="toggle-icon">{expandedSections.format ? '▼' : '►'}</span>
                            <h5>Format</h5>
                        </button>
                        
                        {#if expandedSections.format}
                            <div class="property-list">
                                {#if selectedColumn.type === 'number'}
                                    <div class="property-item">
                                        <span class="property-name">precision:</span>
                                        <span class="property-value property-number">
                                            {(selectedColumn as any).precision || 'auto'}
                                        </span>
                                    </div>
                                {/if}
                                {#if selectedColumn.type === 'date'}
                                    <div class="property-item">
                                        <span class="property-name">dateFormat:</span>
                                        <span class="property-value property-string">
                                            {(selectedColumn as any).dateFormat || 'auto'}
                                        </span>
                                    </div>
                                {/if}
                                {#if selectedColumn.type === 'gps'}
                                    <div class="property-item">
                                        <span class="property-name">gpsFormat:</span>
                                        <span class="property-value property-string">
                                            {(selectedColumn as any).gpsFormat || 'decimal'}
                                        </span>
                                    </div>
                                    <div class="property-item">
                                        <span class="property-name">precision:</span>
                                        <span class="property-value property-number">
                                            {(selectedColumn as any).precision || 7}
                                        </span>
                                    </div>
                                {/if}
                                <!-- Remove the extra property item that references undefined variables -->
                            </div>
                        {/if}
                    </div>
                {/if}
                
                <!-- Type Coercion -->
                {#if selectedColumn.typeCoercion}
                    <div class="property-section">
                        <button type="button" class="section-header" onclick={() => toggleSection('typeCoercion')}>
                            <span class="toggle-icon">{expandedSections.typeCoercion ? '▼' : '►'}</span>
                            <h5>Type Coercion</h5>
                        </button>
                        
                        {#if expandedSections.typeCoercion}
                            <div class="property-list">
                                <div class="property-item">
                                    <span class="property-name">isCoerced:</span>
                                    <span class="property-value {getPropertyClass(selectedColumn.typeCoercion.isCoerced)}">
                                        {String(selectedColumn.typeCoercion.isCoerced)}
                                    </span>
                                </div>
                                <div class="property-item">
                                    <span class="property-name">originalType:</span>
                                    <span class="property-value property-string">
                                        "{selectedColumn.typeCoercion.originalType}"
                                    </span>
                                </div>
                                <div class="property-item">
                                    <span class="property-name">coercedTo:</span>
                                    <span class="property-value property-string">
                                        "{selectedColumn.typeCoercion.coercedTo}"
                                    </span>
                                </div>
                                <div class="property-item">
                                    <span class="property-name">timestamp:</span>
                                    <span class="property-value property-number">
                                        {selectedColumn.typeCoercion.timestamp}
                                    </span>
                                </div>
                            </div>
                        {/if}
                    </div>
                {/if}
                
                <!-- Cell Validation -->
                {#if selectedColumn.cellValidation && selectedColumn.cellValidation.length > 0}
                    <div class="property-section">
                        <button type="button" class="section-header" onclick={() => toggleSection('cellValidation')}>
                            <span class="toggle-icon">{expandedSections.cellValidation ? '▼' : '►'}</span>
                            <h5>Cell Validation ({selectedColumn.cellValidation.length})</h5>
                        </button>
                        
                        {#if expandedSections.cellValidation}
                            <div class="values-list">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Row</th>
                                            <th>Valid</th>
                                            <th>Greyed Out</th>
                                            <th>Failed Detection</th>
                                            <th>Original Value</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {#each selectedColumn.cellValidation.slice(0, 10) as validation}
                                            <tr>
                                                <td>{validation.rowIndex}</td>
                                                <td class={validation.isValid ? 'true-value' : 'false-value'}>
                                                    {validation.isValid ? 'Yes' : 'No'}
                                                </td>
                                                <td class={validation.isGreyedOut ? 'true-value' : 'false-value'}>
                                                    {validation.isGreyedOut ? 'Yes' : 'No'}
                                                </td>
                                                <td class={validation.failedSelectDetection ? 'true-value' : 'false-value'}>
                                                    {validation.failedSelectDetection ? 'Yes' : 'No'}
                                                </td>
                                                <td class="value-cell">
                                                    <pre>{formatValue(validation.originalValue)}</pre>
                                                </td>
                                            </tr>
                                        {/each}
                                        {#if selectedColumn.cellValidation.length > 10}
                                            <tr>
                                                <td colspan="5" class="more-values">
                                                    ... {selectedColumn.cellValidation.length - 10} more validations
                                                </td>
                                            </tr>
                                        {/if}
                                    </tbody>
                                </table>
                            </div>
                        {/if}
                    </div>
                {/if}
                
                <!-- DB Mapping -->
                {#if selectedColumn.dbMapping}
                    <div class="property-section">
                        <button type="button" class="section-header" onclick={() => toggleSection('dbMapping')}>
                            <span class="toggle-icon">{expandedSections.dbMapping ? '▼' : '►'}</span>
                            <h5>DB Mapping</h5>
                        </button>
                        
                        {#if expandedSections.dbMapping}
                            <div class="property-list">
                                <div class="property-item">
                                    <span class="property-name">table:</span>
                                    <span class="property-value property-string">
                                        "{selectedColumn.dbMapping.table}"
                                    </span>
                                </div>
                                <div class="property-item">
                                    <span class="property-name">column:</span>
                                    <span class="property-value property-string">
                                        "{selectedColumn.dbMapping.column}"
                                    </span>
                                </div>
                                <div class="property-item">
                                    <span class="property-name">isRequired:</span>
                                    <span class="property-value {getPropertyClass(selectedColumn.dbMapping.isRequired)}">
                                        {String(selectedColumn.dbMapping.isRequired)}
                                    </span>
                                </div>
                                {#if selectedColumn.dbMapping.isNaturalKey !== undefined}
                                    <div class="property-item">
                                        <span class="property-name">isNaturalKey:</span>
                                        <span class="property-value {getPropertyClass(selectedColumn.dbMapping.isNaturalKey)}">
                                            {String(selectedColumn.dbMapping.isNaturalKey)}
                                        </span>
                                    </div>
                                {/if}
                                {#if selectedColumn.dbMapping.naturalKeyFor}
                                    <div class="property-item">
                                        <span class="property-name">naturalKeyFor:</span>
                                        <span class="property-value property-string">
                                            "{selectedColumn.dbMapping.naturalKeyFor}"
                                        </span>
                                    </div>
                                {/if}
                            </div>
                        {/if}
                    </div>
                {/if}
                
                <!-- JSON View -->
                <div class="property-section">
                    <button type="button" class="section-header" onclick={() => toggleSection('json')}>
                        <span class="toggle-icon">{expandedSections.json ? '▼' : '►'}</span>
                        <h5>JSON View</h5>
                    </button>
                    
                    {#if expandedSections.json}
                        <div class="json-view">
                            <pre>{JSON.stringify(selectedColumn, (key, value) => {
                                // Truncate arrays to prevent huge output
                                if (Array.isArray(value) && value.length > 5) {
                                    return [...value.slice(0, 5), `... ${value.length - 5} more items`];
                                }
                                return value;
                            }, 2)}</pre>
                        </div>
                    {/if}
                </div>
            </div>
        {:else}
            <div class="no-columns">
                <p>No columns available. Import data to see column information.</p>
            </div>
        {/if}
    </div>
</div>
{/if}

<style>
    .debug-panel {
        font-family: monospace;
        background-color: #1e1e1e;
        color: #d4d4d4;
        border: 1px solid #333;
        border-radius: 4px;
        margin-top: 1rem;
        overflow: hidden;
    }
    
    .panel-header {
        background-color: #252526;
        padding: 0.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #333;
    }
    
    .panel-header h3 {
        margin: 0;
        font-size: 1rem;
        color: #e6e6e6;
    }
    
    .panel-content {
        padding: 0.5rem;
        overflow-y: auto;
    }
    
    .column-selector select {
        background-color: #3c3c3c;
        color: #d4d4d4;
        border: 1px solid #555;
        padding: 0.25rem 0.5rem;
        border-radius: 3px;
    }
    
    .columns-overview table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 0.5rem;
    }
    
    .columns-overview th,
    .columns-overview td {
        padding: 0.5rem;
        text-align: left;
        border-bottom: 1px solid #333;
    }
    
    .columns-overview th {
        background-color: #252526;
        color: #e6e6e6;
    }
    
    .column-row {
        cursor: pointer;
    }
    
    .column-row:hover {
        background-color: #2d2d2d;
    }
    
    .column-type {
        font-weight: bold;
    }
    
    .column-type-string {
        color: #ce9178;
    }
    
    .column-type-number {
        color: #b5cea8;
    }
    
    .column-type-date {
        color: #569cd6;
    }
    
    .column-type-gps {
        color: #4ec9b0;
    }
    
    .true-value {
        color: #6a9955;
    }
    
    .false-value {
        color: #f44747;
    }
    
    .back-button {
        background-color: #3c3c3c;
        color: #d4d4d4;
        border: none;
        padding: 0.25rem 0.5rem;
        border-radius: 3px;
        cursor: pointer;
        margin-bottom: 0.5rem;
    }
    
    .back-button:hover {
        background-color: #4c4c4c;
    }
    
    .property-section {
        margin-bottom: 0.5rem;
        border: 1px solid #333;
        border-radius: 3px;
        overflow: hidden;
    }
    
    .section-header {
        background-color: #252526;
        padding: 0.5rem;
        cursor: pointer;
        display: flex;
        align-items: center;
    }
    
    .section-header:hover {
        background-color: #2d2d2d;
    }
    
    .section-header h5 {
        margin: 0;
        font-size: 0.9rem;
        color: #e6e6e6;
    }
    
    .toggle-icon {
        margin-right: 0.5rem;
        font-size: 0.8rem;
        color: #569cd6;
    }
    
    .property-list {
        padding: 0.5rem;
        background-color: #1e1e1e;
    }
    
    .property-item {
        margin-bottom: 0.25rem;
        display: flex;
    }
    
    .property-name {
        color: #9cdcfe;
        margin-right: 0.5rem;
        min-width: 120px;
    }
    
    .property-value {
        font-family: monospace;
    }
    
    .property-string {
        color: #ce9178;
    }
    
    .property-number {
        color: #b5cea8;
    }
    
    .property-boolean {
        color: #569cd6;
    }
    
    .property-true {
        color: #6a9955;
    }
    
    .property-false {
        color: #f44747;
    }
    
    .property-null {
        color: #569cd6;
        font-style: italic;
    }
    
    .property-array {
        color: #d7ba7d;
    }
    
    .property-object {
        color: #4ec9b0;
    }
    
    .values-list {
        padding: 0.5rem;
        background-color: #1e1e1e;
        overflow-x: auto;
    }
    
    .values-list table {
        width: 100%;
        border-collapse: collapse;
    }
    
    .values-list th,
    .values-list td {
        padding: 0.25rem 0.5rem;
        text-align: left;
        border-bottom: 1px solid #333;
    }
    
    .values-list th {
        background-color: #252526;
        color: #e6e6e6;
    }
    
    .value-cell {
        max-width: 300px;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .value-cell pre {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-all;
    }
    
    .more-values {
        text-align: center;
        color: #569cd6;
        font-style: italic;
    }
    
    .json-view {
        padding: 0.5rem;
        background-color: #1e1e1e;
        overflow-x: auto;
    }
    
    .json-view pre {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
    }
    
    .no-columns {
        padding: 1rem;
        text-align: center;
        color: #999;
    }
</style>
