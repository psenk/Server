document.addEventListener('DOMContentLoaded', () => {
	const detailsContent = document.getElementById('details-content')

	// locations
	// create location
	document.getElementById('create-location-btn').addEventListener('click', () => {
		detailsContent.style.display = 'block'
		detailsContent.innerHTML = `
			<h3>Create Location</h3>
			<form id="create-location-form">
				<label for="location_name">Location Name:</label>
				<input type="text" id="location_name" name="locationName" required />
				<button type="submit">Create Location</button>
			</form>
		`

		document.getElementById('create-location-form').addEventListener('submit', async (e) => {
			e.preventDefault()
			const locationName = document.getElementById('location_name').value

			try {
				const response = await fetch('/misc/locations/new', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ locationName }),
				})

				const data = await response.json()
				alert(data.message || 'Location created successfully!')
			} catch (error) {
				console.error('Error creating location:', error)
				alert('Error creating location.')
			}
		})
	})

	// edit location
	document.getElementById('edit-location-btn').addEventListener('click', async () => {
		detailsContent.style.display = 'block'
		loadLocations()
	})

	// delete location
	document.getElementById('delete-location-btn').addEventListener('click', async () => {
		detailsContent.style.display = 'block'
		try {
			const response = await fetch('/misc/locations')
			const data = await response.json()

			if (!data.locations || data.locations.length === 0) {
				detailsContent.innerHTML = '<p>No locations available.</p>'
				return
			}

			let listHtml = '<h3>Delete Location</h3><h5>Select location you would like to delete from the list below:</h5><br><ul>'
			data.locations.forEach((loc) => {
				listHtml += `<li data-id="${loc.locationId}" class="location-item">${loc.locationName}</li>`
			})
			listHtml += '</ul>'
			detailsContent.innerHTML = listHtml

			document.querySelectorAll('.location-item').forEach((item) => {
				item.addEventListener('click', async () => {
					const locationId = item.getAttribute('data-id')
					const locationName = item.textContent
					const confirmDelete = confirm(`Are you sure you want to delete ${locationName}?`)

					if (confirmDelete) {
						try {
							const response = await fetch(`/misc/locations/delete/${locationId}`, {
								method: 'DELETE',
								headers: { 'Content-Type': 'application/json' },
							})

							const data = await response.json()
							alert(data.message || 'Location deleted successfully!')
							item.remove()
						} catch (error) {
							console.error('Error deleting location:', error)
							alert('Error deleting location.')
						}
					}
				})
			})
		} catch (error) {
			console.error('Error fetching locations:', error)
			detailsContent.innerHTML = '<p>Error loading locations.</p>'
		}
	})

	// manufacturers
	// create manufacturer
	document.getElementById('create-manufacturer-btn').addEventListener('click', () => {
		detailsContent.style.display = 'block'
		detailsContent.innerHTML = `
			<h3>Create Manufacturer</h3>
			<form id="create-manufacturer-form">
				<label for="manufacturer_name">Manufacturer Name:</label>
				<input type="text" id="manufacturer_name" name="manufacturerName" required />
				<label for="manufacturer_contact_number">Contact Number:</label>
				<input type="text" id="manufacturer_contact_number" name="manufacturerContactNumber" required />
				<label for="manufacturer_email">Email:</label>
				<input type="text" id="manufacturer_email" name="manufacturerEmail" required />
				<button type="submit">Create Manufacturer</button>
			</form>
		`

		document.getElementById('create-manufacturer-form').addEventListener('submit', async (e) => {
			e.preventDefault()
			const manufacturerName = document.getElementById('manufacturer_name').value
			const manufacturerContactNumber = document.getElementById('manufacturer_contact_number').value
			const manufacturerEmail = document.getElementById('manufacturer_email').value

			try {
				const response = await fetch('/misc/manufacturers/new', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ manufacturerName, manufacturerContactNumber, manufacturerEmail }),
				})

				const data = await response.json()
				alert(data.message || 'Manufacturer created successfully!')
			} catch (error) {
				console.error('Error creating manufacturer:', error)
				alert('Error creating manufacturer.')
			}
		})
	})

	// edit manufacturer
	document.getElementById('edit-manufacturer-btn').addEventListener('click', async () => {
		detailsContent.style.display = 'block'
		loadManufacturers()
	})

	// delete manufacturer
	document.getElementById('delete-manufacturer-btn').addEventListener('click', async () => {
		detailsContent.style.display = 'block'
		try {
			const response = await fetch('/misc/manufacturers')
			const data = await response.json()

			if (!data.manufacturers || data.manufacturers.length === 0) {
				detailsContent.innerHTML = '<p>No manufacturers available.</p>'
				return
			}

			let listHtml = '<h3>Delete Manufacturer</h3><h5>Select manufacturer you would like to delete from the list below:</h5><br><ul>'
			data.manufacturers.forEach((manu) => {
				listHtml += `<li data-id="${manu.manufacturerId}" class="manufacturer-item">${manu.manufacturerName}</li>`
			})
			listHtml += '</ul>'
			detailsContent.innerHTML = listHtml

			document.querySelectorAll('.manufacturer-item').forEach((item) => {
				item.addEventListener('click', async () => {
					const manufacturerId = item.getAttribute('data-id')
					const manufacturerName = item.textContent
					const confirmDelete = confirm(`Are you sure you want to delete ${manufacturerName}?`)

					if (confirmDelete) {
						try {
							const response = await fetch(`/misc/manufacturers/delete/${manufacturerId}`, {
								method: 'DELETE',
								headers: { 'Content-Type': 'application/json' },
							})

							const data = await response.json()
							alert(data.message || 'Manufacturer deleted successfully!')
							item.remove()
						} catch (error) {
							console.error('Error deleting manufacturer:', error)
							alert('Error deleting manufacturer.')
						}
					}
				})
			})
		} catch (error) {
			console.error('Error fetching manufacturers:', error)
			detailsContent.innerHTML = '<p>Error loading manufacturers.</p>'
		}
	})

	// inspections
	// create inspection
	document.getElementById('create-inspection-btn').addEventListener('click', () => {
		detailsContent.style.display = 'block'
		detailsContent.innerHTML = `
			<h3>Create Inspection</h3>
			<form id="create-inspection-form">
				<label for="inspection_name">Inspection Name:</label>
				<input type="text" id="inspection_name" name="inspectionName" required />
				<label for="tool_id">Tool ID:</label>
				<input type="number" id="tool_id" name="toolId" required />
				<label for="inspection_frequency">Frequency:</label>
				<input type="number" id="inspection_frequency" name="inspectionFrequency" />
				<label for="inspection_due_date">Due Date:</label>
				<input type="datetime-local" id="inspection_due_date" name="inspectionDueDate" required />
				<label for="inspection_completed_date">Completed Date:</label>
				<input type="datetime-local" id="inspection_completed_date" name="inspectionCompletedDate" />
				<button type="submit">Create Inspection</button>
			</form>
		`

		document.getElementById('create-inspection-form').addEventListener('submit', async (e) => {
			e.preventDefault()
			const inspectionName = document.getElementById('inspection_name').value
			const toolId = parseInt(document.getElementById('tool_id').value)
			const inspectionFrequency = parseInt(document.getElementById('inspection_frequency').value || '0')
			const inspectionDueDate = new Date(document.getElementById('inspection_due_date').value).toISOString()
			const inspectionCompletedDate = document.getElementById('inspection_completed_date').value ? new Date(document.getElementById('inspection_completed_date').value).toISOString() : null

			try {
				const response = await fetch('/misc/inspections/new', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						inspectionName,
						toolId,
						inspectionFrequency,
						inspectionDueDate,
						inspectionCompletedDate,
					}),
				})

				const data = await response.json()
				alert(data.message || 'Inspection created successfully!')
			} catch (error) {
				console.error('Error creating inspection:', error)
				alert('Error creating inspection.')
			}
		})
	})

	// edit inspection
	document.getElementById('edit-inspection-btn').addEventListener('click', async () => {
		detailsContent.style.display = 'block'
		loadInspections()
	})

	// delete inspection
	document.getElementById('delete-inspection-btn').addEventListener('click', async () => {
		detailsContent.style.display = 'block'
		try {
			const response = await fetch('/misc/inspections')
			const data = await response.json()

			if (!data.inspections || data.inspections.length === 0) {
				detailsContent.innerHTML = '<p>No inspections available.</p>'
				return
			}

			let listHtml = '<h3>Delete Inspection</h3><h5>Select inspection you would like to delete from the list below:</h5><br><ul>'
			data.inspections.forEach((insp) => {
				listHtml += `
					<li data-id="${insp.inspectionId}" 
						class="inspection-item">${insp.inspectionName}
					</li>`
			})
			listHtml += '</ul>'
			detailsContent.innerHTML = listHtml

			document.querySelectorAll('.inspection-item').forEach((item) => {
				item.addEventListener('click', async () => {
					const inspectionId = item.getAttribute('data-id')
					const inspectionName = item.textContent
					const confirmDelete = confirm(`Are you sure you want to delete ${inspectionName}?`)

					if (confirmDelete) {
						try {
							const response = await fetch(`/misc/inspections/delete/${inspectionId}`, {
								method: 'DELETE',
								headers: { 'Content-Type': 'application/json' },
							})

							const data = await response.json()
							alert(data.message || 'Inspection deleted successfully!')
							item.remove()
						} catch (error) {
							console.error('Error deleting inspection:', error)
							alert('Error deleting inspection.')
						}
					}
				})
			})
		} catch (error) {
			console.error('Error deleting inspections:', error)
			detailsContent.innerHTML = '<p>Error deleting inspections.</p>'
		}
	})

	// parts
	// create part
	document.getElementById('create-part-btn').addEventListener('click', () => {
		detailsContent.style.display = 'block'
		detailsContent.innerHTML = `
			<h3>Create Part</h3>
			<form id="create-part-form">
				<label for="part_name">Part Name:</label>
				<input type="text" id="part_name" name="partName" required />
				<label for="tool_id">Tool ID:</label>
				<input type="number" id="tool_id" name="toolId" required />
				<label for="part_quantity">Part Quantity:</label>
				<input type="number" id="part_quantity" name="partQuantity" />
				<button type="submit">Create Part</button>
			</form>
		`

		document.getElementById('create-part-form').addEventListener('submit', async (e) => {
			e.preventDefault()
			const partName = document.getElementById('part_name').value
			const toolId = parseInt(document.getElementById('tool_id').value)
			const partQuantity = parseInt(document.getElementById('part_quantity').value || '0')

			try {
				const response = await fetch('/misc/parts/new', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ partName, toolId, partQuantity }),
				})

				const data = await response.json()
				alert(data.message || 'Part created successfully!')
			} catch (error) {
				console.error('Error creating part:', error)
				alert('Error creating part.')
			}
		})
	})

	// edit part
	document.getElementById('edit-part-btn').addEventListener('click', async () => {
		detailsContent.style.display = 'block'
		loadParts()
	})

	document.getElementById('delete-part-btn').addEventListener('click', async () => {
		detailsContent.style.display = 'block'
		try {
			const response = await fetch('/misc/parts')
			const data = await response.json()

			if (!data.parts || data.parts.length === 0) {
				detailsContent.innerHTML = '<p>No parts available.</p>'
				return
			}

			let listHtml = '<h3>Delete Part</h3><h5>Select part you would like to delete from the list below:</h5><br><ul>'
			data.parts.forEach((part) => {
				listHtml += `
					<li data-id="${part.partId}" 
						class="part-item">${part.partName}</li>`
			})
			listHtml += '</ul>'
			detailsContent.innerHTML = listHtml

			document.querySelectorAll('.part-item').forEach((item) => {
				item.addEventListener('click', async () => {
					const partId = item.getAttribute('data-id')
					const partName = item.textContent
					const confirmDelete = confirm(`Are you sure you want to delete ${partName}?`)

					if (confirmDelete) {
						try {
							const response = await fetch(`/misc/parts/delete/${partId}`, {
								method: 'DELETE',
								headers: { 'Content-Type': 'application/json' },
							})

							const data = await response.json()
							alert(data.message || 'Part deleted successfully!')
							item.remove()
						} catch (error) {
							console.error('Error deleting part:', error)
							alert('Error deleting part.')
						}
					}
				})
			})
		} catch (error) {
			console.error('Error deleting parts:', error)
			detailsContent.innerHTML = '<p>Error deleting parts.</p>'
		}
	})
})

async function loadLocations() {
	const detailsContent = document.getElementById('details-content')
	try {
		const response = await fetch('/misc/locations')
		const data = await response.json()

		if (!data.locations || data.locations.length === 0) {
			detailsContent.innerHTML = '<p>No locations available.</p>'
			return
		}

		let listHtml = '<h3>Edit Location</h3><h5>Select location you would like to edit from the list below:</h5><br><ul>'
		data.locations.forEach((loc) => {
			listHtml += `<li data-id="${loc.locationId}" class="location-item">${loc.locationName}</li>`
		})
		listHtml += '</ul><div id="edit-form"></div>'
		detailsContent.innerHTML = listHtml

		document.querySelectorAll('.location-item').forEach((item) => {
			item.addEventListener('click', () => {
				const locationId = item.getAttribute('data-id')
				const locationName = item.textContent

				const editForm = document.getElementById('edit-form')
				editForm.innerHTML = `
                    <h4>Edit Location</h4>
                    <form id="edit-location-form">
                        <label for="edit_location_name">Location Name:</label>
                        <input type="text" id="edit_location_name" name="locationName" value="${locationName}" required />
                        <button type="submit">Save Location</button>
                    </form>
                `

				document.getElementById('edit-location-form').addEventListener('submit', async (e) => {
					e.preventDefault()
					const updatedLocationName = document.getElementById('edit_location_name').value

					try {
						const response = await fetch(`/misc/locations/edit/${locationId}`, {
							method: 'PUT',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ locationName: updatedLocationName }),
						})

						const data = await response.json()
						alert(data.message || 'Location updated successfully!')
						loadLocations()
					} catch (error) {
						console.error('Error updating location:', error)
						alert('Error updating location.')
					}
				})
			})
		})
	} catch (error) {
		console.error('Error fetching locations:', error)
		detailsContent.innerHTML = '<p>Error loading locations.</p>'
	}
}

async function loadManufacturers() {
	const detailsContent = document.getElementById('details-content')
	try {
		const response = await fetch('/misc/manufacturers')
		const data = await response.json()

		if (!data.manufacturers || data.manufacturers.length === 0) {
			detailsContent.innerHTML = '<p>No manufacturers available.</p>'
			return
		}

		let listHtml = '<h3>Edit Manufacturer</h3><h5>Select manufacturer you would like to edit from the list below:</h5><br><ul>'
		data.manufacturers.forEach((manu) => {
			listHtml += `<li data-id="${manu.manufacturerId}"
                data-contact-number="${manu.manufacturerContactNumber}"
                data-email="${manu.manufacturerEmail}" 
                class="manufacturer-item">${manu.manufacturerName}</li>`
		})
		listHtml += '</ul><div id="edit-form"></div>'
		detailsContent.innerHTML = listHtml

		document.querySelectorAll('.manufacturer-item').forEach((item) => {
			item.addEventListener('click', () => {
				const manufacturerId = item.getAttribute('data-id')
				const manufacturerName = item.textContent
				const manufacturerContactNumber = item.getAttribute('data-contact-number')
				const manufacturerEmail = item.getAttribute('data-email')

				const editForm = document.getElementById('edit-form')
				editForm.innerHTML = `
                    <h4>Edit Manufacturer</h4>
                    <form id="edit-manufacturer-form">
                        <label for="edit_manufacturer_name">Manufacturer Name:</label>
                        <input type="text" id="edit_manufacturer_name" name="manufacturerName" value="${manufacturerName}" required />
                        <label for="edit_contact_number">Contact Number:</label>
                        <input type="text" id="edit_contact_number" name="contactNumber" value="${manufacturerContactNumber}" />
                        <label for="edit_email">Email:</label>
                        <input type="text" id="edit_email" name="email" value="${manufacturerEmail}" />
                        <button type="submit">Save Manufacturer</button>
                    </form>
                `

				document.getElementById('edit-manufacturer-form').addEventListener('submit', async (e) => {
					e.preventDefault()
					const updatedName = document.getElementById('edit_manufacturer_name').value
					const updatedContactNumber = document.getElementById('edit_contact_number').value
					const updatedEmail = document.getElementById('edit_email').value

					try {
						const response = await fetch(`/misc/manufacturers/edit/${manufacturerId}`, {
							method: 'PUT',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								manufacturerName: updatedName,
								manufacturerContactNumber: updatedContactNumber,
								manufacturerEmail: updatedEmail,
							}),
						})

						const data = await response.json()
						alert(data.message || 'Manufacturer updated successfully!')
						loadManufacturers()
					} catch (error) {
						console.error('Error updating manufacturer:', error)
						alert('Error updating manufacturer.')
					}
				})
			})
		})
	} catch (error) {
		console.error('Error fetching manufacturers:', error)
		detailsContent.innerHTML = '<p>Error loading manufacturers.</p>'
	}
}

async function loadInspections() {
	const detailsContent = document.getElementById('details-content')
	try {
		const response = await fetch('/misc/inspections')
		const data = await response.json()

		if (!data.inspections || data.inspections.length === 0) {
			detailsContent.innerHTML = '<p>No inspections available.</p>'
			return
		}

		let listHtml = '<h3>Edit Inspection</h3><h5>Select inspection you would like to edit from the list below:</h5><br><ul>'
		data.inspections.forEach((insp) => {
			const dueDate = new Date(insp.inspectionDueDate).toISOString().slice(0, 16)
			const completedDate = insp.inspectionCompletedDate ? new Date(insp.inspectionCompletedDate).toISOString().slice(0, 16) : ''
			listHtml += `
                <li data-id="${insp.inspectionId}"
                    data-tool-id="${insp.toolId}"
                    data-frequency="${insp.inspectionFrequency}"
                    data-due-date="${insp.inspectionDueDate}"
                    data-completed-date="${insp.inspectionCompletedDate}"
                    data-parsed-due-date="${dueDate}" 
                    data-parsed-completed-date="${completedDate}" 
                    class="inspection-item">${insp.inspectionName}
                </li>`
		})
		listHtml += '</ul><div id="edit-form"></div>'
		detailsContent.innerHTML = listHtml

		document.querySelectorAll('.inspection-item').forEach((item) => {
			item.addEventListener('click', () => {
				const inspectionId = item.getAttribute('data-id')
				const inspectionName = item.textContent
				const toolId = item.getAttribute('data-tool-id')
				const inspectionFrequency = item.getAttribute('data-frequency')
				const parsedDueDate = item.getAttribute('data-parsed-due-date')
				const parsedCompletedDate = item.getAttribute('data-parsed-completed-date')

				const editForm = document.getElementById('edit-form')
				editForm.innerHTML = `
                    <h4>Edit Inspection</h4>
                    <form id="edit-inspection-form">
                        <label for="edit_inspection_name">Inspection Name:</label>
                        <input type="text" id="edit_inspection_name" name="inspectionName" value="${inspectionName}" required />
                        <label for="edit_tool_id">Tool ID:</label>
                        <input type="text" id="edit_tool_id" name="toolId" value="${toolId}" required />
                        <label for="edit_inspection_frequency">Frequency:</label>
                        <input type="number" id="edit_inspection_frequency" name="inspectionFrequency" value="${inspectionFrequency}" />
                        <label for="edit_inspection_due_date">Due Date:</label>
                        <input type="datetime-local" id="edit_inspection_due_date" name="inspectionDueDate" value="${parsedDueDate}" required />
                        <label for="edit_inspection_completed_date">Completed Date:</label>
                        <input type="datetime-local" id="edit_inspection_completed_date" name="inspectionCompletedDate" value="${parsedCompletedDate}" />
                        <button type="submit">Save Inspection</button>
                    </form>
                `

				document.getElementById('edit-inspection-form').addEventListener('submit', async (e) => {
					e.preventDefault()
					const updatedInspectionName = document.getElementById('edit_inspection_name').value
					const updatedToolId = parseInt(document.getElementById('edit_tool_id').value)
					const updatedInspectionFrequency = parseInt(document.getElementById('edit_inspection_frequency').value || '0')
					const updatedInspectionDueDate = new Date(document.getElementById('edit_inspection_due_date').value).toISOString()
					const updatedInspectionCompletedDate = document.getElementById('edit_inspection_completed_date').value
						? new Date(document.getElementById('edit_inspection_completed_date').value).toISOString()
						: null

					try {
						const response = await fetch(`/misc/inspections/edit/${inspectionId}`, {
							method: 'PUT',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								inspectionName: updatedInspectionName,
								toolId: updatedToolId,
								inspectionFrequency: updatedInspectionFrequency,
								inspectionDueDate: updatedInspectionDueDate,
								inspectionCompletedDate: updatedInspectionCompletedDate,
							}),
						})

						const data = await response.json()
						alert(data.message || 'Inspection updated successfully!')
						loadInspections()
					} catch (error) {
						console.error('Error updating inspection:', error)
						alert('Error updating inspection.')
					}
				})
			})
		})
	} catch (error) {
		console.error('Error fetching inspections:', error)
		detailsContent.innerHTML = '<p>Error loading inspections.</p>'
	}
}

async function loadParts() {
	const detailsContent = document.getElementById('details-content')
	try {
		const response = await fetch('/misc/parts')
		const data = await response.json()

		if (!data.parts || data.parts.length === 0) {
			detailsContent.innerHTML = '<p>No parts available.</p>'
			return
		}

		let listHtml = '<h3>Edit Part</h3><h5>Select part you would like to edit from the list below:</h5><br><ul>'
		data.parts.forEach((part) => {
			listHtml += `
                <li data-id="${part.partId}" 
                    data-tool-id="${part.toolId}" 
                    data-quantity="${part.partQuantity}" 
                    class="part-item">${part.partName}</li>`
		})
		listHtml += '</ul><div id="edit-form"></div>'
		detailsContent.innerHTML = listHtml

		document.querySelectorAll('.part-item').forEach((item) => {
			item.addEventListener('click', () => {
				const partId = item.getAttribute('data-id')
				const partName = item.textContent
				const toolId = item.getAttribute('data-tool-id')
				const partQuantity = item.getAttribute('data-quantity')

				const editForm = document.getElementById('edit-form')
				editForm.innerHTML = `
                    <h4>Edit Part</h4>
                    <form id="edit-part-form">
                        <label for="edit_part_name">Part Name:</label>
                        <input type="text" id="edit_part_name" name="partName" value="${partName}" required />
                        <label for="edit_tool_id">Tool ID:</label>
                        <input type="number" id="edit_tool_id" name="toolId" value="${toolId}" required />
                        <label for="edit_part_quantity">Part Quantity:</label>
                        <input type="number" id="edit_part_quantity" name="partQuantity" value="${partQuantity}" />
                        <button type="submit">Save Part</button>
                    </form>
                `

				document.getElementById('edit-part-form').addEventListener('submit', async (e) => {
					e.preventDefault()
					const updatedPartName = document.getElementById('edit_part_name').value
					const updatedToolId = parseInt(document.getElementById('edit_tool_id').value)
					const updatedPartQuantity = parseInt(document.getElementById('edit_part_quantity').value || '0')

					try {
						const response = await fetch(`/misc/parts/edit/${partId}`, {
							method: 'PUT',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								partName: updatedPartName,
								toolId: updatedToolId,
								partQuantity: updatedPartQuantity,
							}),
						})

						const data = await response.json()
						alert(data.message || 'Part updated successfully!')
						loadParts()
					} catch (error) {
						console.error('Error updating part:', error)
						alert('Error updating part.')
					}
				})
			})
		})
	} catch (error) {
		console.error('Error fetching parts:', error)
		detailsContent.innerHTML = '<p>Error loading parts.</p>'
	}
}
