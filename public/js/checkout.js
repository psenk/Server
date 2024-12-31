let checkoutToken = null

// checkout/checkin dropdown
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname
    const dropdownButton = document.getElementById('checkout-dropdown')
    const dropdownContent = document.getElementById('checkout-dropdown-content')

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

async function fetchUserInfo(userId) {
    // fetch user data
    try {
		const response = await fetch(`checkout/user?user_display_id=${encodeURIComponent(userId)}`)
		const data = await response.json()
        if (response.ok) {
            const userInfoSection = document.getElementById('user-info')
            userInfoSection.innerHTML = `
            <p><strong>Name:</strong> ${data.user.user_name}</p>
            <p><strong>Contact Number:</strong> ${data.user.user_contact_number}</p>
            <p><strong>Email:</strong> ${data.user.user_email}</p>
            <p><strong>Supervisor:</strong> ${data.user.supervisor_id}</p>
            <p><strong>Location:</strong> ${data.user.location_id}</p>`
        } else {
            alert(data.message || 'Error fetching user info')
        }
    } catch (error) {
        alert(data.message || 'Error fetching user info')
    }
}

// user id submission
document.getElementById('user-id-form').addEventListener('submit', async function (e) {
	e.preventDefault()

	const userIdInput = document.getElementById('user-id')
	const userId = userIdInput.value

	// fetch token
	try {
		const response = await fetch(`checkout/user?user_display_id=${encodeURIComponent(userId)}`)
		const data = await response.json()
		if (response.ok) {
			checkoutToken = data.checkoutToken
            
			document.getElementById('tool-id-section').style.display = 'block'
			document.getElementById('user-submit-btn').style.visibility = 'hidden'
            document.getElementById('checked-out-tools-label').style.display = 'block'

            fetchUserInfo(userId)
		} else {
			alert(data.message || 'Error starting checkout session')
		}
	} catch (error) {
        console.error(error)
		alert('An error has occured.  Please try again.')
	}
})

// tool id submission
document.getElementById('tool-id-form').addEventListener('submit', async function (e) {
    e.preventDefault()

    const toolIdInput = document.getElementById('tool-id')
    const toolId = toolIdInput.value

    if (!checkoutToken) {
        alert('No active checkout session.  Please input a User ID first.')
        return
    }

    try {
        const response = await fetch('/checkout/tool', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ checkoutToken, toolId }),
        })
        const data = await response.json()

        if (response.ok) {
            
        } else {
            alert(data.message || 'Error checking out tool.')
        }
    } catch (error) {
        alert('An error has occured.  Please try again.')
    }
})