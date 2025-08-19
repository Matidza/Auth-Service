 import jwt from 'jsonwebtoken';
import dotenv from "dotenv";
dotenv.config();
 
export const refreshTokenHandler = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;
        if (!token) return res.status(401).json({ success: false, message: 'No refresh token' });
        const payload = jwt.verify(token, process.env.SECRET_REFRESH_TOKEN);
        const user = await UserModel.findById(payload.userId);
        if (!user) return res.status(401).json({ success: false, message: 'User not found' });
        const newAccessToken = jwt.sign(
            { userId: user._id, email: user.email, user_type: user.user_type },
            process.env.SECRET_ACCESS_TOKEN,
            { expiresIn: '30m' }
        );
        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 30 * 60 * 1000
        });
        res.json({ success: true, message: 'Access token refreshed' });
        } catch (error) {
        console.error('Refresh Token Error:', error);
        res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }
}