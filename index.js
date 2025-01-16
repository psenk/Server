// variables
const express = require('express')
const { Pool } = require('pg')
const axios = require('axios')
const cors = require('cors')
const nodemailer = require('nodemailer')
const cookieParser = require('cookie-parser')
require('dotenv').config()

const BASE_URL = 'https://capstone-tms-app.fly.dev'

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

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.static('public'))
app.use(cors({ origin: 'https://capstone-tms-app.fly.dev', credentials: true }))
app.use(cookieParser())

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
		const response = await axios.post(
			`${BASE_URL}/auth/login`,
			{
				username,
				password,
			},
			{
				withCredentials: true,
				headers: { 'Content-Type': 'application/json' },
			}
		)
		let token = null
		const setCookieHeader = response.headers['set-cookie']

		if (setCookieHeader && Array.isArray(setCookieHeader)) {
			const tokenCookie = setCookieHeader.find((cookie) => cookie.startsWith('token='))
			if (tokenCookie) {
				token = tokenCookie.split(';')[0].split('=')[1]
			} else {
				console.log('Token cookie not found.')
			}
		} else {
			console.log('Set-Cookie header is missing.')
		}
		console.log('Token: ', token)
		if (response.status === 200) {
			res.cookie('token', token, {
				httpOnly: true,
				secure: true,
				sameSite: 'None',
				maxAge: 86400000,
			})
			res.status(200).json({ message: 'Login successful' })
		}
	} catch (error) {
		handleAxiosError(error, res, 'Error logging in.')
	}
})

app.use(extractToken)

// logout
app.post('/auth/logout', async (req, res) => {
	const token = req.cookies.token

	if (!token) {
		res.status(400).send('Token is required for logout')
		return
	}

	try {
		const response = await axios.post(`${BASE_URL}/auth/logout`, {
			withCredentials: true,
		})

		if (response.status === 200) {
			res.clearCookie('token', {
				httpOnly: true,
				secure: true,
				sameSite: 'None',
			})
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
			headers: { Cookie: `token=${req.cookies.token}` },
			withCredentials: true,
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
	const token = req.cookies.token

	try {
		const response = await axios.post(
			`${BASE_URL}/checkout/start`,
			{
				userDisplayId,
			},
			{
				withCredentials: true,
			}
		)

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
	const token = req.cookies.token

	try {
		const response = await axios.post(
			`${BASE_URL}/checkout/end`,
			{
				checkoutToken,
			},
			{
				withCredentials: true,
			}
		)

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
	const token = req.cookies.token

	try {
		// send to spring
		const response = await axios.post(
			`${BASE_URL}/checkout/tool/out/${toolCode}`,
			{
				checkoutToken,
				userDisplayId,
			},
			{
				withCredentials: true,
			}
		)

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
	const token = req.cookies.token

	try {
		// send to spring
		const response = await axios.post(
			`${BASE_URL}/checkout/tool/in/${toolCode}`,
			{
				checkoutToken,
			},
			{
				withCredentials: true,
			}
		)

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
	const token = req.cookies.token

	try {
		// send to spring
		const response = await axios.get(`${BASE_URL}/tools/all`, { withCredentials: true })
		res.json(response.data)
	} catch (error) {
		handleAxiosError(error, res, 'Error fetching tools.')
	}
})

// get specific tool
app.get('/tools/:toolCode', async (req, res) => {
	const { toolCode } = req.params
	const token = req.cookies.token

	try {
		// send to spring
		const response = await axios.get(`${BASE_URL}/tools/${toolCode}`, { withCredentials: true })
		res.json(response.data)
	} catch (error) {
		handleAxiosError(error, res, 'Error fetching tool.')
	}
})

// create new tool
app.post('/tools/new', async (req, res) => {
	const { toolName, toolImageUrl = null, toolCode, manufacturerId = null } = req.body
	const token = req.cookies.token

	if (!toolName || !toolCode) {
		return res.status(400).send('All require fields must be provided.')
	}

	if (toolCode.length != 9) {
		res.status(400).send('Tool codes can only be nine characters in length.')
		return
	}

	try {
		// send to spring
		const response = await axios.post(
			`${BASE_URL}/tools/new`,
			{
				toolName,
				toolImageUrl,
				toolCode,
				manufacturerId,
			},
			{
				withCredentials: true,
			}
		)

		res.json(response.data)
	} catch (error) {
		handleAxiosError(error, res, 'Error creating tool.')
	}
})

// edit tool
app.put('/tools/edit/:toolId', async (req, res) => {
	const { toolId } = req.params
	const { toolName, toolImageUrl = null, toolCode, manufacturerId = null, toolStatus = null, toolCheckedOut = false } = req.body
	const token = req.cookies.token

	try {
		// send to spring
		const response = await axios.put(
			`${BASE_URL}/tools/edit/${toolId}`,
			{
				toolName,
				toolImageUrl,
				toolCode,
				manufacturerId,
				toolStatus,
				toolCheckedOut,
			},
			{
				withCredentials: true,
			}
		)

		res.json(response.data)
	} catch (error) {
		handleAxiosError(error, res, 'Error editing tool.')
	}
})

// delete tool
app.delete('/tools/delete/:toolId', async (req, res) => {
	const { toolId } = req.params
	const token = req.cookies.token

	try {
		// send to spring
		const response = await axios.delete(`${BASE_URL}/tools/delete/${toolId}`, {
			withCredentials: true,
		})

		// send to client
		res.json(response.data)
	} catch (error) {
		handleAxiosError(error, res, 'Error deleting tool.')
	}
})

// users
// get all users
app.get('/users/all', async (req, res) => {
	const token = req.cookies.token

	try {
		// send to spring
		const response = await axios.get(`${BASE_URL}/users/all`, {
			withCredentials: true,
		})

		// send to client
		res.json(response.data)
	} catch (error) {
		handleAxiosError(error, res, 'Error fetching users.')
	}
})

// get specific user
app.get('/users/:displayId', async (req, res) => {
	const { displayId } = req.params
	const token = req.cookies.token

	try {
		// send to spring
		const response = await axios.get(`${BASE_URL}/users/${displayId}`, {
			withCredentials: true,
		})

		// send to client
		res.json(response.data)
	} catch (error) {
		handleAxiosError(error, res, 'Error fetching user.')
	}
})

// create new user
app.post('/users/new', async (req, res) => {
	const { userDisplayId, userName, userContactNumber, userEmail, supervisorId = null, userAdmin = false, userAuth = null } = req.body
	const token = req.cookies.token

	// admin specific checks
	if (userAdmin && (!userAuth || userAuth.trim() === '')) {
		res.status(406).send({ message: 'Admin users require a password.' })
		return
	}

	try {
		// send to spring
		const response = await axios.post(
			`${BASE_URL}/users/new`,
			{
				userDisplayId,
				userName,
				userContactNumber,
				userEmail,
				supervisorId,
				userAdmin,
				userAuth,
			},
			{
				withCredentials: true,
			}
		)

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
	const token = req.cookies.token

	// admin specific checks
	if (userAdmin && (!userAuth || userAuth.trim() === '')) {
		res.status(406).send({ message: 'Admin users require a password.' })
		return
	}

	try {
		// send to spring
		const response = await axios.put(
			`${BASE_URL}/users/edit/${userId}`,
			{
				userDisplayId,
				userName,
				userContactNumber,
				userEmail,
				supervisorId,
				userAdmin,
				userAuth,
			},
			{
				withCredentials: true,
			}
		)

		// send to client
		res.json(response.data)
	} catch (error) {
		handleAxiosError(error, res, 'Error editing user.')
	}
})

// delete user
app.delete('/users/delete/:userId', async (req, res) => {
	const { userId } = req.params
	const token = req.cookies.token

	try {
		// send to spring
		const response = await axios.delete(`${BASE_URL}/users/delete/${userId}`, {
			withCredentials: true,
		})

		// send to client
		res.json(response.data)
	} catch (error) {
		handleAxiosError(error, res, 'Error deleting user.')
	}
})

// manufacturers
// get manufacturers
app.get('/misc/manufacturers', async (req, res) => {
	const token = req.cookies.token

	try {
		const response = await axios.get(`${BASE_URL}/misc/manufacturers`, {
			withCredentials: true,
		})

		res.json(response.data)
	} catch (error) {
		handleAxiosError(error, res, 'Error fetching manufacturers.')
	}
})

// create new manufacturer
app.post('/misc/manufacturers/new', async (req, res) => {
	const { manufacturerName, manufacturerContactNumber, manufacturerEmail } = req.body
	const token = req.cookies.token

	try {
		// send to spring
		const response = await axios.post(
			`${BASE_URL}/misc/manufacturers/new`,
			{
				manufacturerName,
				manufacturerContactNumber,
				manufacturerEmail,
			},
			{
				withCredentials: true,
			}
		)

		res.json(response.data)
	} catch (error) {
		handleAxiosError(error, res, 'Error fetching manufacturer.')
	}
})

// edit manufacturer
app.put('/misc/manufacturers/edit/:manufacturerId', async (req, res) => {
	const { manufacturerId } = req.params
	const { manufacturerName, manufacturerContactNumber, manufacturerEmail } = req.body
	const token = req.cookies.token

	try {
		// send to spring
		const response = await axios.put(
			`${BASE_URL}/misc/manufacturers/edit/${manufacturerId}`,
			{
				manufacturerName,
				manufacturerContactNumber,
				manufacturerEmail,
			},
			{
				withCredentials: true,
			}
		)

		res.json(response.data)
	} catch (error) {
		handleAxiosError(error, res, 'Error editing manufacturer.')
	}
})

// delete manufacturer
app.delete('/misc/manufacturers/delete/:manufacturerId', async (req, res) => {
	const { manufacturerId } = req.params
	const token = req.cookies.token

	try {
		// send to spring
		const response = await axios.delete(`${BASE_URL}/misc/manufacturers/delete/${manufacturerId}`, {
			withCredentials: true,
		})

		res.json(response.data)
	} catch (error) {
		handleAxiosError(error, res, 'Error deleting manufacturer.')
	}
})

app.get('/reports/user', async (req, res) => {
	const { type, userDisplayId } = req.query
	const token = req.cookies.token

	if (!type) {
		return res.status(400).send('The "type" query parameter is required.')
	}
	if (['user-checkout-history', 'view-user-info'].includes(type) && !userDisplayId) {
		return res.status(400).send('The "userDisplayId" query parameter is required for this report type.')
	}

	try {
		const response = await axios.get(`${BASE_URL}/reports/user`, {
			params: { type, userDisplayId },
			withCredentials: true,
		})

		res.json(response.data)
	} catch (error) {
		handleAxiosError(error, res, 'Error fetching user report.')
	}
})

app.get('/reports/tool', async (req, res) => {
	const { type, toolCode } = req.query
	const token = req.cookies.token

	if (!type) {
		return res.status(400).send('The "type" query parameter is required.')
	}
	if (['tool-checkout-history', 'view-tool-info'].includes(type) && !toolCode) {
		return res.status(400).send('The "toolCode" query parameter is required for this report type.')
	}

	try {
		const response = await axios.get(`${BASE_URL}/reports/tool`, {
			params: { type, toolCode },
			withCredentials: true,
		})

		res.json(response.data)
	} catch (error) {
		handleAxiosError(error, res, 'Error fetching tool report')
	}
})

app.get('/reports/checkout', async (req, res) => {
	const { type, time, startDate, endDate } = req.query
	const token = req.cookies.token

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
			withCredentials: true,
		})

		res.json(response.data)
	} catch (error) {
		handleAxiosError(error, res, 'Error fetching checkout report')
	}
})

app.get('/reports/misc', async (req, res) => {
	const { type, manufacturerName } = req.query
	const token = req.cookies.token

	if (!type) {
		return res.status(400).send('The "type" query parameter is required.')
	}
	if (type === 'view-manufacturer' && !manufacturerName) {
		return res.status(400).send('The "manufacturerName" query parameter is required for this report type.')
	}

	try {
		const response = await axios.get(`${BASE_URL}/reports/misc`, {
			params: { type, manufacturerName },
			withCredentials: true,
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
	const adminPages = ['user_mgmt', 'tool_mgmt', 'misc_mgmt']
	const page = req.params.page

	if (validPages.includes(page)) {
		if (adminPages.includes(page)) {
			res.sendFile(`${__dirname}/public/admin/${page}.html`)
		} else {
			res.sendFile(`${__dirname}/public/${page}.html`)
		}
	} else {
		res.status(404).send('Page not found')
	}
})

// start server
app.listen(PORT, () => {
	console.log('Server is running.')
})

function handleAxiosError(error, res, defaultMessage) {
	if (error.response) {
		console.error('Error response from server:', {
			status: error.response.status,
			data: error.response.data,
		})
		return res.status(error.response.status).send(error.response.data.message || defaultMessage)
	} else {
		console.error('Unexpected error:', error.message)
		return res.status(500).send('Internal server error')
	}
}

function extractToken(req, res, next) {
	const publicRoutes = [/^\/auth\/login$/, /^\/auth\/register$/, /^\/management\/.*/]
	const isPublicRoute = publicRoutes.some((route) => route.test(req.path))

	if (isPublicRoute) {
		return next()
	}

	const token = req.cookies.token

	if (token) {
		req.token = token
		next()
	} else {
		res.status(401).send('Authorization token is missing or invalid.')
	}
}
