<script lang="ts">
    const { columnId, onToggle } = $props<{
      columnId: string;
      onToggle: (columnId: string, isActive: boolean) => void;
    }>();
  
    let isActive = $state(true);
  
    function handleToggle() {
      isActive = !isActive;
      onToggle(columnId, isActive);
      console.log('Toggle:', columnId, isActive);
    }
  </script>
  
  <div class="column-toggle">
    <input 
      type="checkbox" 
      checked={isActive}
      onchange={handleToggle}
    />
  </div>
  
  