import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
dotenv.config()

const sendEmail = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
        password: process.env.NODE_CODE_SENDING_EMAIL_PASSWORD
    }
})

export default sendEmail;