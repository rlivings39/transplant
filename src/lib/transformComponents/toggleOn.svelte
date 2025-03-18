<!-- src/lib/transformComponents/toggleOn.svelte -->
<script lang="ts">
    const { columnHeader, onToggle } = $props<{
      columnHeader: string;
      onToggle: (isActive: boolean) => void;
    }>();
  
    let isActive = $state(false);
  
    function toggle() {
      isActive = !isActive;
      onToggle(isActive);
    }
  </script>
  
  <button onclick={toggle} class:active={isActive}>
    {columnHeader} {isActive ? 'On' : 'Off'}
  </button>
  
  <style>
    button {
      padding: 0.5rem 1rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      cursor: pointer;
    }
    .active {
      background-color: #4CAF50;
      color: white;
    }
  </style>