# Authentication System Documentation

This application includes a complete authentication system with user registration, login, and protected routes.

## Features

- User registration with email, password, and name
- User login with JWT token authentication
- Password hashing using bcrypt
- HTTP-only cookie-based session management
- Protected routes with middleware
- MongoDB user storage
- Client-side and server-side authentication helpers

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── register/route.js    # User registration endpoint
│   │       ├── login/route.js       # User login endpoint
│   │       ├── logout/route.js      # User logout endpoint
│   │       └── me/route.js          # Get current user endpoint
│   │   └── protected/
│   │       └── example/route.js     # Example protected API route
│   ├── login/page.js                # Login page UI
│   └── register/page.js             # Registration page UI
├── lib/
│   ├── mongodb.js                   # MongoDB connection
│   └── auth.js                      # Authentication utilities
├── models/
│   └── User.js                      # User model
└── middleware.js                    # Route protection middleware
```

## Setup Instructions

### 1. Environment Variables

Copy `.env.local.example` to `.env.local` and configure:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/build-ai
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/build-ai

# JWT Secret (Generate a strong random string for production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 2. MongoDB Setup

#### Option A: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB: `mongod`
3. Use connection string: `mongodb://localhost:27017/build-ai`

#### Option B: MongoDB Atlas (Cloud)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string
4. Update `MONGODB_URI` in `.env.local`

### 3. Install Dependencies

Dependencies are already installed, but if needed:

```bash
npm install bcryptjs jsonwebtoken cookie
```

## User Schema

```javascript
{
  _id: ObjectId,
  email: "user@example.com",
  password: "hashed_password",
  name: "John Doe",
  createdAt: ISODate,
  lastLogin: ISODate
}
```

## API Endpoints

### POST `/api/auth/register`

Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### POST `/api/auth/login`

Login an existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### POST `/api/auth/logout`

Logout the current user.

**Response (200 OK):**
```json
{
  "message": "Logout successful"
}
```

### GET `/api/auth/me`

Get the current authenticated user.

**Response (200 OK):**
```json
{
  "user": {
    "_id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "lastLogin": "2025-01-01T00:00:00.000Z"
  }
}
```

## Creating Protected Routes

### Server-Side (API Routes)

Use the `getCurrentUser()` helper in your API routes:

```javascript
// src/app/api/protected/example/route.js
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Your protected logic here
  return NextResponse.json({ data: 'Protected data' });
}
```

### Client-Side (Pages)

Protected pages are automatically handled by the middleware in `src/middleware.js`. Pages starting with `/dashboard` are protected by default.

To protect additional routes, update the `protectedRoutes` array in `src/middleware.js`:

```javascript
const protectedRoutes = ['/dashboard', '/profile', '/settings'];
```

## Client-Side Usage

### Using the API Helpers

```javascript
import { login, register, logout, getCurrentUser } from '@/lib/api';

// Register a new user
const result = await register({
  email: 'user@example.com',
  password: 'password123',
  name: 'John Doe'
});

// Login
const loginResult = await login({
  email: 'user@example.com',
  password: 'password123'
});

// Get current user
const userData = await getCurrentUser();

// Logout
await logout();
```

### Using in Components

```javascript
'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/api';

export default function ProfilePage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    getCurrentUser()
      .then(data => setUser(data.user))
      .catch(err => console.error(err));
  }, []);

  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <p>Email: {user.email}</p>
    </div>
  );
}
```

## Security Features

1. **Password Hashing**: Passwords are hashed using bcrypt with a cost factor of 10
2. **HTTP-Only Cookies**: JWT tokens are stored in HTTP-only cookies to prevent XSS attacks
3. **Secure Cookies**: In production, cookies are sent only over HTTPS
4. **JWT Tokens**: 7-day expiration for session tokens
5. **Email Validation**: Server-side email format validation
6. **Password Requirements**: Minimum 6 characters (can be increased)

## Testing the Authentication Flow

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Register a new user:**
   - Visit `http://localhost:3000/register`
   - Fill in the registration form
   - Submit to create an account

3. **Login:**
   - Visit `http://localhost:3000/login`
   - Enter your credentials
   - You'll be redirected to `/dashboard`

4. **Test protected routes:**
   - Try accessing `/dashboard` without logging in (should redirect to login)
   - Login and access `/dashboard` (should work)

5. **Test the API:**
   - Use tools like Postman or curl to test the API endpoints
   - Check that protected endpoints return 401 without authentication

## Common Issues

### MongoDB Connection Error

If you see "MongoServerError: bad auth", check:
- Your `MONGODB_URI` is correct in `.env.local`
- Your MongoDB instance is running
- Your MongoDB Atlas credentials are correct

### JWT Secret Warning

Always change the default JWT_SECRET in production:
```bash
# Generate a random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Next Steps

1. Add password reset functionality
2. Add email verification
3. Implement refresh tokens
4. Add OAuth providers (Google, GitHub, etc.)
5. Add rate limiting for login attempts
6. Add two-factor authentication (2FA)
7. Add user profile management
8. Add role-based access control (RBAC)
