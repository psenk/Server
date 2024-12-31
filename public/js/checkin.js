document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname
    const dropdownButton = document.getElementById('checkout-dropdown')
    const dropdownContent = document.getElementById('checkout-dropdown-content')
    const checkoutLink = document.getElementById('checkout-link')

    if (currentPage.includes('/checkout')) {
        dropdownButton.innerHTML = `Checkout <img src="/images/caret_down.png" alt="Dropdown">`; // Corrected innerHTML
        dropdownContent.innerHTML = `<a href="/checkin">Checkin</a>`; // Correctly update dropdown content
        dropdownButton.setAttribute('href', '/checkout'); // Update href correctly
    } else if (currentPage.includes('/checkin')) {
        dropdownButton.innerHTML = `Checkin <img src="/images/caret_down.png" alt="Dropdown">`; // Corrected innerHTML
        dropdownContent.innerHTML = `<a href="/checkout">Checkout</a>`; // Correctly update dropdown content
        dropdownButton.setAttribute('href', '/checkin'); // Update href correctly
    }
})