function formatDate(dateString) {
	if (!dateString) return 'N/A'
	const date = new Date(dateString)
	return new Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
	}).format(date)
}

document.addEventListener('DOMContentLoaded', () => {
	const searchBtn = document.getElementById('search-btn')
	const searchType = document.getElementById('search-type')
	const searchQuery = document.getElementById('search-query')
	const searchResults = document.getElementById('search-results')

	searchBtn.addEventListener('click', async () => {
		const type = searchType.value
		const query = searchQuery.value.trim()

		if (!query) {
			alert('Please enter a search query.')
			return
		}

		try {
			// send to spring
			const response = await fetch(`https://capstone-tms-app.fly.dev/find?type=${type}&query=${query}`, {
				credentials: 'include',
			})

			if (!response.ok) {
				const error = await response.text()
				alert(`Search failed: ${error}`)
				return
			}

			const results = await response.json()
			if (results.length) {
				searchResults.innerHTML = results
					.map((item) => {
						switch (type.toLowerCase()) {
							case 'tool':
								return `
                                <div class="result-item">
                                    <h3>Tool Name: ${item.toolName}</h3>
                                    <p>Code: ${item.toolCode}</p>
                                    <p>Checked Out: ${item.toolCheckedOut}</p>
                                    <p>Status: ${item.toolStatus}</p>
                                    <p>Manufacturer: ${item.toolManufacturer}</p>
                                    <p>Date Created: ${formatDate(item.toolDateCreated)}</p>
                                    <p>Date Updated: ${formatDate(item.toolDateUpdated)}</p>
                                </div>
                            `
							case 'user':
								return `
                                <div class="result-item">
                                    <h3>User Name: ${item.userName}</h3>
                                    <p>Display ID: ${item.userDisplayId}</p>
                                    <p>Contact: ${item.userContactNumber}</p>
                                    <p>Email: ${item.userEmail}</p>
                                    <p>Supervisor: ${item.userSupervisor}</p>
                                    <p>Date Created: ${formatDate(item.userDateCreated)}</p>
                                    <p>Date Updated: ${formatDate(item.userDateUpdated)}</p>
                                </div>
                            `
							case 'checkout':
								return `
                                <div class="result-item">
                                    <h3>Checkout</h3>
                                    <p>Tool: ${item.checkoutTool}</p>
                                    <p>User: ${item.checkoutUser}</p>
                                    <p>Date Out: ${formatDate(item.checkoutDateOut)}</p>
                                    <p>Date In: ${formatDate(item.checkoutDateIn) || 'Not returned yet'}</p>
                                </div>
                            `
							case 'other':
								return `
                                <div class="result-item">
                                    <h3>Manufacturer Name: ${item.manufacturerName}</h3>
                                    <p>Contact: ${item.manufacturerContactNumber}</p>
                                    <p>Email: ${item.manufacturerEmail}</p>
                                </div>
                            `
							default:
								return `<p class="error">Invalid result type.</p>`
						}
					})
					.join('')
			} else {
				searchResults.innerHTML = '<br><p>No results found.</p>'
			}
		} catch (error) {
			console.error('Error fetching search results:', error)
			alert('An error occurred while searching. Please try again.')
		}
	})
})

document.getElementById('logout-btn').addEventListener('click', async function (e) {
	e.preventDefault()

	try {
		const response = await fetch('https://capstone-tms-app.fly.dev/auth/logout', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			credentials: 'include',
		})

		if (response.ok) {
			window.location.replace('/')
		} else {
			const error = await response.json()
			alert(`Failed to log out: ${error.message || 'Unknown error'}`)
		}
	} catch (error) {
		console.error('Error during logout:', error)
		alert('An unexpected error occurred. Please try again.')
	}
})
