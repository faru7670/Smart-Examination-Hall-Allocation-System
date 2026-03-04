const nodemailer = require('nodemailer');

// Use a test account or ethereal for local dev, or real SMTP
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: process.env.SMTP_PORT || 587,
    auth: {
        user: process.env.SMTP_USER || 'bernadette.cruickshank68@ethereal.email',
        pass: process.env.SMTP_PASS || 'GZgU7jGbnA1pY8XUfR'
    }
});

/**
 * Sends the final allocation PDF to the given email address.
 * @param {string} toEmail Email address to send the PDF to
 * @param {Buffer} pdfBuffer The generated PDF buffer
 * @param {string} collegeName the name of the college
 */
const sendAllocationEmail = async (toEmail, pdfBuffer, collegeName) => {
    try {
        const info = await transporter.sendMail({
            from: '"ExamHall System" <noreply@examhall.com>',
            to: toEmail,
            subject: `Seat Allocation Complete - ${collegeName || 'ExamHall'}`,
            text: 'Please find attached the latest examination seat allocation records.',
            attachments: [
                {
                    filename: 'seat_allocation.pdf',
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ]
        });
        console.log('Message sent: %s', info.messageId);
        // Useful for debugging with ethereal email
        if (info.messageId && nodemailer.getTestMessageUrl) {
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        }
    } catch (err) {
        console.error('Failed to send email:', err);
    }
};

module.exports = { sendAllocationEmail };
