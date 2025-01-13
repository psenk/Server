// variables
const express = require('express')
require('dotenv').config()
const { Pool } = require('pg')
const axios = require('axios')
const nodemailer = require('nodemailer')
const BASE_URL = 'http://localhost:8080'

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

// authentication
// login
app.post('/auth/login', async (req, res) => {
	const { username, password } = req.body

	if (!username || !password) {
		res.status(400).send('Username and password are required')
		return
	}

	try {
		const response = await axios.post(`${BASE_URL}/auth/login`, {
			username,
			password,
		})

		if (response.status === 200) {
			const token = response.data.token
			res.status(200).json({ message: 'Login successful', token })
		}
	} catch (error) {
		handleAxiosError(error, res, 'Error logging in.')
	}
})

// logout
app.post('/auth/logout', async (req, res) => {
	const token = req.headers.authorization?.split(' ')[1]

	if (!token) {
		res.status(400).send('Token is required for logout')
		return
	}

	try {
		const response = await axios.post(
			`${BASE_URL}/auth/logout`,
			{},
			{
				headers: { Authorization: `Bearer ${token}` },
			}
		)

		if (response.status === 200) {
			res.status(200).send('Logout successful')
		} else {
			res.status(response.status).send(response.data.message)
		}
	} catch (error) {
		handleAxiosError(error, res, 'Error logging out.')
	}
})

// search
app.get('/find', async (req, res) => {
	const { type, query } = req.query

	if (!type || !query) {
		return res.status(400).json({ error: 'Both "type" and "query" parameters are required.' })
	}
	try {
		// send to spring
		const response = await axios.get(`${BASE_URL}/find`, {
			params: { type, query },
		})

		res.json(response.data)
	} catch (error) {
		handleAxiosError(error, res, 'An error occurred while processing the search request.')
	}
})

// checkouts
// start checkout session
app.post('/checkout/start', async (req, res) => {
	const { userDisplayId } = req.body

	try {
		const response = await axios.post(`${BASE_URL}/checkout/start`, {
			userDisplayId,
		})

		if (response.status === 200) {
			const { user, checkoutToken, checkedOutTools } = response.data
			res.json({ message: 'Checkout session started', user, checkoutToken, checkedOutTools })
		} else {
			res.status(response.status).send(response.data.message || 'Error starting checkout session')
		}
	} catch (error) {
		handleAxiosError(error, res, 'Error starting checkout session')
	}
})

// end checkout session
app.post('/checkout/end', async (req, res) => {
	const { checkoutToken } = req.body

	try {
		const response = await axios.post(`${BASE_URL}/checkout/end`, {
			checkoutToken,
		})

		if (response.status === 200) {
			res.json({ message: response.data.message })
		} else {
			res.status(response.status).send(response.data.message || 'Error ending checkout session')
		}
	} catch (error) {
		handleAxiosError(error, res, 'Error ending checkout session.')
	}
})

// checkout tool
app.post('/checkout/tool/out/:toolCode', async (req, res) => {
	const { toolCode } = req.params
	const { checkoutToken, userDisplayId } = req.body

	try {
		// send to spring
		const response = await axios.post(`${BASE_URL}/checkout/tool/out/${toolCode}`, {
			checkoutToken,
			userDisplayId,
		})

		const { message, checkedOutTools } = response.data

		// send to client
		res.json({ message, checkedOutTools })
	} catch (error) {
		if (error.response) {
			const { status, data } = error.response
			if (status === 400) {
				res.status(400).send({ message: data.message || 'Tool not found.' })
			} else if (status === 401) {
				res.status(401).send({ message: data.message || 'Invalid checkout session token.' })
			} else if (status === 403) {
				res.status(403).send({ message: data.message || 'Tool is already checked out or user mismatch.' })
			} else if (status === 404) {
				res.status(404).send({ message: data.message || 'User or Tool not found.' })
			} else if (status === 406) {
				res.status(406).send({ message: data.message || 'Tool is not available for checkout.' })
			} else {
				res.status(500).send({ message: data.message || 'Internal server error.' })
			}
		} else {
			res.status(500).send({ message: 'Internal server error.' })
		}
	}
})

// checkin tool
app.post('/checkout/tool/in/:toolCode', async (req, res) => {
	const { toolCode } = req.params
	const { checkoutToken } = req.body

	try {
		// send to spring
		const response = await axios.post(`${BASE_URL}/checkout/tool/in/${toolCode}`, {
			checkoutToken,
		})

		if (response.status === 200) {
			const { message, checkedOutTools } = response.data

			// send to client
			res.json({ message, checkedOutTools })
		} else {
			res.status(response.status).send(response.data.message || 'Error checking in tool')
		}
	} catch (error) {
		if (error.response) {
			const { status, data } = error.response
			if (status === 400) {
				res.status(400).send({ message: data.message || 'Checkout token is required.' })
			} else if (status === 401) {
				res.status(401).send({ message: data.message || 'Invalid checkout session token.' })
			} else if (status === 404) {
				res.status(404).send({ message: data.message || 'Tool or User not found or invalid checkout information.' })
			} else if (status === 409) {
				res.status(409).send({ message: data.message || 'Tool has already been checked in or is not checked out.' })
			} else {
				console.error('Unexpected error:', data)
				res.status(500).send({ message: data.message || 'Internal server error.' })
			}
		} else {
			console.error('Error with no response:', error)
			res.status(500).send({ message: 'Internal server error.' })
		}
	}
})

// tools
// get all tools
app.get('/tools/all', async (req, res) => {
	try {
		// send to spring
		const response = await axios.get(`${BASE_URL}/tools/all`)

		res.json(response.data)
	} catch (error) {
		handleAxiosError(error, res, 'Error fetching tools.')
	}
})

// get specific tool
app.get('/tools/:toolCode', async (req, res) => {
	const { toolCode } = req.params

	try {
		// send to spring
		const response = await axios.get(`${BASE_URL}/tools/${toolCode}`)

		res.json(response.data)
	} catch (error) {
		handleAxiosError(error, res, 'Error fetching tool.')
	}
})

// create new tool
app.post('/tools/new', async (req, res) => {
	const { toolName, toolImageUrl = null, toolCode, manufacturerId = null } = req.body

	if (!toolName || !toolCode) {
		return res.status(400).send('All require fields must be provided.')
	}

	if (toolCode.length != 9) {
		res.status(400).send('Tool codes can only be nine characters in length.')
		return
	}

	try {
		// send to spring
		const response = await axios.post(`${BASE_URL}/tools/new`, {
			toolName,
			toolImageUrl,
			toolCode,
			manufacturerId,
		})

		res.json(response.data)
	} catch (error) {
		handleAxiosError(error, res, 'Error creating tool.')
	}
})

// edit tool
app.put('/tools/edit/:toolId', async (req, res) => {
	const { toolId } = req.params
	const { toolName, toolImageUrl = null, toolCode, manufacturerId = null, toolStatus = null, toolCheckedOut = false } = req.body

	try {
		// send to spring
		const response = await axios.put(`${BASE_URL}/tools/edit/${toolId}`, {
			toolName,
			toolImageUrl,
			toolCode,
			manufacturerId,
			toolStatus,
			toolCheckedOut,
		})

		res.json(response.data)
	} catch (error) {
		handleAxiosError(error, res, 'Error editing tool.')
	}
})

// delete tool
app.delete('/tools/delete/:toolId', async (req, res) => {
	const { toolId } = req.params

	try {
		// send to spring
		const response = await axios.delete(`${BASE_URL}/tools/delete/${toolId}`)

		// send to client
		res.json(response.data)
	} catch (error) {
		handleAxiosError(error, res, 'Error deleting tool.')
	}
})

// users
// get all users
app.get('/users/all', async (req, res) => {
	try {
		// send to spring
		const response = await axios.get(`${BASE_URL}/users/all`)

		// send to client
		res.json(response.data)
	} catch (error) {
		handleAxiosError(error, res, 'Error fetching users.')
	}
})

// get specific user
app.get('/users/:displayId', async (req, res) => {
	const { displayId } = req.params

	try {
		// send to spring
		const response = await axios.get(`${BASE_URL}/users/${displayId}`)

		// send to client
		res.json(response.data)
	} catch (error) {
		handleAxiosError(error, res, 'Error fetching user.')
	}
})

// create new user
app.post('/users/new', async (req, res) => {
	const { userDisplayId, userName, userContactNumber, userEmail, supervisorId = null, userAdmin = false, userAuth = null } = req.body

	// admin specific checks
	if (userAdmin && (!userAuth || userAuth.trim() === '')) {
		res.status(406).send({ message: 'Admin users require a password.' })
		return
	}

	try {
		// send to spring
		const response = await axios.post(`${BASE_URL}/users/new`, {
			userDisplayId,
			userName,
			userContactNumber,
			userEmail,
			supervisorId,
			userAdmin,
			userAuth,
		})

		// send to client
		res.json(response.data)
	} catch (error) {
		handleAxiosError(error, res, 'Error creating user.')
	}
})

// edit user
app.put('/users/edit/:userId', async (req, res) => {
	const { userId } = req.params
	const { userDisplayId, userName, userContactNumber, userEmail, supervisorId = null, userAdmin = false, userAuth = null } = req.body

	// admin specific checks
	if (userAdmin && (!userAuth || userAuth.trim() === '')) {
		res.status(406).send({ message: 'Admin users require a password.' })
		return
	}

	try {
		// send to spring
		const response = await axios.put(`${BASE_URL}/users/edit/${userId}`, {
			userDisplayId,
			userName,
			userContactNumber,
			userEmail,
			supervisorId,
			userAdmin,
			userAuth,
		})

		// send to client
		res.json(response.data)
	} catch (error) {
		handleAxiosError(error, res, 'Error editing user.')
	}
})

// delete user
app.delete('/users/delete/:userId', async (req, res) => {
	const { userId } = req.params

	try {
		// send to spring
		const response = await axios.delete(`${BASE_URL}/users/delete/${userId}`)

		// send to client
		res.json(response.data)
	} catch (error) {
		handleAxiosError(error, res, 'Error deleting user.')
	}
})

// manufacturers
// get manufacturers
app.get('/misc/manufacturers', async (req, res) => {
	try {
		const response = await axios.get(`${BASE_URL}/misc/manufacturers`)

		res.json(response.data)
	} catch (error) {
		handleAxiosError(error, res, 'Error fetching manufacturers.')
	}
})

// create new manufacturer
app.post('/misc/manufacturers/new', async (req, res) => {
	const { manufacturerName, manufacturerContactNumber, manufacturerEmail } = req.body

	try {
		// send to spring
		const response = await axios.post(`${BASE_URL}/misc/manufacturers/new`, {
			manufacturerName,
			manufacturerContactNumber,
			manufacturerEmail,
		})

		res.json(response.data)
	} catch (error) {
		handleAxiosError(error, res, 'Error fetching manufacturer.')
	}
})

// edit manufacturer
app.put('/misc/manufacturers/edit/:manufacturerId', async (req, res) => {
	const { manufacturerId } = req.params
	const { manufacturerName, manufacturerContactNumber, manufacturerEmail } = req.body

	try {
		// send to spring
		const response = await axios.put(`${BASE_URL}/misc/manufacturers/edit/${manufacturerId}`, {
			manufacturerName,
			manufacturerContactNumber,
			manufacturerEmail,
		})

		res.json(response.data)
	} catch (error) {
		handleAxiosError(error, res, 'Error editing manufacturer.')
	}
})

// delete manufacturer
app.delete('/misc/manufacturers/delete/:manufacturerId', async (req, res) => {
	const { manufacturerId } = req.params

	try {
		// send to spring
		const response = await axios.delete(`${BASE_URL}/misc/manufacturers/delete/${manufacturerId}`)

		res.json(response.data)
	} catch (error) {
		handleAxiosError(error, res, 'Error deleting manufacturer.')
	}
})

app.get('/reports/user', async (req, res) => {
	const { type, userDisplayId } = req.query

	if (!type) {
		return res.status(400).send('The "type" query parameter is required.')
	}
	if (['user-checkout-history', 'view-user-info'].includes(type) && !userDisplayId) {
		return res.status(400).send('The "userDisplayId" query parameter is required for this report type.')
	}

	try {
		const response = await axios.get(`${BASE_URL}/reports/user`, {
			params: { type, userDisplayId },
		})

		res.json(response.data)
	} catch (error) {
		handleAxiosError(error, res, 'Error fetching user report.')
	}
})

app.get('/reports/tool', async (req, res) => {
	const { type, toolCode } = req.query

	if (!type) {
		return res.status(400).send('The "type" query parameter is required.')
	}
	if (['tool-checkout-history', 'view-tool-info'].includes(type) && !toolCode) {
		return res.status(400).send('The "toolCode" query parameter is required for this report type.')
	}

	try {
		const response = await axios.get(`${BASE_URL}/reports/tool`, {
			params: { type, toolCode },
		})

		res.json(response.data)
	} catch (error) {
		handleAxiosError(error, res, 'Error fetching tool report')
	}
})

app.get('/reports/checkout', async (req, res) => {
	const { type, time, startDate, endDate } = req.query

	if (!type) {
		return res.status(400).send('The "type" query parameter is required.')
	}
	if (type === 'checkout-date-history') {
		if (!time) {
			return res.status(400).send('The "time" query parameter is required for this report type.')
		}
		if (time === 'before-date' && !startDate) {
			return res.status(400).send('The "startDate" query parameter is required for "before-date".')
		}
		if (time === 'between-dates' && (!startDate || !endDate)) {
			return res.status(400).send('Both "startDate" and "endDate" query parameters are required for "between-dates".')
		}
		if (time === 'after-date' && !endDate) {
			return res.status(400).send('The "endDate" query parameter is required for "after-date".')
		}
	}

	try {
		const response = await axios.get(`${BASE_URL}/reports/checkout`, {
			params: { type, time, startDate, endDate },
		})

		res.json(response.data)
	} catch (error) {
		handleAxiosError(error, res, 'Error fetching checkout report')
	}
})

app.get('/reports/misc', async (req, res) => {
	const { type, manufacturerName } = req.query

	if (!type) {
		return res.status(400).send('The "type" query parameter is required.')
	}
	if (type === 'view-manufacturer' && !manufacturerName) {
		return res.status(400).send('The "manufacturerName" query parameter is required for this report type.')
	}

	try {
		const response = await axios.get(`${BASE_URL}/reports/misc`, {
			params: { type, manufacturerName },
		})

		res.json(response.data)
	} catch (error) {
		handleAxiosError(error, res, 'Error fetching misc report')
	}
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
		handleAxiosError(error, res, 'Error sending email.')
	}
})

// serve pages
app.get('/:page', (req, res) => {
	const validPages = ['checkout', 'checkin', 'search', 'reports', 'ticket', 'docs', 'user_mgmt', 'tool_mgmt', 'misc_mgmt']
	const page = req.params.page

	if (validPages.includes(page)) {
		res.sendFile(`${__dirname}/public/${page}.html`)
	} else {
		res.status(404).send('Page not found')
	}
})

// start server
app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`)
})

function handleAxiosError(error, res, defaultMessage) {
	if (error.response) {
		console.error('Error response from server:', error.response.data)
		return res.status(error.response.status).send(error.response.data.message || defaultMessage)
	} else {
		console.error('Unexpected error:', error)
		return res.status(500).send('Internal server error')
	}
}
