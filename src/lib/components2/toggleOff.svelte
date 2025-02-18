<script lang="ts">
    const { columnId, onToggle } = $props<{
      columnId: string;
      onToggle: (columnId: string, isActive: boolean) => void;
    }>();
  
    let isActive = $state(true);
  
    function handleToggle() {
      isActive = !isActive;
      onToggle(columnId, isActive);
    }
  </script>
  
  <div class="column-toggle {columnId}">
    <input 
      type="checkbox" 
      bind:checked={isActive}
      onchange={handleToggle}
      class={columnId}
    />
  </div>
  
  <style>
    .column-toggle {
      display: inline-block;
      margin: 0 0.5rem;
    }
  
    input[type="checkbox"] {
      cursor: pointer;
      opacity: 1;
      transition: opacity 0.2s ease;
    }
  
    input[type="checkbox"]:not(:checked) {
      opacity: 0.5;
    }
  </style>