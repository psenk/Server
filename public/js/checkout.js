let checkoutToken = null

// checkout/checkin dropdown
document.addEventListener('DOMContentLoaded', () => {
	const currentPage = window.location.pathname
	const dropdownButton = document.getElementById('checkout-dropdown')
	const dropdownContent = document.getElementById('checkout-dropdown-content')

	if (currentPage.includes('/checkout')) {
		dropdownButton.innerHTML = `Checkout <img src="/images/caret_down.png" alt="Dropdown">` // Corrected innerHTML
		dropdownContent.innerHTML = `<a href="/checkin">Checkin</a>` // Correctly update dropdown content
		dropdownButton.setAttribute('href', '/checkout') // Update href correctly
	} else if (currentPage.includes('/checkin')) {
		dropdownButton.innerHTML = `Checkin <img src="/images/caret_down.png" alt="Dropdown">` // Corrected innerHTML
		dropdownContent.innerHTML = `<a href="/checkout">Checkout</a>` // Correctly update dropdown content
		dropdownButton.setAttribute('href', '/checkin') // Update href correctly
	}
})

// user id submission
document.getElementById('user-id-form').addEventListener('submit', async function (e) {
	e.preventDefault()

	const userDisplayId = document.getElementById('user-id').value

	// fetch token
	try {
		const response = await fetch('/checkout/start', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ userDisplayId }),
		})
		const data = await response.json()

		if (response.ok) {
			checkoutToken = data.checkoutToken
			tools = data.checkedOutTools

			document.getElementById('tool-code-section').style.display = 'block'
			document.getElementById('user-submit-btn').style.visibility = 'hidden'
			document.getElementById('checked-out-tools-label').style.display = 'block'

			fetchUserInfo(userDisplayId)
			updateCheckedOutTools(tools)
		} else {
			alert(data.message || 'Error starting checkout session')
		}
	} catch (error) {
		alert('An error has occured.  Please try again.')
	}
})

// tool code submission
document.getElementById('tool-code-form').addEventListener('submit', async function (e) {
	e.preventDefault()

	const toolCode = document.getElementById('tool-code').value
	const userDisplayId = document.getElementById('user-id').value

	if (!checkoutToken) {
		alert('No active checkout session.  Please input a User ID first.')
		return
	}

	try {
		const response = await fetch(`/checkout/tool/${toolCode}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ checkoutToken, userDisplayId }),
		})

		if (!response.ok) {
			const errorData = await response.json()
			alert(errorData.message || 'Error checking out tool.')
			return
		}

		const data = await response.json()

		if (data.checkedOutTools) {
			updateCheckedOutTools(data.checkedOutTools)
		} else {
			console.warn('No tools checked out')
		}
	} catch (error) {
		console.error('Error checking out tool:', error)
		alert(`Error checking out tool: ${error}`)
	}
})

async function fetchUserInfo(userDisplayId) {
	try {
		const response = await fetch(`/users/${userDisplayId}`)
		const data = await response.json()

		if (response.ok) {
			const userInfoSection = document.getElementById('user-info')
			const user = data.user

			userInfoSection.innerHTML = `
            <p><strong>Name:</strong> ${user.userName}</p>
            <p><strong>Contact Number:</strong> ${user.userContactNumber}</p>
            <p><strong>Email:</strong> ${user.userEmail}</p>
            <p><strong>Supervisor:</strong> ${user.supervisorName || 'N/A'}</p>
            <p><strong>Location:</strong> ${user.locationName || 'N/A'}</p>`
		} else {
			alert(data.message || 'Error fetching user info')
		}
	} catch (error) {
		alert(data.message || 'Error fetching user info')
	}
}

function updateCheckedOutTools(tools) {
	const toolsList = document.getElementById('checked-out-tools')
	toolsList.innerHTML = ''

	tools.forEach((tool) => {
		const listItem = document.createElement('li')
		listItem.textContent = `${tool.toolCode}: ${tool.toolName}`
		toolsList.appendChild(listItem)
	})
}
