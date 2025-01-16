document.addEventListener('DOMContentLoaded', () => {
	const form = document.getElementById('ticket-form')

	form.addEventListener('submit', async (e) => {
		e.preventDefault()

		const subject = document.getElementById('subject').value
		const contactNumber = document.getElementById('contact_number').value
		const emailAddress = document.getElementById('email_address').value
		const location = document.getElementById('location').value
		const description = document.getElementById('description').value

		const ticketDetails = `
            Subject: ${subject}
            Contact Number: ${contactNumber}
            Email Address: ${emailAddress}
            Location: ${location}
            Description:
            ${description}
        `

		try {
			await fetch('/send-email', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					to: 'tmtesterton@gmail.com',
					subject: 'New Support Ticket',
					body: ticketDetails,
				}),
			})

			alert('Ticket submitted successfully!')
			form.reset()
		} catch (error) {
			console.error('Error submitting ticket:', error)
			alert('There was an error submitting your ticket. Please try again.')
		}
	})
})

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
