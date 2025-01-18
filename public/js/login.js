document.querySelector('#login').addEventListener('submit', async (e) => {
	e.preventDefault()

	// clear stale cookies
	document.cookie = 'token=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=None'

	const username = document.querySelector('#username').value
	const password = document.querySelector('#password').value

	if (!username || !password) {
		alert('Username and password are required')
		return
	}

	try {
		// send to spring
		const response = await fetch(`https://capstone-tms-app.fly.dev/auth/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, password }),
			credentials: 'include',
		})

		if (response.ok) {
			window.location.replace('/checkout')
		} else {
			const error = await response.text()
			alert(`Login failed: ${error}`)
		}
	} catch (error) {
		console.error('Error occured during login: ', error)
		alert('An unexpected error has occured.  Please try again later.')
	}
})
