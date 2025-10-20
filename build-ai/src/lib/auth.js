import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export async function generateToken(userId) {
  const secret = new TextEncoder().encode(JWT_SECRET);
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret);
  return token;
}

export async function verifyToken(token) {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    return null;
  }
}

export async function setAuthCookie(token) {
  const cookieStore = await cookies();
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export async function getAuthToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token');
  return token?.value;
}

export async function removeAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');
}

export async function getCurrentUser() {
  const token = await getAuthToken();
  if (!token) return null;

  const decoded = await verifyToken(token);
  if (!decoded) return null;

  const { User } = await import('@/models/User');
  const user = await User.findById(decoded.userId);

  if (!user) return null;

  // Return user without password
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
