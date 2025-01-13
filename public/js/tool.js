document.addEventListener('DOMContentLoaded', () => {
	const detailsContent = document.getElementById('details-content')

	const ToolStatus = {
		CHECKED_OUT: 'CHECKED_OUT',
		AVAILABLE: 'AVAILABLE',
		BROKEN: 'BROKEN',
		OUT_FOR_INSPECTION: 'OUT_FOR_INSPECTION',
	}

	// populate dropdowns
	const populateDropdown = async (endpoint, dropdownId, valueKey, textKey, preselectedValue = null) => {
		try {
			const response = await fetch(endpoint)
			let data = await response.json()

			if (data.manufacturers) {
				data = data.manufacturers
			}

			const dropdown = document.getElementById(dropdownId)
			dropdown.innerHTML = ''

			if (!preselectedValue) {
				const placeholderOption = document.createElement('option')
				placeholderOption.value = ''
				placeholderOption.textContent = 'Select a manufacturer'
				placeholderOption.disabled = true
				placeholderOption.selected = true
				dropdown.appendChild(placeholderOption)
			}

			data.forEach((item) => {
				const option = document.createElement('option')
				option.value = item[valueKey]
				option.textContent = item[textKey]
				if (item[valueKey] === preselectedValue) {
					option.selected = true
				}
				dropdown.appendChild(option)
			})
		} catch (error) {
			console.error(`Error fetching data for ${dropdownId}:`, error)
		}
	}

	// Create tool
	document.getElementById('create-tool-btn').addEventListener('click', async () => {
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
				<label for="manufacturer_id">Manufacturer:</label>
				<select id="manufacturer_id" name="manufacturerId" ></select>
                <button type="submit">Create Tool</button>
            </form>
        `

		await populateDropdown('/misc/manufacturers', 'manufacturer_id', 'manufacturerId', 'manufacturerName')

		document.getElementById('create-tool-form').addEventListener('submit', async (e) => {
			e.preventDefault()
			const form = e.target

			const toolDetails = {
				toolCode: document.getElementById('tool_code').value,
				toolName: document.getElementById('tool_name').value,
				toolImageUrl: document.getElementById('tool_image_url').value,
				manufacturerId: document.getElementById('manufacturer_id').value,
			}

			try {
				const response = await fetch('/tools/new', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(toolDetails),
				})

				const data = await response.json()
				alert(data.message || 'Tool created successfully!')
				form.reset()
				await populateDropdown('/misc/manufacturers', 'manufacturer_id', 'manufacturerId', 'manufacturerName')
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
					<label for="edit_manufacturer_id">Manufacturer:</label>
					<select id="edit_manufacturer_id" name="manufacturerId"></select>
                    <button type="submit">Save Tool</button>
                </form>
            `

			await populateDropdown('/misc/manufacturers', 'edit_manufacturer_id', 'manufacturerId', 'manufacturerName', tool.manufacturerId)

			document.getElementById('edit-tool-form').addEventListener('submit', async (e) => {
				e.preventDefault()
				const form = e.target

				const updatedToolDetails = {
					toolCode: document.getElementById('edit_tool_code').value,
					toolName: document.getElementById('edit_tool_name').value,
					toolImageUrl: document.getElementById('edit_tool_image_url').value,
					manufacturerId: document.getElementById('edit_manufacturer_id').value,
				}

				try {
					const response = await fetch(`/tools/edit/${tool.toolId}`, {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(updatedToolDetails),
					})

					const data = await response.json()
					alert(data.message || 'Tool updated successfully!')
					form.reset()
					await populateDropdown('/misc/manufacturers', 'edit_manufacturer_id', 'manufacturerId', 'manufacturerName')
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

	// Update tool status
	document.getElementById('update-tool-btn').addEventListener('click', async () => {
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
            <h3>Update Tool Status</h3>
            <form id="update-tool-form">
                <label for="tool_checked_out">Tool Checked Out:</label>
                <input type="checkbox" id="tool_checked_out" name="toolCheckedOut" ${tool.toolCheckedOut ? 'checked' : ''}"/>
                <label for="tool_status">Tool Status:</label>
                <select id="tool_status" name="toolStatus">
				                    ${Object.values(ToolStatus)
										.map((status) => `<option value="${status}" ${tool.toolStatus === status ? 'selected' : ''}>${status.replace(/_/g, ' ')}</option>`)
										.join('')}</select>
                <button type="submit">Update Tool</button>
            </form>
        `

			document.getElementById('update-tool-form').addEventListener('submit', async (e) => {
				e.preventDefault()
				const form = e.target

				const toolDetails = {
					toolCode: tool.toolCode,
					toolName: tool.toolName,
					toolCheckedOut: document.getElementById('tool_checked_out').checked,
					toolStatus: document.getElementById('tool_status').value,
				}

				try {
					const response = await fetch(`/tools/edit/${tool.toolId}`, {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(toolDetails),
					})

					const data = await response.json()
					alert(data.message || 'Tool updated successfully!')
					form.reset()
				} catch (error) {
					console.error('Error updating tool:', error)
					alert('Error updating tool.')
				}
			})
		} catch (error) {
			console.error('Error updating tool:', error)
			alert('Error updating tool.')
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

document.getElementById('logout-btn').addEventListener('click', function (e) {
    e.preventDefault();

    const token = localStorage.getItem('token');

    if (!token) {
        alert('You are not logged in!');
        return;
    }

    fetch('/auth/logout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        }
    })
        .then((response) => {
            if (response.ok) {
                localStorage.removeItem('token');
                sessionStorage.clear();
                window.location.href = '/';
            } else {
                alert('Failed to log out. Please try again.');
            }
        })
        .catch((error) => {
            console.error('Error during logout:', error);
        });
});