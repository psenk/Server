document.addEventListener('DOMContentLoaded', () => {
	const detailsContent = document.getElementById('details-content')

	// populate dropdowns
	const populateDropdown = async (endpoint, dropdownId, valueKey, textKey, preselectedValue = null) => {
		try {
			const response = await fetch(endpoint)
			let data = await response.json()

			if (data.locations) {
				data = data.locations
			} else if (data.users) {
				data = data.users
			}

			const dropdown = document.getElementById(dropdownId)
			dropdown.innerHTML = ''

			if (!preselectedValue) {
				const placeholderOption = document.createElement('option')
				placeholderOption.value = ''
				placeholderOption.textContent = `Select a ${dropdownId.includes('location') ? 'location' : 'supervisor'}`
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

	// Create User
	document.getElementById('create-user-btn').addEventListener('click', async () => {
		detailsContent.style.display = 'block'
		detailsContent.innerHTML = `
            <h3>Create User</h3>
            <form id="create-user-form">
                <label for="user_display_id">User Display ID:</label>
                <input type="text" id="user_display_id" name="userDisplayId" required />
                <label for="user_name">User Name:</label>
                <input type="text" id="user_name" name="userName" required />
                <label for="user_contact_number">Contact Number:</label>
                <input type="text" id="user_contact_number" name="userContactNumber" />
                <label for="user_email">Email:</label>
                <input type="email" id="user_email" name="userEmail" required />
                <label for="supervisor_id">Supervisor:</label>
				<select id="supervisor_id" name="supervisorId"></select>
				<label for="location_id">Location:</label>
				<select id="location_id" name="locationId"></select>
                <label for="user_admin">Admin?</label>
                <input type="checkbox" id="user_admin" name="userAdmin" />
                <label for="user_auth">Password (Admins Only):</label>
                <input type="password" id="user_auth" name="userAuth" />
                <button type="submit">Create User</button>
            </form>
        `

		await populateDropdown('/users/all', 'supervisor_id', 'userId', 'userName')
		await populateDropdown('/misc/locations', 'location_id', 'locationId', 'locationName')

		document.getElementById('create-user-form').addEventListener('submit', async (e) => {
			e.preventDefault()
			const userDetails = {
				userDisplayId: document.getElementById('user_display_id').value,
				userName: document.getElementById('user_name').value,
				userContactNumber: document.getElementById('user_contact_number').value,
				userEmail: document.getElementById('user_email').value,
				supervisorId: document.getElementById('supervisor_id').value,
				locationId: document.getElementById('location_id').value,
				userAdmin: document.getElementById('user_admin').checked,
				userAuth: document.getElementById('user_auth').value,
			}

			try {
				const response = await fetch('/users/new', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(userDetails),
				})

				const data = await response.json()
				alert(data.message || 'User created successfully!')
			} catch (error) {
				console.error('Error creating user:', error)
				alert('Error creating user.')
			}
		})
	})

	// Edit User
	document.getElementById('edit-user-btn').addEventListener('click', async () => {
		const displayId = prompt('Enter the User Display ID to edit:')
		if (!displayId) {
			alert('User Display ID is required.')
			return
		}

		try {
			const response = await fetch(`/users/${displayId}`)
			const data = await response.json()

			if (!data.user) {
				alert(data.message || 'User not found.')
				return
			}

			const user = data.user

			detailsContent.style.display = 'block'
			detailsContent.innerHTML = `
                <h3>Edit User</h3>
                <form id="edit-user-form">
                    <label for="edit_user_display_id">User Display ID:</label>
                    <input type="text" id="edit_user_display_id" value="${user.userDisplayId}" required />
                    <label for="edit_user_name">User Name:</label>
                    <input type="text" id="edit_user_name" value="${user.userName}" required />
                    <label for="edit_user_contact_number">Contact Number:</label>
                    <input type="text" id="edit_user_contact_number" value="${user.userContactNumber || ''}" />
                    <label for="edit_user_email">Email:</label>
                    <input type="email" id="edit_user_email" value="${user.userEmail}" required />
                    <label for="edit_supervisor_id">Supervisor:</label>
				    <select id="edit_supervisor_id" name="supervisorId"></select>
				    <label for="edit_location_id">Location:</label>
				    <select id="edit_location_id" name="locationId"></select>
                    <label for="edit_user_admin">Is Admin:</label>
                    <input type="checkbox" id="edit_user_admin" ${user.userAdmin ? 'checked' : ''} />
                    <label for="edit_user_auth">Password (Admins Only):</label>
                    <input type="password" id="edit_user_auth" placeholder="Only required for Admin users" />
                    <button type="submit">Save User</button>
                </form>
            `

			await populateDropdown('/users/all', 'edit_supervisor_id', 'userId', 'userName', user.supervisorId)
			await populateDropdown('/misc/locations', 'edit_location_id', 'locationId', 'locationName', user.locationId)

			document.getElementById('edit-user-form').addEventListener('submit', async (e) => {
				e.preventDefault()

				const updatedUserDetails = {
					userDisplayId: document.getElementById('edit_user_display_id').value,
					userName: document.getElementById('edit_user_name').value,
					userContactNumber: document.getElementById('edit_user_contact_number').value,
					userEmail: document.getElementById('edit_user_email').value,
					supervisorId: document.getElementById('edit_supervisor_id').value,
					locationId: document.getElementById('edit_location_id').value,
					userAdmin: document.getElementById('edit_user_admin').checked,
					userAuth: document.getElementById('edit_user_auth').value,
				}

				try {
					const response = await fetch(`/users/edit/${user.userId}`, {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(updatedUserDetails),
					})

					const data = await response.json()
					alert(data.message || 'User updated successfully!')
				} catch (error) {
					console.error('Error updating user:', error)
					alert('Error updating user.')
				}
			})
		} catch (error) {
			console.error('Error fetching user:', error)
			alert('Error fetching user.')
		}
	})

	// Delete User
	document.getElementById('delete-user-btn').addEventListener('click', async () => {
		const displayId = prompt('Enter the User Display ID to delete:')
		if (!displayId) {
			alert('User Display ID is required.')
			return
		}

		try {
			const response = await fetch(`/users/${displayId}`)
			const data = await response.json()

			if (!data.user) {
				alert(data.message || 'User not found.')
				return
			}

			const confirmDelete = confirm(`Are you sure you want to delete the user "${data.user.userName}" (${data.user.userDisplayId})?`)
			if (!confirmDelete) return

			try {
				const deleteResponse = await fetch(`/users/delete/${data.user.userId}`, {
					method: 'DELETE',
					headers: { 'Content-Type': 'application/json' },
				})

				const deleteData = await deleteResponse.json()
				alert(deleteData.message || 'User deleted successfully!')
			} catch (error) {
				console.error('Error deleting user:', error)
				alert('Error deleting user.')
			}
		} catch (error) {
			console.error('Error fetching user:', error)
			alert('Error fetching user.')
		}
	})
})
