document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('ticket-form');
    console.log(form)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const subject = document.getElementById('subject').value;
        const contactNumber = document.getElementById('contact_number').value;
        const emailAddress = document.getElementById('email_address').value;
        const location = document.getElementById('location').value;
        const description = document.getElementById('description').value;

        const ticketDetails = `
            Subject: ${subject}
            Contact Number: ${contactNumber}
            Email Address: ${emailAddress}
            Location: ${location}
            Description:
            ${description}
        `;
        console.log(ticketDetails)
        try {
            await fetch('/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: 'tmtesterton@gmail.com',
                    subject: 'New Support Ticket',
                    body: ticketDetails,
                }),
            });

            alert('Ticket submitted successfully!');
            form.reset();
        } catch (error) {
            console.error('Error submitting ticket:', error);
            alert('There was an error submitting your ticket. Please try again.');
        }
    });
});
