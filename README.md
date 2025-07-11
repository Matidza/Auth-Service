
---

```markdown
# 🔐 Auth Microservice

The **Auth Microservice** is responsible for handling user authentication, registration, session management, and account recovery in the SaaS platform. It issues and verifies secure, HTTP-only cookie-based access tokens to protect communication across services.

---

## 🚀 Features

- User Registration & Login (Email + Password)
- Cookie-based Auth Flow (Access + Refresh tokens)
- Forgot & Reset Password functionality
- User Type Management (Mentee / Mentor switch)
- OAuth support (Google, GitHub)
- Role-based route protection
- Token invalidation on logout

---

## 🧱 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Auth:** JWT tokens stored in HTTP-only cookies
- **OAuth:** Passport.js (Google, GitHub)
- **Other:** bcrypt, nodemailer, dotenv, morgan, helmet, cors

---

## 📁 Folder Structure

```

auth-service/
│
├── controllers/         # Logic for login, signup, reset, etc.
├── routes/              # Route definitions
├── models/              # MongoDB schemas
├── middlewares/         # Auth guards, validation, error handling
├── services/            # Email service, token service
├── utils/               # Utility helpers (token creation, hashing)
├── config/              # DB config and env loader
├── index.js             # Entry point
├── package.json
└── README.md

````

---

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/auth-service.git
cd auth-service
````

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root:

```env
PORT=5001
MONGO_URI=mongodb://localhost:27017/saas-auth
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=15m
COOKIE_SECRET=your_cookie_secret
CLIENT_URL=http://localhost:3000

# Mail
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your@email.com
EMAIL_PASS=your-email-password

# OAuth
GITHUB_CLIENT_ID=your_id
GITHUB_CLIENT_SECRET=your_secret
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret
```

### 4. Run the Server

```bash
# Dev mode
npm run dev

# Production
npm start
```

---

## 🧪 API Endpoints

### Auth

* `POST /api/auth/register` – Create account (default role: mentee)
* `POST /api/auth/login` – Login and receive cookies
* `POST /api/auth/logout` – Invalidate cookies

### OAuth

* `GET /api/auth/google` – Google OAuth login
* `GET /api/auth/github` – GitHub OAuth login

### Password Reset

* `POST /api/auth/forgot-password` – Send reset email
* `PATCH /api/auth/reset-password/:token` – Reset password

### User Role

* `PATCH /api/auth/join-as-mentor` – Change role to mentor

---

## 🔐 Authentication Strategy

* Secure **HTTP-only cookies** store JWT access and refresh tokens.
* Middleware verifies tokens before protected route access.
* Supports cross-service authentication via token verification (for Dashboard, etc.).

---

## 🔄 Communication with Other Microservices

* **Dashboard-Service:** Receives and verifies token-protected requests
* **Future Services:** Will interact via token + user ID embedded in cookie/session

---

## 🔧 Development Tools

* **Nodemon** for live reloading in development
* **Mongoose** for MongoDB integration
* **Passport** for OAuth
* **Jest + Supertest** (optional) for unit/integration testing

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

Matidza M.Z
[GitHub](https://github.com/Matidza)
SaaS Project — 2025

---

```

