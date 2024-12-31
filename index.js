// variables
const express = require('express')
require('dotenv').config()
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
// get user, create checkout session
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

// tools
// get specific tool
app.get('/tools/tool', async (req, res) => {
	const { tool_code } = req.query

	try {
		const response = await axios.get('http://localhost:8080/tools/tool', {
			params: { tool_code },
		})
		res.json(response.data)
	} catch (error) {
		if (error.response) {
			if (error.response.status === 404) {
				res.status(404).send('Tool not found')
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

// create new tool
app.post('/tools/new', async (req, res) => {
	const { tool_name, tool_checked_out = false, tool_image = null, tool_code, tool_status = ToolStatus.AVAILABLE, manufacturer_id = null, location_id = null } = req.body

	try {
		// send to spring
		const response = await axios.post('http://localhost:8080/tools/new', {
			tool_name,
			tool_checked_out,
			tool_image,
			tool_code,
			tool_status,
			manufacturer_id,
			location_id,
		})

		if (tool_code.length != 9) {
			res.status(400).send('Tool codes can only be nine characters in length')
			return
		}

		if (response.status === 200) {
			res.send(response.data.message)
		} else {
			res.status(401).send(response.data.message)
		}
	} catch (error) {
		res.status(500).send('Error creating tool')
	}
})

// users
// get specific user
app.get('/users/user', async (req, res) => {
	const { user_display_id } = req.query

	try {
		const response = await axios.get('http://localhost:8080/users/user', {
			params: { user_display_id },
		})
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

// create new user
app.post('/users/new', async (req, res) => {
	const { user_display_id, user_name, user_contact_number, user_email, supervisor_id = null, location_id = null, user_admin = false, user_auth = null } = req.body

	try {
		// send to spring
		const response = await axios.post('http://localhost:8080/users/new', {
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

// locations
// get location
app.get('/misc/locations', async (req, res) => {
	try {
		const response = await axios.get('http://localhost:8080/misc/locations')
		if (response.status === 200) {
			res.json(response.data)
		} else {
			res.status(response.status).send(response.data.message || 'Error fetching locations')
		}
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

		if (response.status === 200) {
			res.json(response.data)
		} else {
			res.status(401).json(response.data)
		}
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
			locationId,
			locationName,
		})

		if (response.status === 200) {
			res.json(response.data)
		} else {
			res.status(401).json(response.data)
		}
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

		if (response.status === 200) {
			res.json(response.data)
		} else {
			res.status(401).json(response.data)
		}
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
		if (response.status === 200) {
			res.json(response.data)
		} else {
			res.status(response.status).send(response.data.message || 'Error fetching manufacturers')
		}
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

		if (response.status === 200) {
			res.json(response.data)
		} else {
			res.status(response.status).send(response.data.message || 'Error creating manufacturer')
		}
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
			manufacturerId,
			manufacturerName,
			manufacturerContactNumber,
			manufacturerEmail,
		})

		if (response.status === 200) {
			res.json(response.data)
		} else {
			res.status(response.status).send(response.data.message || 'Error editing manufacturer')
		}
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

		if (response.status === 200) {
			res.json(response.data)
		} else {
			res.status(response.status).send(response.data.message || 'Error deleting manufacturer')
		}
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
		if (response.status === 200) {
			res.json(response.data)
		} else {
			res.status(response.status).send(response.data.message || 'Error fetching inspections')
		}
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

		if (response.status === 200) {
			res.json(response.data)
		} else {
			res.status(response.status).send(response.data.message || 'Error creating inspection')
		}
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

		if (response.status === 200) {
			res.json(response.data)
		} else {
			res.status(response.status).send(response.data.message || 'Error editing inspection')
		}
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

		if (response.status === 200) {
			res.json(response.data)
		} else {
			res.status(response.status).send(response.data.message || 'Error deleting inspection')
		}
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
		if (response.status === 200) {
			res.json(response.data)
		} else {
			res.status(response.status).send(response.data.message || 'Error fetching parts')
		}
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

		if (response.status === 200) {
			res.json(response.data)
		} else {
			res.status(response.status).send(response.data.message || 'Error creating part')
		}
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

		if (response.status === 200) {
			res.json(response.data)
		} else {
			res.status(response.status).send(response.data.message || 'Error editing part')
		}
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

		if (response.status === 200) {
			res.json(response.data)
		} else {
			res.status(response.status).send(response.data.message || 'Error deleting part')
		}
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
