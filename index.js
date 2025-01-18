// for the pindakaas viking, who always lends his aid

// variables
const express = require('express')
const { Pool } = require('pg')
const cors = require('cors')
const nodemailer = require('nodemailer')
const cookieParser = require('cookie-parser')
require('dotenv').config()

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
		res.status(500).send('Error sending email.')
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