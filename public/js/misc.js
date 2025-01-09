document.addEventListener('DOMContentLoaded', () => {
	const detailsContent = document.getElementById('details-content')

	const populateDropdown = async (endpoint, dropdownId, valueKey, textKey, preselectedValue = null) => {
		try {
			const response = await fetch(endpoint)
			let data = await response.json()
			data = data.tools

			const dropdown = document.getElementById(dropdownId)
			dropdown.innerHTML = ''

			if (!preselectedValue) {
				const placeholderOption = document.createElement('option')
				placeholderOption.value = ''
				placeholderOption.textContent = `Select a ${dropdownId.includes('tool') ? 'tool' : 'item'}`
				placeholderOption.disabled = true
				placeholderOption.selected = true
				dropdown.appendChild(placeholderOption)
			}

			data.forEach((item) => {
				const option = document.createElement('option')
				option.value = item[valueKey]
				option.textContent = item[textKey]
				if (String(item[valueKey]) === String(preselectedValue)) {
					option.selected = true
				}
				dropdown.appendChild(option)
			})
		} catch (error) {
			console.error(`Error fetching data for ${dropdownId}:`, error)
		}
	}

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
})
