<script lang="ts">
    import type { Column } from '$lib/types/columnTypes';
    
    // Props
    export let columns: Column[] = [];
    export let isVisible: boolean = true;
    export let maxHeight: string = '400px';
    export let componentName: string = ''; // Optional: to identify which component is using this debug panel
    
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
    
    // Extract the actual column name from the prefixed name
    function getCleanColumnName(fullName: string): string {
        // Common prefixes to remove
        const prefixes = ['TextNumberDateGPSLatitudeLongitude', 'TextNumberDateGPS'];

        // Try to remove each prefix
        for (const prefix of prefixes) {
            if (fullName.startsWith(prefix)) {
                // Return the part after the prefix, with the first character lowercase
                const nameWithoutPrefix = fullName.substring(prefix.length);
                // If the name is now empty, return the original name
                if (!nameWithoutPrefix) return fullName;
                // Otherwise, ensure the first character is lowercase for consistency
                return nameWithoutPrefix.charAt(0).toLowerCase() + nameWithoutPrefix.slice(1);
            }
        }

        // If no prefix found, return the original name
        return fullName;
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
    
    // Get CSS class based on property value type
    function getPropertyClass(value: any): string {
        if (value === null || value === undefined) return 'property-null';
        if (typeof value === 'boolean') return value ? 'property-true' : 'property-false';
        if (typeof value === 'number') return 'property-number';
        if (typeof value === 'string') return 'property-string';
        if (Array.isArray(value)) return 'property-array';
        return 'property-object';
    }
    
    // Get the type of a value for styling
    function getValueType(value: any): string {
        if (value === null || value === undefined) return 'null';
        if (typeof value === 'boolean') return value ? 'true' : 'false';
        return typeof value;
    }
</script>

{#if isVisible}
<div class="column-debug-panel">
    <div class="panel-header">
        <h3>Column Debug Panel {componentName ? `(${componentName})` : ''}</h3>
        <div class="column-selector">
            <select bind:value={selectedColumn}>
                <option value={null}>-- Select a column --</option>
                {#each columns as column}
                    <option value={column}>{getCleanColumnName(column.name)} ({column.type})</option>
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
                            <th>Mapped</th>
                            <th>Values</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each columns as column}
                            <tr class="column-row" onclick={() => selectedColumn = column}>
                                <td>{getCleanColumnName(column.name)}</td>
                                <td class="column-type column-type-{column.type}">{column.type}</td>
                                <td class={column.isToggled ? 'true-value' : 'false-value'}>
                                    {column.isToggled ? '✓' : '✗'}
                                </td>
                                <td class={column.isFormatted ? 'true-value' : 'false-value'}>
                                    {column.isFormatted ? '✓' : '✗'}
                                </td>
                                <td class={column.isMapped ? 'true-value' : 'false-value'}>
                                    {column.isMapped ? '✓' : '✗'}
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
                            {#if selectedColumn.originalName}
                            <div class="property-item">
                                <span class="property-name">originalName:</span>
                                <span class="property-value property-string">"{selectedColumn.originalName}"</span>
                            </div>
                            {/if}
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
                            {#if selectedColumn.mappedTo !== undefined}
                            <div class="property-item">
                                <span class="property-name">mappedTo:</span>
                                <span class="property-value {getPropertyClass(selectedColumn.mappedTo)}">
                                    {selectedColumn.mappedTo || 'null'}
                                </span>
                            </div>
                            {/if}
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
                
                <!-- Validation -->
                {#if selectedColumn.validation}
                    <div class="property-section">
                        <button type="button" class="section-header" onclick={() => toggleSection('validation')}>
                            <span class="toggle-icon">{expandedSections.validation ? '▼' : '►'}</span>
                            <h5>Validation</h5>
                        </button>
                        
                        {#if expandedSections.validation}
                            <div class="property-list">
                                <div class="property-item">
                                    <span class="property-name">isValid:</span>
                                    <span class="property-value {getPropertyClass(selectedColumn.validation.isValid)}">
                                        {String(selectedColumn.validation.isValid)}
                                    </span>
                                </div>
                                {#if selectedColumn.validation.message}
                                    <div class="property-item">
                                        <span class="property-name">message:</span>
                                        <span class="property-value property-string">
                                            "{selectedColumn.validation.message}"
                                        </span>
                                    </div>
                                {/if}
                                {#if selectedColumn.validation.errors && selectedColumn.validation.errors.length > 0}
                                    <div class="property-item">
                                        <span class="property-name">errors:</span>
                                        <div class="errors-list">
                                            {#each selectedColumn.validation.errors as error}
                                                <div class="error-item">
                                                    <pre>{formatValue(error)}</pre>
                                                </div>
                                            {/each}
                                        </div>
                                    </div>
                                {/if}
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
                            <div class="property-list">
                                <div class="cell-validation-list">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Index</th>
                                                <th>Value</th>
                                                <th>Valid</th>
                                                <th>Message</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {#each selectedColumn.cellValidation.slice(0, 10) as validation, index}
                                                <tr>
                                                    <td>{validation.index}</td>
                                                    <td class="value-cell">
                                                        <pre>{formatValue(validation.value)}</pre>
                                                    </td>
                                                    <td class={validation.isValid ? 'true-value' : 'false-value'}>
                                                        {validation.isValid ? '✓' : '✗'}
                                                    </td>
                                                    <td>{validation.message || ''}</td>
                                                </tr>
                                            {/each}
                                            {#if selectedColumn.cellValidation.length > 10}
                                                <tr>
                                                    <td colspan="4" class="more-values">
                                                        ... {selectedColumn.cellValidation.length - 10} more validations
                                                    </td>
                                                </tr>
                                            {/if}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        {/if}
                    </div>
                {/if}
                
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
                                {#if selectedColumn.dbMapping.table}
                                    <div class="property-item">
                                        <span class="property-name">table:</span>
                                        <span class="property-value property-string">
                                            "{selectedColumn.dbMapping.table}"
                                        </span>
                                    </div>
                                {/if}
                                {#if selectedColumn.dbMapping.field}
                                    <div class="property-item">
                                        <span class="property-name">field:</span>
                                        <span class="property-value property-string">
                                            "{selectedColumn.dbMapping.field}"
                                        </span>
                                    </div>
                                {/if}
                                {#if selectedColumn.dbMapping.required !== undefined}
                                    <div class="property-item">
                                        <span class="property-name">required:</span>
                                        <span class="property-value {getPropertyClass(selectedColumn.dbMapping.required)}">
                                            {String(selectedColumn.dbMapping.required)}
                                        </span>
                                    </div>
                                {/if}
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
                                    <span class="property-name">from:</span>
                                    <span class="property-value property-string">
                                        "{selectedColumn.typeCoercion.from}"
                                    </span>
                                </div>
                                <div class="property-item">
                                    <span class="property-name">to:</span>
                                    <span class="property-value property-string">
                                        "{selectedColumn.typeCoercion.to}"
                                    </span>
                                </div>
                                {#if selectedColumn.typeCoercion.success !== undefined}
                                    <div class="property-item">
                                        <span class="property-name">success:</span>
                                        <span class="property-value {getPropertyClass(selectedColumn.typeCoercion.success)}">
                                            {String(selectedColumn.typeCoercion.success)}
                                        </span>
                                    </div>
                                {/if}
                                {#if selectedColumn.typeCoercion.message}
                                    <div class="property-item">
                                        <span class="property-name">message:</span>
                                        <span class="property-value property-string">
                                            "{selectedColumn.typeCoercion.message}"
                                        </span>
                                    </div>
                                {/if}
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>
        {:else}
            <div class="no-selection">
                <p>No columns available. Import data to see column information.</p>
            </div>
        {/if}
    </div>
</div>
{/if}

<style>
    .column-debug-panel {
        border: 1px solid #ccc;
        border-radius: 4px;
        background-color: #f8f9fa;
        margin: 1rem 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
        font-size: 14px;
        color: #333;
        width: 100%;
        overflow: hidden;
    }
    
    .panel-header {
        background-color: #e9ecef;
        padding: 0.5rem;
        border-bottom: 1px solid #ccc;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .panel-header h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
    }
    
    .column-selector {
        min-width: 200px;
    }
    
    .column-selector select {
        width: 100%;
        padding: 0.25rem;
        border: 1px solid #ced4da;
        border-radius: 0.25rem;
    }
    
    .panel-content {
        padding: 0.5rem;
        overflow-y: auto;
    }
    
    .columns-overview {
        margin-bottom: 1rem;
    }
    
    .columns-overview h4 {
        margin-top: 0;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
    }
    
    .columns-overview table {
        width: 100%;
        border-collapse: collapse;
    }
    
    .columns-overview th,
    .columns-overview td {
        padding: 0.25rem 0.5rem;
        border: 1px solid #dee2e6;
        text-align: left;
        font-size: 0.8rem;
    }
    
    .columns-overview th {
        background-color: #e9ecef;
        font-weight: 600;
    }
    
    .column-row {
        cursor: pointer;
    }
    
    .column-row:hover {
        background-color: #f1f3f5;
    }
    
    .column-type {
        font-weight: 600;
    }
    
    .column-type-string { color: #28a745; }
    .column-type-number { color: #007bff; }
    .column-type-date { color: #6f42c1; }
    .column-type-gps { color: #fd7e14; }
    
    .true-value { color: #28a745; }
    .false-value { color: #dc3545; }
    
    .back-button {
        margin-bottom: 0.5rem;
        padding: 0.25rem 0.5rem;
        background-color: #e9ecef;
        border: 1px solid #ced4da;
        border-radius: 0.25rem;
        cursor: pointer;
        font-size: 0.8rem;
    }
    
    .back-button:hover {
        background-color: #dee2e6;
    }
    
    .property-section {
        margin-bottom: 0.5rem;
        border: 1px solid #dee2e6;
        border-radius: 0.25rem;
        overflow: hidden;
    }
    
    .section-header {
        width: 100%;
        display: flex;
        align-items: center;
        padding: 0.25rem 0.5rem;
        background-color: #e9ecef;
        border: none;
        text-align: left;
        cursor: pointer;
    }
    
    .section-header:hover {
        background-color: #dee2e6;
    }
    
    .toggle-icon {
        margin-right: 0.5rem;
        font-size: 0.8rem;
    }
    
    .section-header h5 {
        margin: 0;
        font-size: 0.85rem;
        font-weight: 600;
    }
    
    .property-list {
        padding: 0.5rem;
    }
    
    .property-item {
        margin-bottom: 0.25rem;
        display: flex;
        align-items: flex-start;
    }
    
    .property-name {
        min-width: 100px;
        font-weight: 600;
        color: #495057;
    }
    
    .property-value {
        flex: 1;
        word-break: break-word;
    }
    
    .property-string { color: #28a745; }
    .property-number { color: #007bff; }
    .property-true { color: #28a745; }
    .property-false { color: #dc3545; }
    .property-null { color: #6c757d; font-style: italic; }
    .property-array { color: #fd7e14; }
    .property-object { color: #6f42c1; }
    
    .values-list,
    .cell-validation-list {
        max-height: 300px;
        overflow-y: auto;
        margin-top: 0.5rem;
    }
    
    .values-list table,
    .cell-validation-list table {
        width: 100%;
        border-collapse: collapse;
    }
    
    .values-list th,
    .values-list td,
    .cell-validation-list th,
    .cell-validation-list td {
        padding: 0.25rem 0.5rem;
        border: 1px solid #dee2e6;
        text-align: left;
        font-size: 0.8rem;
    }
    
    .values-list th,
    .cell-validation-list th {
        background-color: #e9ecef;
        font-weight: 600;
    }
    
    .value-cell pre {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
        font-size: 0.8rem;
    }
    
    .more-values {
        text-align: center;
        font-style: italic;
        color: #6c757d;
    }
    
    .no-selection {
        padding: 1rem;
        text-align: center;
        color: #6c757d;
    }
    
    .errors-list,
    .values-list {
        margin-top: 0.25rem;
    }
    
    .error-item,
    .value-item {
        margin-bottom: 0.25rem;
        padding: 0.25rem;
        background-color: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 0.25rem;
    }
    
    .error-item pre,
    .value-item pre {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
        font-size: 0.8rem;
    }
    
    .value-index {
        display: inline-block;
        min-width: 30px;
        font-weight: 600;
        color: #495057;
    }
    
    .string-value { color: #28a745; }
    .number-value { color: #007bff; }
    .null-value { color: #6c757d; font-style: italic; }
    .other-value { color: #6f42c1; }
    
    .hidden {
        display: none;
    }
</style>
