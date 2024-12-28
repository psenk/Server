document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname
    const dropdownButton = document.getElementById('checkout-dropdown')
    const dropdownContent = document.getElementById('checkout-dropdown-content')
    const checkoutLink = document.getElementById('checkout-link')

    if (currentPage.includes('/checkout')) {
        dropdownButton.innerHtml = `Checkout\n<img src="/images/caret_down.png" alt="Dropdown">`
        checkoutLink.innerText = 'Checkin'
        checkoutLink.href = '/checkin'
    } else if (currentPage.includes('/checkin')) {
        dropdownButton.innerHtml = `Checkin\n<img src="/images/caret_down.png" alt="Dropdown">`
        checkoutLink.innerText = 'Checkout'
        checkoutLink.href = '/checkout'
    }
})