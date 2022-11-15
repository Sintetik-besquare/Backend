const nodemailer = require("nodemailer");
const env = process.env;

const sendEmail = async (email, subject, text) => {
  
    try {
        const transporter = nodemailer.createTransport({
            service:'gmail',
            host: env.EMAIL_HOST,
            secure: true,
            auth: {
                user: env.EMAIL_USER,
                pass: env.EMAIL_PASSWORD
            },
        });

        await transporter.sendMail({
            from: env.EMAIL_SENDER,
            to: email,
            subject: subject,
            text: text,
        });

        console.log("Sucessfully sent email");
    } catch (error) {
        console.log(error, "Email not sent");
    }
};

module.exports = sendEmail;