document.addEventListener('DOMContentLoaded', () => {
	const detailsContent = document.getElementById('details-content')

	// Create tool
	document.getElementById('create-tool-btn').addEventListener('click', () => {
		detailsContent.style.display = 'block'
		detailsContent.innerHTML = `
            <h3>Create Tool</h3>
            <form id="create-tool-form">
                <label for="tool_code">Tool Code:</label>
                <input type="text" id="tool_code" name="toolCode" required />
                <label for="tool_name">Tool Name:</label>
                <input type="text" id="tool_name" name="toolName" required />
                <label for="tool_image_url">Tool Image URL:</label>
                <input type="text" id="tool_image_url" name="toolImageUrl" />
                <label for="manufacturer_id">Manufacturer ID:</label>
                <input type="number" id="manufacturer_id" name="manufacturerId" />
                <label for="location_id">Location ID:</label>
                <input type="number" id="location_id" name="locationId" />
                <button type="submit">Create Tool</button>
            </form>
        `

		document.getElementById('create-tool-form').addEventListener('submit', async (e) => {
			e.preventDefault()
			const toolDetails = {
				toolCode: document.getElementById('tool_code').value,
				toolName: document.getElementById('tool_name').value,
				toolImageUrl: document.getElementById('tool_image_url').value,
				manufacturerId: document.getElementById('manufacturer_id').value,
				locationId: document.getElementById('location_id').value,
			}
            console.log(toolDetails)
			try {
				const response = await fetch('/tools/new', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(toolDetails),
				})

				const data = await response.json()
				alert(data.message || 'Tool created successfully!')
			} catch (error) {
				console.error('Error creating tool:', error)
				alert('Error creating tool.')
			}
		})
	})

	// Edit Tool
	document.getElementById('edit-tool-btn').addEventListener('click', async () => {
		const toolCode = prompt('Enter the Tool Code to edit:')
		if (!toolCode) {
			alert('Tool Code is required.')
			return
		}

		try {
			const response = await fetch(`/tools/${toolCode}`)
			const data = await response.json()

			if (!data.tool) {
				alert(data.message || 'Tool not found.')
				return
			}

			const tool = data.tool

			detailsContent.style.display = 'block'
			detailsContent.innerHTML = `
                <h3>Edit Tool</h3>
                <form id="edit-tool-form">
                    <label for="edit_tool_code">Tool Code:</label>
                    <input type="text" id="edit_tool_code" value="${tool.toolCode}" required />
                    <label for="edit_tool_name">Tool Name:</label>
                    <input type="text" id="edit_tool_name" value="${tool.toolName}" required />
                    <label for="edit_tool_image_url">Tool Image URL:</label>
                    <input type="text" id="edit_tool_image_url" value="${tool.toolImageUrl || ''}" />
                    <label for="edit_manufacturer_id">Manufacturer ID:</label>
                    <input type="number" id="edit_manufacturer_id" value="${tool.manufacturerId || ''}" />
                    <label for="edit_location_id">Location ID:</label>
                    <input type="number" id="edit_location_id" value="${tool.locationId || ''}" />
                    <button type="submit">Save Tool</button>
                </form>
            `

			document.getElementById('edit-tool-form').addEventListener('submit', async (e) => {
				e.preventDefault()

				const updatedToolDetails = {
					toolCode: document.getElementById('edit_tool_code').value,
					toolName: document.getElementById('edit_tool_name').value,
					toolImageUrl: document.getElementById('edit_tool_image_url').value,
					manufacturerId: document.getElementById('edit_manufacturer_id').value,
					locationId: document.getElementById('edit_location_id').value,
				}

				try {
					const response = await fetch(`/tools/edit/${tool.toolId}`, {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(updatedToolDetails),
					})

					const data = await response.json()
					alert(data.message || 'Tool updated successfully!')
				} catch (error) {
					console.error('Error updating tool:', error)
					alert('Error updating tool.')
				}
			})
		} catch (error) {
			console.error('Error fetching tool:', error)
			alert('Error fetching tool.')
		}
	})

	// Delete Tool
	document.getElementById('delete-tool-btn').addEventListener('click', async () => {
		const toolCode = prompt('Enter the Tool Code to delete:')
		if (!toolCode) {
			alert('Tool Code is required.')
			return
		}

		try {
			const response = await fetch(`/tools/${toolCode}`)
			const data = await response.json()

			if (!data.tool) {
				alert(data.message || 'Tool not found.')
				return
			}

			const confirmDelete = confirm(`Are you sure you want to delete the tool "${data.tool.toolName}" (${data.tool.toolCode})?`)
			if (!confirmDelete) return

			try {
				const deleteResponse = await fetch(`/tools/delete/${data.tool.toolId}`, {
					method: 'DELETE',
					headers: { 'Content-Type': 'application/json' },
				})

				const deleteData = await deleteResponse.json()
				alert(deleteData.message || 'Tool deleted successfully!')
			} catch (error) {
				console.error('Error deleting tool:', error)
				alert('Error deleting tool.')
			}
		} catch (error) {
			console.error('Error fetching tool:', error)
			alert('Error fetching tool.')
		}
	})
})
