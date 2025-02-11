<script>
	export let tableData = [];

	// Function to render table rows
	function renderRows() {
		return tableData
			.map((row) => {
				return `<tr>${Object.values(row)
					.map((value) => `<td>${value}</td>`)
					.join('')}</tr>`;
			})
			.join('');
	}
</script>

<table>
	<thead>
		<tr>
			<th>Column 1</th>
			<th>Column 2</th>
			<!-- Add more columns as needed -->
		</tr>
	</thead>
	<tbody>
		{@html renderRows()}
	</tbody>
</table>
