document.querySelector('#login').addEventListener('submit', async (e) => {
	e.preventDefault()

	const username = document.querySelector('#username').value
	const password = document.querySelector('#password').value

	try {
		const response = await fetch('/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, password }),
			credentials: 'include',
		})

		if (response.ok) {
			window.location.href = `/checkout`
		} else {
			const error = await response.text()
			alert(`Login failed: ${error}`)
		}
	} catch (error) {
		console.error('Error occured during login: ', error)
		alert('An unexpected error has occured.  Please try again later.')
	}
})
