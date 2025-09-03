/** 
import dotenv from "dotenv";
import jwt from 'jsonwebtoken';
dotenv.config();


// * for making sure that usrs cant access signout, send-Verification-Code
// * and onter rout that need users to be logged in


export function identifier(req, res, next) {
    let token;

    if (req.headers.client === 'not-browser') {
        token = req.headers.authorization;
    } else {
        token = req.cookies['Authorization'];
    }

    if (!token) {
        return res.status(403).json({
            success: false,
            message: "Unauthorized"
        });
    }

    try {
        const userToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
        const jwtVerified = jwt.verify(userToken, process.env.SECRET_ACCESS_TOKEN);

        if (!jwtVerified) {
            throw new Error("Invalid token payload");
        }

        req.user = jwtVerified;
        next(); // <-- don't forget this
    } catch (error) {
        console.error("JWT Error:", error.message);
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
}


*/

/** 
import jwt from 'jsonwebtoken';
import dotenv from "dotenv";
dotenv.config();


export function identifier(req, res, next) {
    const authHeader = req.headers.authorization;

    // Debugging logs (optional, remove in production)
    console.log("Authorization Header:", authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).json({
            success: false,
            message: "Unauthorized: No token provided"
        });
    }

    const token = authHeader.split(' ')[1].trim();

    try {
        const jwtVerified = jwt.verify(token, process.env.SECRET_ACCESS_TOKEN);
        req.user = jwtVerified;
        next();
    } catch (err) {
        console.error("JWT Error:", err.message);
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
}

 */

/**   */
import jwt from 'jsonwebtoken';
import dotenv from "dotenv";
dotenv.config();

export function identifier(req, res, next) {
  const token = req.cookies.accessToken;

  if (!token) {
    return res.status(403).json({
      success: false,
      message: "Unauthorized: No token provided",
    });
  }

  try {
    const jwtVerified = jwt.verify(token, process.env.SECRET_ACCESS_TOKEN);
    req.user = jwtVerified; // attach user info to req
    next();
  } catch (err) {
    console.error("JWT Error:", err.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired access token",
    });
  }
}
