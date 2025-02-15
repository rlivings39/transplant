<script lang="ts">
    import { logger } from '$lib/utils/logger';

    const { header } = $props<{
        header: string;
    }>();
 
    let isRemoved = $state(false);

    function toggleColumn() {
        isRemoved = !isRemoved;
        logger.log('Column visibility toggled', { header, isRemoved });
    }
</script>

<div class="column-toggle">
    <input 
        type="checkbox"
        checked={!isRemoved}
        onchange={ toggleColumn }
    />
</div>

<style>
    .column-toggle {
        display: flex;
        justify-content: center;
        padding: 0.25rem;
    }

    input[type="checkbox"] {
        width: 1rem;
        height: 1rem;
        cursor: pointer;
    }
</style>