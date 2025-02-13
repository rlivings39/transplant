# Table Implementation Instructions

## Overview

This document provides guidance on implementing a dynamic table for managing multi-stage data processing within the Transplant App.

## Table Structure

1. **Headers**:

   - Each header represents a different stage in the data pipeline: `csv`, `transformed`, and `mapped`.
   - Additional controls are included for toggling irrelevant attributes, sorting, and filtering columns.

2. **Components Above Headers**:

   - Dropdowns and toggles allow users to transform data types, sort columns, and map them to the database schema.

3. **Dynamic Table**:
   - The table updates dynamically based on user interactions before data is pushed to the database.

## Implementation Steps

### 1. Define Table Headers

- **CSV Header**: Displays raw CSV headers.
- **Transformed Header**: Displays headers post-transformation.
- **Mapped Header**: Displays headers mapped to the database schema.

### 2. Create Components Above Headers

- **Dropdowns**: Enable selection of data types and transformation options.
- **Toggles**: Allow users to enable/disable features and sorting.

### 3. State Management

- Use `$state` and `$derived` runes to track current data processing stage.
- Implement functions like `loadCsv`, `transform`, and `mapColumns` for transitioning between stages.

### 4. UI Integration

- Implement the table in Svelte, ensuring it dynamically updates based on state.
- Connect UI elements to state from `data.ts` to maintain responsiveness.

## Organizing Table and Headers

### Approach 1: Single Route File with Header Components

**Structure:**

- A single route file (`+page.svelte`) manages the overall page.
- Separate components for each header type in `src/lib/components`.

**Pros:**

- **Modularity**: Headers are independent, making updates easier.
- **Reusability**: Components can be reused across different tables/pages.
- **Simplified Routing**: A single route file reduces complexity.

**Cons:**

- **Component Overhead**: Multiple small components may introduce complexity.
- **Inter-Component Communication**: State flow between the page and components needs careful handling.

### Approach 2: Separate Files for Each Table/Header Combo

**Structure:**

- Each table/header combination is defined in its own file.

**Pros:**

- **Isolation**: Reduces dependencies between components.
- **Customization**: Each table can have tailored logic.

**Cons:**

- **Duplication**: Similar logic may be repeated across files.
- **Maintenance**: Managing many files can become cumbersome.

### Approach 3: Table as a Component with Routes for Each Header

**Structure:**

- A shared table component, with separate routes for headers.

**Pros:**

- **Separation of Concerns**: Distinct separation of table logic and headers.
- **Dynamic Routing**: Supports conditional header rendering.

**Cons:**

- **Complex Routing**: Requires robust routing logic.
- **State Management**: Shared state handling between routes and components can be challenging.

### Recommended Approach

**Approach 1** (Single Route with Header Components) is recommended for its balance between modularity and simplicity. This structure ensures:

- Clear separation of concerns.
- Easier state management.
- Enhanced reusability.

## Reducing Complexity with Components

### Best Practices:

1. **Componentization**:

   - Separate headers and tables into modular components.
   - Keep UI logic separate from business logic.

2. **Three Headers per Route**:

   - Implement each header as its own component.
   - Maintain a direct relationship between headers and the table, avoiding deep nesting.

3. **Separation of Concerns**:

   - Move data processing logic to utility functions.
   - UI components should focus on rendering and interaction.

4. **Centralized State Management**:
   - Use a unified state management approach to minimize redundant state variables.

## Additional Considerations

- Implement error handling and validation to ensure data integrity.
- Keep UI intuitive and responsive for a better user experience.
- Allow users to interactively adjust and map columns before data is stored.

By following these strategies, the table implementation will be modular, efficient, and maintainable, aligning with the goals of the Transplant App.
