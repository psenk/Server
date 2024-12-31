document.addEventListener('DOMContentLoaded', () => {
    const createNewToolBtn = document.getElementById('create-new-tool-btn');
    const newToolForm = document.getElementById('new-item-form');
    const userInfoSection = document.getElementById('user-info');

    createNewToolBtn.addEventListener('click', () => {     
        newToolForm.style.display = 'block';
    });
});