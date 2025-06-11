import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
dotenv.config()


const sendEmail = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_ADDRESS,
        password: process.env.EMAIL_PASSWORD
    }
})

export default sendEmail;