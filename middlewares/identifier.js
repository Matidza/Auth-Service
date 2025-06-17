import dotenv from "dotenv";
import jwt from 'jsonwebtoken';
dotenv.config();

/**
 * for making sure that usrs cant access signout, send-Verification-Code
 * and onter rout that need users to be logged in
 */

export function identifier(req, res ) {
    let token;

    if (req.headers.client === 'not-browser') {
        token = req.headers.authorization
    } else {
        token = req.cookies['Authorization']
    }

    if (!token) {
        return res.status(403).json({
                success: false,
                message: "Unauthorized"
            });
    }

    try {
        const userToken = token.split(' ')[1]
        const jwtVerified = jwt.verify(userToken, process.env.SECRET_ACCESS_TOKEN)

        if (jwtVerified) {
            req.user = jwtVerified;
           
        } else{
            throw new Error('error in the token')
        }
    } catch (error) {
        console.log(error)
    }
}