document.addEventListener('DOMContentLoaded', () => {
    const detailsContent = document.getElementById('details-content');

    // Create User
    document.getElementById('create-user-btn').addEventListener('click', () => {
        detailsContent.style.display = 'block';
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
                <label for="user_supervisor_id">Supervisor ID:</label>
                <input type="number" id="user_supervisor_id" name="userSupervisorId" />
                <label for="user_location_id">Location ID:</label>
                <input type="number" id="user_location_id" name="userLocationId" />
                <label for="user_admin">Admin?</label>
                <input type="checkbox" id="user_admin" name="userAdmin" />
                <label for="user_auth">Password (Admins Only):</label>
                <input type="password" id="user_auth" name="userAuth" />
                <button type="submit">Create User</button>
            </form>
        `;

        document.getElementById('create-user-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const userDetails = {
                userDisplayId: document.getElementById('user_display_id').value,
                userName: document.getElementById('user_name').value,
                userContactNumber: document.getElementById('user_contact_number').value,
                userEmail: document.getElementById('user_email').value,
                userSupervisorId: document.getElementById('user_supervisor_id').value,
                userLocationId: document.getElementById('user_location_id').value,
                userAdmin: document.getElementById('user_admin').checked,
                userAuth: document.getElementById('user_auth').value,
            };

            try {
                const response = await fetch('/users/new', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userDetails),
                });

                const data = await response.json();
                alert(data.message || 'User created successfully!');
            } catch (error) {
                console.error('Error creating user:', error);
                alert('Error creating user.');
            }
        });
    });

    // Edit User
    document.getElementById('edit-user-btn').addEventListener('click', async () => {
        const displayId = prompt('Enter the User Display ID to edit:');
        if (!displayId) {
            alert('User Display ID is required.');
            return;
        }

        try {
            const response = await fetch(`/users/${displayId}`);
            const data = await response.json();

            if (!data.user) {
                alert(data.message || 'User not found.');
                return;
            }

            const user = data.user;

            detailsContent.style.display = 'block';
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
                    <label for="edit_user_supervisor_id">Supervisor ID:</label>
                    <input type="number" id="edit_user_supervisor_id" value="${user.supervisorId || ''}" />
                    <label for="edit_user_location_id">Location ID:</label>
                    <input type="number" id="edit_user_location_id" value="${user.locationId || ''}" />
                    <label for="edit_user_admin">Is Admin:</label>
                    <input type="checkbox" id="edit_user_admin" ${user.userAdmin ? 'checked' : ''} />
                    <label for="edit_user_auth">Password (Admins Only):</label>
                    <input type="password" id="edit_user_auth" placeholder="Leave blank to keep unchanged" />
                    <button type="submit">Save User</button>
                </form>
            `;

            document.getElementById('edit-user-form').addEventListener('submit', async (e) => {
                e.preventDefault();

                const updatedUserDetails = {
                    userDisplayId: document.getElementById('edit_user_display_id').value,
                    userName: document.getElementById('edit_user_name').value,
                    userContactNumber: document.getElementById('edit_user_contact_number').value,
                    userEmail: document.getElementById('edit_user_email').value,
                    userSupervisorId: document.getElementById('edit_user_supervisor_id').value,
                    userLocationId: document.getElementById('edit_user_location_id').value,
                    userAdmin: document.getElementById('edit_user_admin').checked,
                    userAuth: document.getElementById('edit_user_auth').value || undefined,
                };

                try {
                    const response = await fetch(`/users/edit/${user.userId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updatedUserDetails),
                    });

                    const data = await response.json();
                    alert(data.message || 'User updated successfully!');
                } catch (error) {
                    console.error('Error updating user:', error);
                    alert('Error updating user.');
                }
            });
        } catch (error) {
            console.error('Error fetching user:', error);
            alert('Error fetching user.');
        }
    });

    // Delete User
    document.getElementById('delete-user-btn').addEventListener('click', async () => {
        const displayId = prompt('Enter the User Display ID to delete:');
        if (!displayId) {
            alert('User Display ID is required.');
            return;
        }

        try {
            const response = await fetch(`/users/${displayId}`);
            const data = await response.json();

            if (!data.user) {
                alert(data.message || 'User not found.');
                return;
            }

            const confirmDelete = confirm(`Are you sure you want to delete the user "${data.user.userName}" (${data.user.userDisplayId})?`);
            if (!confirmDelete) return;

            try {
                const deleteResponse = await fetch(`/users/delete/${data.user.userId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                });

                const deleteData = await deleteResponse.json();
                alert(deleteData.message || 'User deleted successfully!');
            } catch (error) {
                console.error('Error deleting user:', error);
                alert('Error deleting user.');
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            alert('Error fetching user.');
        }
    });
});
