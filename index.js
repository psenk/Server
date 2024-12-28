// variables
const express = require('express')
require('dotenv').config()
const bodyParser = require('body-parser')
const { Pool } = require('pg')
const axios = require('axios')
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
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// serve static files
app.use(express.static('public'))

// serve login page
app.get('/', (req, res) => {
	res.sendFile(__dirname + '/public/login.html')
})

// user registration route
app.post('/auth/register', async (req, res) => {
	const { user_display_id, user_name, user_contact_number, user_email, supervisor_id = null, location_id = null, user_admin = false, user_auth = null } = req.body

	try {
		// send to spring
		const response = await axios.post('http://localhost:8080/auth/register', {
			user_display_id,
			user_name,
			user_contact_number,
			user_email,
			supervisor_id,
			user_admin,
			user_auth,
			location_id,
		})

		if (user_admin && !user_auth) {
			res.status(400).send('Admin users must have a password')
			return
		}

		if (response.status === 200) {
			res.send(response.data.message)
		} else {
			res.status(401).send(response.data.message)
		}
	} catch (error) {
		console.error('Error during registration:', error)
		res.status(500).send('Error registering user')
	}
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

app.get('/checkout/user', async (req, res) => {
	const { user_display_id } = req.query

	try {
		const response = await axios.get('http://localhost:8080/checkout/user', {
			params: { user_display_id },
		})
		checkoutToken = response.data.checkoutToken
		res.json(response.data)
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

// serve help page
app.get('/help', (req, res) => {
	res.sendFile(__dirname + '/public/help.html')
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
