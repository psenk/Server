document.addEventListener('DOMContentLoaded', () => {
    const createNewUserBtn = document.getElementById('create-new-user-btn');
    const newUserForm = document.getElementById('new-item-form');
    const userInfoSection = document.getElementById('user-info');

    createNewUserBtn.addEventListener('click', () => {     
        newUserForm.style.display = 'block';
    });
});