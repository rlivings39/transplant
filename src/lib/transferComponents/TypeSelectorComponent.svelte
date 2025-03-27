<script lang="ts">
	const { columnData = [], currentType = 'string' } = $props<{
		columnData?: Array<string | number | null>;
		currentType?: string;
	}>();

	// Debug: Log incoming column data
	console.log('Received columnData:', columnData);

	const types = ['string', 'number', 'date', 'gps'];

	let detectedType = $state(currentType);

	// Number detection with debug
	function isNumber(value: any): boolean {
    const num = Number(value);
    const result = !isNaN(num) && value !== '';
    console.log(`Checking if ${value} is number:`, result);
    return result;
  }
// Detect numbers with debug
$effect(() => {
    console.log('Running number detection on columnData');
    if (columnData.some(isNumber)) {
      console.log('Number detected in column');
      detectedType = 'number';
    }
  });
</script>

<div class="type-selector">
	<select bind:value={detectedType}>
		{#each types as type}
			<option value={type}>{type}</option>
		{/each}
	</select>
</div>
