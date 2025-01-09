// variables
const express = require('express')
require('dotenv').config()
const { Pool } = require('pg')
const axios = require('axios')
const nodemailer = require('nodemailer')
let checkoutToken = null

const app = express()
const PORT = 3000

// database connection
const pool = new Pool({
	user: process.env.DB_USER,
	host: process.env.DB_HOST,
	database: process.env.DB_NAME,
	password: process.env.DB_PASSWORD,
	port: process.env.DB_PORT,
})

// parse JSON/form data
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// serve static files
app.use(express.static('public'))

// serve login page
app.get('/', (req, res) => {
	res.sendFile(__dirname + '/public/login.html')
})

// authentication route
app.post('/auth/login', async (req, res) => {
	const { username, password } = req.body

	if (!username || !password) {
		res.status(400).send('Username and password are required')
		return
	}

	try {
		const response = await axios.post('http://localhost:8080/auth/login', {
			username,
			password,
		})

		if (response.status === 200) {
			res.redirect('/checkout')
		}
	} catch (error) {
		console.error('Error code: ', error.response.status)

		if (error.response && error.response.status) {
			if (error.response.status === 401) {
				res.status(401).send(error.response.data.message)
			} else if (error.response.status === 400) {
				res.status(400).send(error.response.data.message)
			} else {
				res.status(500).send('Internal server error')
			}
		} else {
			res.status(500).send('Internal server error')
		}
	}
})

// checkouts
// start checkout session
app.post('/checkout/start', async (req, res) => {
	const { userDisplayId } = req.body

	try {
		const response = await axios.post('http://localhost:8080/checkout/start', {
			userDisplayId,
		})

		if (response.status === 200) {
			const { user, checkoutToken, checkedOutTools } = response.data
			res.json({ message: 'Checkout session started', user, checkoutToken, checkedOutTools })
		} else {
			res.status(response.status).send(response.data.message || 'Error starting checkout session')
		}
	} catch (error) {
		if (error.response) {
			if (error.response.status === 404) {
				res.status(404).send('User not found')
			} else if (error.response.status === 400) {
				res.status(400).send('Invalid or missing parameters')
			} else {
				console.error(error)
				res.status(500).send('Internal server error')
			}
		} else {
			console.error(error)
			res.status(500).send('Internal server error')
		}
	}
})

// end checkout session
app.post('/checkout/end', async (req, res) => {
	const { checkoutToken } = req.body

	try {
		const response = await axios.post('http://localhost:8080/checkout/end', {
			checkoutToken,
		})

		if (response.status === 200) {
			res.json({ message: response.data.message })
		} else {
			res.status(response.status).send(response.data.message || 'Error ending checkout session')
		}
	} catch (error) {
		if (error.response) {
			if (error.response.status === 400) {
				res.status(404).send('Invalid checkout session token')
			} else if (error.response.status === 400) {
				res.status(400).send('Checkout token is required')
			} else {
				res.status(500).send('Internal server error')
			}
		} else {
			res.status(500).send('Internal server error')
		}
	}
})

// checkout tool
app.post('/checkout/tool/out/:toolCode', async (req, res) => {
	const { toolCode } = req.params
	const { checkoutToken, userDisplayId } = req.body

	try {
		// send to spring
		const response = await axios.post(`http://localhost:8080/checkout/tool/out/${toolCode}`, {
			checkoutToken,
			userDisplayId,
		})

		const { checkout, checkedOutTools } = response.data

		// send to client
		res.json({ message: 'Checkout completed', checkout, checkedOutTools })
	} catch (error) {
		if (error.response) {
			if (error.response.status === 400) {
				res.status(400).send({ message: 'Tool not found' })
			} else if (error.response.status === 403) {
				res.status(403).send({ message: 'Tool is already checked out' })
			} else if (error.response.status === 406) {
				res.status(406).send({ message: 'Tool is not available for checkout' })
			} else {
				res.status(500).send({ message: 'Internal server error' })
			}
		} else {
			res.status(500).send('Internal server error')
		}
	}
})

// checkin tool
app.post('/checkout/tool/in/:toolCode', async (req, res) => {
	const { toolCode } = req.params

	try {
		const response = await axios.post(`http://localhost:8080/checkout/tool/in/${toolCode}`)

		if (response.status === 200) {
			const { tool, checkout } = response.data
			res.json({ message: response.data.message, tool, checkout })
		} else {
			res.status(response.status).send(response.data.message || 'Error checking in tool')
		}
	} catch (error) {
		if (error.response) {
			if (error.response.status === 400) {
				res.status(400).send({ message: 'Checkout ID is required' })
			} else if (error.response.status === 404) {
				res.status(404).send({ message: 'Invalid checkout ID or tool code' })
			} else if (error.response.status === 409) {
				res.status(409).send({ message: 'Tool is already checked in' })
			} else {
				console.error(error)
				res.status(500).send({ message: 'Internal server error' })
			}
		} else {
			console.error(error)
			res.status(500).send('Internal server error')
		}
	}
})

// tools
// get all tools
app.get('/tools/all', async (req, res) => {
	try {
		// send to spring
		const response = await axios.get('http://localhost:8080/tools/all')

		res.json(response.data)
	} catch (error) {
		if (error.response) {
			console.error('Error response from server:', error.response.data)
			res.status(error.response.status).send(error.response.data.message || 'Error fetching tools')
		} else {
			console.error('Unexpected error:', error)
			res.status(500).send('Internal server error')
		}
	}
})

// get specific tool
app.get('/tools/:toolCode', async (req, res) => {
	const { toolCode } = req.params

	try {
		// send to spring
		const response = await axios.get(`http://localhost:8080/tools/${toolCode}`)

		res.json(response.data)
	} catch (error) {
		if (error.response) {
			console.error('Error response from server:', error.response.data)
			res.status(error.response.status).send(error.response.data.message || 'Error fetching tool')
		} else {
			console.error('Unexpected error:', error)
			res.status(500).send('Internal server error')
		}
	}
})

// create new tool
app.post('/tools/new', async (req, res) => {
	const { toolName, toolImageUrl = null, toolCode, manufacturerId = null, locationId = null } = req.body

	if (!toolName || !toolCode) {
		return res.status(400).send('All require fields must be provided.')
	}

	if (toolCode.length != 9) {
		res.status(400).send('Tool codes can only be nine characters in length.')
		return
	}

	try {
		// send to spring
		const response = await axios.post('http://localhost:8080/tools/new', {
			toolName,
			toolImageUrl,
			toolCode,
			manufacturerId,
			locationId,
		})

		res.json(response.data)
	} catch (error) {
		if (error.response) {
			console.error('Error response from server:', error.response.data)
			res.status(error.response.status).send(error.response.data.message || 'Error creating tool')
		} else {
			console.error('Unexpected error:', error)
			res.status(500).send('Internal server error')
		}
	}
})

// edit tool
app.put('/tools/edit/:toolId', async (req, res) => {
	const { toolId } = req.params
	const { toolName, toolImageUrl = null, toolCode, manufacturerId = null, locationId = null } = req.body

	try {
		// send to spring
		const response = await axios.put(`http://localhost:8080/tools/edit/${toolId}`, {
			toolName,
			toolImageUrl,
			toolCode,
			manufacturerId,
			locationId,
		})

		res.json(response.data)
	} catch (error) {
		console.error('Error editing tool:', error)
		res.status(500).send('Error editing tool')
	}
})

// delete tool
app.delete('/tools/delete/:toolId', async (req, res) => {
	const { toolId } = req.params

	try {
		// send to spring
		const response = await axios.delete(`http://localhost:8080/tools/delete/${toolId}`)

		res.json(response.data)
	} catch (error) {
		console.error('Error deleting tool:', error)
		res.status(500).send('Error deleting tool')
	}
})

// users
// get all users
app.get('/users/all', async (req, res) => {
	try {
		// send to spring
		const response = await axios.get('http://localhost:8080/users/all')

		// send to client
		res.json(response.data)
	} catch (error) {
		if (error.response) {
			const { status, data } = error.response
			console.error('Error response from server:', data)
			res.status(status).send(data.message || 'Error fetching users.')
		} else {
			console.error('Unexpected error:', error)
			res.status(500).send({ message: 'Internal server error occurred while fetching users.' })
		}
	}
})

// get specific user
app.get('/users/:displayId', async (req, res) => {
	const { displayId } = req.params

	try {
		// send to spring
		const response = await axios.get(`http://localhost:8080/users/${displayId}`)

		// send to client
		res.json(response.data)
	} catch (error) {
		if (error.response) {
			const { status, data } = error.response
			console.error('Error response from server:', data)
			res.status(status).send(data.message || 'Error fetching user.')
		} else {
			console.error('Unexpected error:', error)
			res.status(500).send({ message: 'Internal server error occurred while fetching user.' })
		}
	}
})

// create new user
app.post('/users/new', async (req, res) => {
	const { userDisplayId, userName, userContactNumber, userEmail, supervisorId = null, locationId = null, userAdmin = false, userAuth = null } = req.body

	// admin specific checks
	if (userAdmin && (!userAuth || userAuth.trim() === '')) {
		res.status(406).send({ message: 'Admin users require a password.' })
		return
	}

	try {
		// send to spring
		const response = await axios.post('http://localhost:8080/users/new', {
			userDisplayId,
			userName,
			userContactNumber,
			userEmail,
			supervisorId,
			locationId,
			userAdmin,
			userAuth,
		})

		// send to client
		res.json(response.data)
	} catch (error) {
		console.error('Error creating user:', error)

		if (error.response) {
			const { status, data } = error.response

			if (status === 400 || status === 406 || status === 409) {
				res.status(status).send(data)
			} else {
				res.status(500).send({ message: 'An internal server error occurred while creating the user.' })
			}
		} else {
			res.status(500).send({ message: 'Unexpected error occurred while creating user.' })
		}
	}
})

// edit user
app.put('/users/edit/:userId', async (req, res) => {
	const { userId } = req.params
	const { userDisplayId, userName, userContactNumber, userEmail, supervisorId = null, locationId = null, userAdmin = false, userAuth = null } = req.body

	// admin specific checks
	if (userAdmin && (!userAuth || userAuth.trim() === '')) {
		res.status(406).send({ message: 'Admin users require a password.' })
		return
	}

	try {
		// send to spring
		const response = await axios.put(`http://localhost:8080/users/edit/${userId}`, {
			userDisplayId,
			userName,
			userContactNumber,
			userEmail,
			supervisorId,
			locationId,
			userAdmin,
			userAuth,
		})

		// send to client
		res.json(response.data)
	} catch (error) {
		console.error('Error editing user:', error)

		if (error.response) {
			const { status, data } = error.response

			if (status === 400 || status === 406 || status === 409) {
				res.status(status).send(data)
			} else {
				res.status(500).send({ message: 'An internal server error occurred while editing the user.' })
			}
		} else {
			res.status(500).send({ message: 'Unexpected error occurred while editing user.' })
		}
	}
})

// delete user
app.delete('/users/delete/:userId', async (req, res) => {
	const { userId } = req.params

	try {
		// send to spring
		const response = await axios.delete(`http://localhost:8080/users/delete/${userId}`)

		// send to client
		res.json(response.data)
	} catch (error) {
		console.error('Error deleting user:', error)

		if (error.response) {
			const { status, data } = error.response

			if (status === 404) {
				res.status(404).send(data || { message: `User with ID ${userId} not found.` })
			} else {
				res.status(500).send(data || { message: 'An internal server error occurred while deleting the user.' })
			}
		} else {
			res.status(500).send({ message: 'Unexpected error occurred while deleting the user.' })
		}
	}
})

// locations
// get locations
app.get('/misc/locations', async (req, res) => {
	try {
		const response = await axios.get('http://localhost:8080/misc/locations')

		res.json(response.data)
	} catch (error) {
		if (error.response) {
			console.error('Error response from server:', error.response.data)
			res.status(error.response.status).send(error.response.data.message || 'Error fetching locations')
		} else {
			console.error('Unexpected error:', error)
			res.status(500).send('Internal server error')
		}
	}
})

// create new location
app.post('/misc/locations/new', async (req, res) => {
	const { locationName } = req.body

	try {
		// send to spring
		const response = await axios.post('http://localhost:8080/misc/locations/new', {
			locationName,
		})

		res.json(response.data)
	} catch (error) {
		console.error('Error creating location:', error)
		res.status(500).send('Error creating location')
	}
})

// edit location
app.put('/misc/locations/edit/:locationId', async (req, res) => {
	const { locationId } = req.params
	const { locationName } = req.body

	try {
		// send to spring
		const response = await axios.put(`http://localhost:8080/misc/locations/edit/${locationId}`, {
			locationName,
		})

		res.json(response.data)
	} catch (error) {
		console.error('Error editing location:', error)
		res.status(500).send('Error editing location')
	}
})

// delete location
app.delete('/misc/locations/delete/:locationId', async (req, res) => {
	const { locationId } = req.params

	try {
		// send to spring
		const response = await axios.delete(`http://localhost:8080/misc/locations/delete/${locationId}`)

		res.json(response.data)
	} catch (error) {
		console.error('Error deleting location:', error)
		res.status(500).send('Error deleting location')
	}
})

// manufacturers
// get manufacturers
app.get('/misc/manufacturers', async (req, res) => {
	try {
		const response = await axios.get('http://localhost:8080/misc/manufacturers')

		res.json(response.data)
	} catch (error) {
		if (error.response) {
			console.error('Error response from server:', error.response.data)
			res.status(error.response.status).send(error.response.data.message || 'Error fetching manufacturers')
		} else {
			console.error('Unexpected error:', error)
			res.status(500).send('Internal server error')
		}
	}
})

// create new manufacturer
app.post('/misc/manufacturers/new', async (req, res) => {
	const { manufacturerName, manufacturerContactNumber, manufacturerEmail } = req.body

	try {
		// send to spring
		const response = await axios.post('http://localhost:8080/misc/manufacturers/new', {
			manufacturerName,
			manufacturerContactNumber,
			manufacturerEmail,
		})

		res.json(response.data)
	} catch (error) {
		console.error('Error creating manufacturer:', error)
		res.status(500).send('Error creating manufacturer')
	}
})

// edit manufacturer
app.put('/misc/manufacturers/edit/:manufacturerId', async (req, res) => {
	const { manufacturerId } = req.params
	const { manufacturerName, manufacturerContactNumber, manufacturerEmail } = req.body

	try {
		// send to spring
		const response = await axios.put(`http://localhost:8080/misc/manufacturers/edit/${manufacturerId}`, {
			manufacturerName,
			manufacturerContactNumber,
			manufacturerEmail,
		})

		res.json(response.data)
	} catch (error) {
		console.error('Error editing manufacturer:', error)
		res.status(500).send('Error editing manufacturer')
	}
})

// delete manufacturer
app.delete('/misc/manufacturers/delete/:manufacturerId', async (req, res) => {
	const { manufacturerId } = req.params

	try {
		// send to spring
		const response = await axios.delete(`http://localhost:8080/misc/manufacturers/delete/${manufacturerId}`)

		res.json(response.data)
	} catch (error) {
		console.error('Error deleting manufacturer:', error)
		res.status(500).send('Error deleting manufacturer')
	}
})

// inspections
// get inspections
app.get('/misc/inspections', async (req, res) => {
	try {
		const response = await axios.get('http://localhost:8080/misc/inspections')

		res.json(response.data)
	} catch (error) {
		if (error.response) {
			console.error('Error response from server:', error.response.data)
			res.status(error.response.status).send(error.response.data.message || 'Error fetching inspections')
		} else {
			console.error('Unexpected error:', error)
			res.status(500).send('Internal server error')
		}
	}
})

// create new inspection
app.post('/misc/inspections/new', async (req, res) => {
	const { inspectionName, toolId, inspectionFrequency, inspectionDueDate, inspectionCompletedDate } = req.body

	try {
		// send to spring
		const response = await axios.post('http://localhost:8080/misc/inspections/new', {
			inspectionName,
			toolId,
			inspectionFrequency,
			inspectionDueDate,
			inspectionCompletedDate,
		})

		res.json(response.data)
	} catch (error) {
		console.error('Error creating inspection:', error)
		res.status(500).send('Error creating inspection')
	}
})

// edit inspection
app.put('/misc/inspections/edit/:inspectionId', async (req, res) => {
	const { inspectionId } = req.params
	const { inspectionName, toolId, inspectionFrequency, inspectionDueDate, inspectionCompletedDate } = req.body

	try {
		// send to spring
		const response = await axios.put(`http://localhost:8080/misc/inspections/edit/${inspectionId}`, {
			inspectionName,
			toolId,
			inspectionFrequency,
			inspectionDueDate,
			inspectionCompletedDate,
		})

		res.json(response.data)
	} catch (error) {
		console.error('Error editing inspection:', error)
		res.status(500).send('Error editing inspection')
	}
})

// delete inspection
app.delete('/misc/inspections/delete/:inspectionId', async (req, res) => {
	const { inspectionId } = req.params

	try {
		// send to spring
		const response = await axios.delete(`http://localhost:8080/misc/inspections/delete/${inspectionId}`)

		res.json(response.data)
	} catch (error) {
		console.error('Error deleting inspection:', error)
		res.status(500).send('Error deleting inspection')
	}
})

// parts
// get parts
app.get('/misc/parts', async (req, res) => {
	try {
		const response = await axios.get('http://localhost:8080/misc/parts')

		res.json(response.data)
	} catch (error) {
		if (error.response) {
			console.error('Error response from server:', error.response.data)
			res.status(error.response.status).send(error.response.data.message || 'Error fetching parts')
		} else {
			console.error('Unexpected error:', error)
			res.status(500).send('Internal server error')
		}
	}
})

// create new part
app.post('/misc/parts/new', async (req, res) => {
	const { partName, toolId, partQuantity } = req.body

	try {
		// send to spring
		const response = await axios.post('http://localhost:8080/misc/parts/new', {
			partName,
			toolId,
			partQuantity,
		})

		res.json(response.data)
	} catch (error) {
		console.error('Error creating part:', error)
		res.status(500).send('Error creating part')
	}
})

// edit part
app.put('/misc/parts/edit/:partId', async (req, res) => {
	const { partId } = req.params
	const { partName, toolId, partQuantity } = req.body

	try {
		// send to spring
		const response = await axios.put(`http://localhost:8080/misc/parts/edit/${partId}`, {
			partName,
			toolId,
			partQuantity,
		})

		res.json(response.data)
	} catch (error) {
		console.error('Error editing part:', error)
		res.status(500).send('Error editing part')
	}
})

// delete part
app.delete('/misc/parts/delete/:partId', async (req, res) => {
	const { partId } = req.params

	try {
		// send to spring
		const response = await axios.delete(`http://localhost:8080/misc/parts/delete/${partId}`)

		res.json(response.data)
	} catch (error) {
		console.error('Error deleting part:', error)
		res.status(500).send('Error deleting part')
	}
})

// serve checkout page
app.get('/checkout', (req, res) => {
	res.sendFile(__dirname + '/public/checkout.html')
})

// serve checkin page
app.get('/checkin', (req, res) => {
	res.sendFile(__dirname + '/public/checkin.html')
})

// serve search page
app.get('/search', (req, res) => {
	res.sendFile(__dirname + '/public/search.html')
})

// serve submit a ticket page
app.get('/ticket', (req, res) => {
	res.sendFile(__dirname + '/public/ticket.html')
})

// send support email
app.post('/send-email', async (req, res) => {
	const { to, subject, body } = req.body

	const transporter = nodemailer.createTransport({
		service: 'Gmail',
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASSWORD,
		},
		tls: {
			rejectUnauthorized: false,
		},
	})

	const mailOptions = {
		from: process.env.EMAIL_USER,
		to,
		subject,
		text: body,
	}

	try {
		await transporter.sendMail(mailOptions)
		res.status(200).send('Email sent successfully.')
	} catch (error) {
		console.error('Error sending email:', error)
		res.status(500).send('Failed to send email.')
	}
})

// serve documentation page
app.get('/docs', (req, res) => {
	res.sendFile(__dirname + '/public/docs.html')
})

// serve user mgmt page
app.get('/user_mgmt', (req, res) => {
	res.sendFile(__dirname + '/public/admin/user_mgmt.html')
})

// serve tool mgmt page
app.get('/tool_mgmt', (req, res) => {
	res.sendFile(__dirname + '/public/admin/tool_mgmt.html')
})

// serve misc mgmt page
app.get('/misc_mgmt', (req, res) => {
	res.sendFile(__dirname + '/public/admin/misc_mgmt.html')
})

// start server
app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`)
})
