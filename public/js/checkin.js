let checkoutToken = null

// checkout/checkin dropdown
document.addEventListener('DOMContentLoaded', () => {
	const currentPage = window.location.pathname
	const dropdownButton = document.getElementById('checkout-dropdown')
	const dropdownContent = document.getElementById('checkout-dropdown-content')

	if (currentPage.includes('/checkout')) {
		dropdownButton.innerHTML = `Checkout <img src="/images/caret_down.png" alt="Dropdown">`
		dropdownContent.innerHTML = `<a href="/checkin">Checkin</a>`
		dropdownButton.setAttribute('href', '/checkout')
	} else if (currentPage.includes('/checkin')) {
		dropdownButton.innerHTML = `Checkin <img src="/images/caret_down.png" alt="Dropdown">`
		dropdownContent.innerHTML = `<a href="/checkout">Checkout</a>`
		dropdownButton.setAttribute('href', '/checkin')
	}
})

// start checkout session
document.getElementById('checkout-session-form').addEventListener('submit', async function (e) {
	e.preventDefault()

	const userDisplayId = document.getElementById('user-id').value

	try {
		const response = await fetch('/checkout/start', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({ userDisplayId }),
		})
		const data = await response.json()

		if (response.ok) {
			checkoutToken = data.checkoutToken
			tools = data.checkedOutTools

			document.getElementById('tool-in-section').style.display = 'block'
			document.getElementById('end-session-section').style.display = 'block'
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

// end checkout session
document.getElementById('end-session-form').addEventListener('submit', async function (e) {
	e.preventDefault()

	if (!checkoutToken) {
		alert('No active checkout session to end.')
		return
	}

	try {
		const response = await fetch('/checkout/end', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({ checkoutToken }),
		})

		if (response.ok) {
			const data = await response.json()
			alert(data.message)

			checkoutToken = null
			document.getElementById('checkout-session-form').reset()
			document.getElementById('tool-in-section').style.display = 'none'
			document.getElementById('end-session-section').style.display = 'none'
			document.getElementById('checked-out-tools').innerHTML = ''
			document.getElementById('user-info').innerHTML = ''
			document.getElementById('user-submit-btn').style.visibility = 'visible'
			document.getElementById('checked-out-tools-label').style.display = 'none'
		} else {
			const errorData = await response.json()
			alert(errorData.message || 'Error ending checkout session.')
		}
	} catch (error) {
		console.error('Error ending checkout session:', error)
		alert('An error occurred. Please try again.')
	}
})

// checkin tool
document.getElementById('tool-in-form').addEventListener('submit', async function (e) {
	e.preventDefault()

	const toolCode = document.getElementById('tool-code').value

	if (!toolCode) {
		alert('Please provide a valid Tool Code.')
		return
	}

	if (!checkoutToken) {
		alert('No active checkout session. Please log in and try again.')
		return
	}

	try {
		const response = await fetch(`/checkout/tool/in/${toolCode}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({ checkoutToken }),
		})

		if (response.ok) {
			const data = await response.json()

			if (Array.isArray(data.checkedOutTools) && data.checkedOutTools.length > 0) {
				updateCheckedOutTools(data.checkedOutTools)
			} else {
				console.warn('No tools checked out')
				updateCheckedOutTools([])
			}
		} else {
			const errorData = await response.json()
			if (response.status === 400) {
				alert(errorData.message || 'Checkout token is required.')
			} else if (response.status === 401) {
				alert(errorData.message || 'Invalid checkout session token.')
			} else if (response.status === 404) {
				alert(errorData.message || 'Tool or User not found or invalid checkout information.')
			} else if (response.status === 409) {
				alert(errorData.message || 'Tool has already been checked in or is not checked out.')
			} else {
				alert(errorData.message || 'Internal server error.')
			}
		}
	} catch (error) {
		console.error('Error checking in tool:', error)
		alert(`Error checking in tool: ${error}`)
	}
})

async function fetchUserInfo(userDisplayId) {
	try {
		const response = await fetch(`/users/${userDisplayId}`, { credentials: 'include' })
		const data = await response.json()

		if (response.ok) {
			const userInfoSection = document.getElementById('user-info')
			const user = data.user

			userInfoSection.innerHTML = `
            <p><strong>Name:</strong> ${user.userName}</p>
            <p><strong>Contact Number:</strong> ${user.userContactNumber}</p>
            <p><strong>Email:</strong> ${user.userEmail}</p>
            <p><strong>Supervisor:</strong> ${user.supervisorName || 'N/A'}</p>`
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

	if (tools.length === 0) {
		const noToolsMessage = document.createElement('p')
		noToolsMessage.textContent = 'No tools are currently checked out.'
		toolsList.appendChild(noToolsMessage)
		return
	}

	tools.forEach((tool) => {
		const listItem = document.createElement('li')
		listItem.textContent = `${tool.toolCode}: ${tool.toolName}`
		toolsList.appendChild(listItem)
	})
}

document.getElementById('logout-btn').addEventListener('click', function (e) {
	e.preventDefault()

	fetch('/auth/logout', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		credentials: 'include',
	})
		.then((response) => {
			if (response.ok) {
				window.location.href = '/'
			} else {
				alert('Failed to log out. Please try again.')
			}
		})
		.catch((error) => {
			console.error('Error during logout:', error)
		})
})
