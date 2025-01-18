let reportTitle = ''
const reportTypeDropdown = document.getElementById('report-type')

const userReportsSection = document.getElementById('user-reports-section')
const toolReportsSection = document.getElementById('tool-reports-section')
const checkoutReportsSection = document.getElementById('checkout-reports-section')
const miscReportsSection = document.getElementById('misc-reports-section')

const userReportTypeDropdown = document.getElementById('user-report-type')
const toolReportTypeDropdown = document.getElementById('tool-report-type')
const checkoutReportTypeDropdown = document.getElementById('checkout-report-type')
const miscReportTypeDropdown = document.getElementById('misc-report-type')

const userIdField = document.getElementById('user-id-field')
const toolCodeField = document.getElementById('tool-code-field')
const manufacturerNameField = document.getElementById('manufacturer-name-field')

const checkoutDates = document.getElementById('checkout-dates')
const beforeDate = document.getElementById('before-date')
const betweenDates = document.getElementById('between-dates')
const afterDate = document.getElementById('after-date')
const startDate = document.getElementById('start-date')
const startDateLabel = document.getElementById('start-date-label')
const endDate = document.getElementById('end-date')
const endDateLabel = document.getElementById('end-date-label')

const reportTableHead = document.getElementById('report-table-head')
const reportTableBody = document.getElementById('report-table-body')

document.addEventListener('DOMContentLoaded', () => {
	resetDropdowns()

	userReportsSection.style.display = 'block'
	toolReportsSection.style.display = 'none'
	checkoutReportsSection.style.display = 'none'
	miscReportsSection.style.display = 'none'

	// report type changes
	reportTypeDropdown.addEventListener('change', () => {
		userReportsSection.style.display = 'none'
		toolReportsSection.style.display = 'none'
		checkoutReportsSection.style.display = 'none'
		miscReportsSection.style.display = 'none'

		if (reportTypeDropdown.value === 'user-reports') {
			userReportsSection.style.display = 'block'

			toolReportsSection.style.display = 'none'
			checkoutReportsSection.style.display = 'none'
			miscReportsSection.style.display = 'none'
		} else if (reportTypeDropdown.value === 'tool-reports') {
			toolReportsSection.style.display = 'block'
			toolCodeField.style.display = 'block'

			userReportsSection.style.display = 'none'
			checkoutReportsSection.style.display = 'none'
			miscReportsSection.style.display = 'none'
		} else if (reportTypeDropdown.value === 'checkout-reports') {
			checkoutReportsSection.style.display = 'block'

			userReportsSection.style.display = 'none'
			toolReportsSection.style.display = 'none'
			miscReportsSection.style.display = 'none'
		} else if (reportTypeDropdown.value === 'misc-reports') {
			miscReportsSection.style.display = 'block'
			manufacturerNameField.style.display = 'block'

			userReportsSection.style.display = 'none'
			toolReportsSection.style.display = 'none'
			checkoutReportsSection.style.display = 'none'
		}
	})

	const reportForm = document.getElementById('report-form')

	reportForm.addEventListener('submit', async (e) => {
		e.preventDefault()

		const reportType = reportTypeDropdown.value
		let prefix = null
		let params = {}

		if (reportType === 'user-reports') {
			prefix = 'user'
			const userReportType = userReportTypeDropdown.value
			params.type = userReportType

			if (['user-checkout-history', 'view-user-info'].includes(userReportType)) {
				params.userDisplayId = document.getElementById('user-display-id').value
			}
		} else if (reportType === 'tool-reports') {
			prefix = 'tool'
			const toolReportType = toolReportTypeDropdown.value
			params.type = toolReportType

			if (['tool-checkout-history', 'view-tool-info'].includes(toolReportType)) {
				params.toolCode = document.getElementById('tool-code').value
			}
		} else if (reportType === 'checkout-reports') {
			prefix = 'checkout'
			const checkoutReportType = checkoutReportTypeDropdown.value
			params.type = checkoutReportType

			if (checkoutReportType === 'checkout-date-history') {
				const dateFilter = document.querySelector('input[name="dateFilter"]:checked').value
				params.time = dateFilter

				if (dateFilter === 'before-date') {
					params.startDate = document.getElementById('start-date').value
				} else if (dateFilter === 'between-dates') {
					params.startDate = document.getElementById('start-date').value
					params.endDate = document.getElementById('end-date').value
				} else if (dateFilter === 'after-date') {
					params.endDate = document.getElementById('end-date').value
				}
			}
		} else if (reportType === 'misc-reports') {
			prefix = 'misc'
			const miscReportType = miscReportTypeDropdown.value
			params.type = miscReportType

			if (miscReportType === 'view-manufacturer') {
				params.manufacturerName = document.getElementById('manufacturer-name').value
			}
		}
		let url = `https://capstone-tms-app.fly.dev/reports/${prefix}`
		fetchAndDisplayReport(url, params, reportType)
	})

	// user reports
	userReportTypeDropdown.addEventListener('change', () => {
		userIdField.style.display = userReportTypeDropdown.value === 'user-checkout-history' || userReportTypeDropdown.value === 'view-user-info' ? 'block' : 'none'
	})

	// tool reports
	toolReportTypeDropdown.addEventListener('change', () => {
		toolCodeField.style.display = toolReportTypeDropdown.value === 'tool-checkout-history' || toolReportTypeDropdown.value === 'view-tool-info' ? 'block' : 'none'
	})

	// checkout reports
	checkoutReportTypeDropdown.addEventListener('change', () => {
		checkoutDates.style.display = checkoutReportTypeDropdown.value === 'checkout-date-history' ? 'block' : 'none'
	})

	beforeDate.addEventListener('change', updateDateFields)
	betweenDates.addEventListener('change', updateDateFields)
	afterDate.addEventListener('change', updateDateFields)

	updateDateFields()

	// misc reports
	miscReportTypeDropdown.addEventListener('change', () => {
		manufacturerNameField.style.display = miscReportTypeDropdown.value === 'view-manufacturer' ? 'block' : 'none'
	})
})

function updateDateFields() {
	if (beforeDate.checked) {
		startDate.style.display = 'block'
		startDateLabel.style.display = 'block'
		startDateLabel.textContent = 'Date:'
		endDate.style.display = 'none'
		endDateLabel.style.display = 'none'
	} else if (betweenDates.checked) {
		startDate.style.display = 'block'
		startDateLabel.style.display = 'block'
		startDateLabel.textContent = 'Start Date:'
		endDate.style.display = 'block'
		endDateLabel.style.display = 'block'
		endDateLabel.textContent = 'End Date:'
	} else if (afterDate.checked) {
		startDate.style.display = 'none'
		startDateLabel.style.display = 'none'
		endDate.style.display = 'block'
		endDateLabel.style.display = 'block'
		endDateLabel.textContent = 'Date:'
	}
}

function resetDropdowns() {
	const dropdowns = document.querySelectorAll('select')

	dropdowns.forEach((dropdown) => {
		dropdown.selectedIndex = 0
	})
}

async function fetchAndDisplayReport(url, params, type) {
	try {
		const queryString = new URLSearchParams(params).toString()
		const fullUrl = `${url}?${queryString}`

		const response = await fetch(fullUrl, { method: 'GET', credentials: 'include' })
		if (!response.ok) {
			throw new Error(`HTTP error, status: ${response.status}`)
		}

		const data = await response.json()

		clearTable()

		reportTitle = getReportTitle(params.type, type)
		addReportTitle(reportTitle)

		if (Array.isArray(data) && data.length > 0) {
			const headers = Object.keys(data[0])
			populateTableHeaders(headers)
			data.forEach((row) => populateTableRow(row, headers))
			addExportButtons(data)
		} else {
			reportTableBody.innerHTML = '<tr><td colspan="100%">No data available.</td></tr>'
		}
	} catch (error) {
		console.error('Error fetching report:', error)
		alert('Failed to fetch the report.')
	}
}

function clearTable() {
	reportTableHead.innerHTML = ''
	reportTableBody.innerHTML = ''
}

function getReportTitle(report, type) {
	const readablePrefix = type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ')
	return `${readablePrefix} - ${report.replace(/-/g, ' ').toUpperCase()}`
}

function addReportTitle(title) {
	const titleRow = document.createElement('tr')
	const titleCell = document.createElement('th')
	titleCell.colSpan = 100
	titleCell.textContent = title
	titleCell.style.textAlign = 'center'
	titleCell.style.fontSize = '16px'
	titleCell.style.fontWeight = 'bold'
	titleCell.style.padding = '10px'
	titleCell.style.borderBottom = '2px solid #ccc'
	titleRow.appendChild(titleCell)

	reportTableHead.appendChild(titleRow)
}

function populateTableHeaders(headers) {
	const row = document.createElement('tr')
	headers.forEach((header) => {
		const th = document.createElement('th')
		th.textContent = header.replace(/_/g, ' ').toUpperCase()
		th.style.border = '1px solid #ccc'
		th.style.padding = '8px'
		row.appendChild(th)
	})
	reportTableHead.appendChild(row)
}

function populateTableRow(row, headers) {
	const tableRow = document.createElement('tr')
	headers.forEach((header) => {
		const td = document.createElement('td')
		td.textContent = row[header]
		td.style.border = '1px solid #ccc'
		td.style.padding = '8px'
		tableRow.appendChild(td)
	})
	reportTableBody.appendChild(tableRow)
}

function addExportButtons(data) {
	const existingButtons = document.getElementById('export-buttons')
	if (existingButtons) {
		existingButtons.remove()
	}

	const buttonContainer = document.createElement('div')
	buttonContainer.id = 'export-buttons'
	buttonContainer.style.marginTop = '1em'

	const csvButton = document.createElement('button')
	csvButton.textContent = 'Export to CSV'
	csvButton.style.marginRight = '10px'
	csvButton.onclick = () => exportToCSV(data)
	buttonContainer.appendChild(csvButton)

	const excelButton = document.createElement('button')
	excelButton.textContent = 'Export to Excel'
	excelButton.onclick = () => exportToExcel(data)
	buttonContainer.appendChild(excelButton)

	const reportResults = document.getElementById('report-results')
	reportResults.appendChild(buttonContainer)
}

function exportToCSV(data) {
	const headers = Object.keys(data[0])
	const csvContent = [`"${reportTitle}"`, headers.join(','), ...data.map((row) => headers.map((header) => `"${row[header] || ''}"`).join(','))].join('\n')

	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
	const link = document.createElement('a')
	link.href = URL.createObjectURL(blob)
	link.download = 'report.csv'
	link.click()
}

function exportToExcel(data) {
	const worksheet = XLSX.utils.json_to_sheet(data)
	const workbook = XLSX.utils.book_new()
	XLSX.utils.sheet_add_aoa(worksheet, [[reportTitle]], { origin: 'A1' })
	XLSX.utils.book_append_sheet(workbook, worksheet, 'Report')
	XLSX.writeFile(workbook, 'report.xlsx')
}

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
