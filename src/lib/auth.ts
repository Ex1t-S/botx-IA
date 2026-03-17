import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret");
const COOKIE_NAME = "wallet_demo_token";

export async function hashPassword(password: string) {
	return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
	return bcrypt.compare(password, hash);
}

export async function createToken(payload: { userId: string; email: string }) {
	return new SignJWT(payload)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("7d")
		.sign(secret);
}

export async function verifyToken(token: string) {
	const { payload } = await jwtVerify(token, secret);
	return payload as { userId: string; email: string };
}

export async function setAuthCookie(token: string) {
	const store = await cookies();
	store.set(COOKIE_NAME, token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		maxAge: 60 * 60 * 24 * 7
	});
}

export async function clearAuthCookie() {
	const store = await cookies();
	store.set(COOKIE_NAME, "", {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		maxAge: 0
	});
}

export async function getCurrentUserFromCookie() {
	try {
		const store = await cookies();
		const token = store.get(COOKIE_NAME)?.value;
		if (!token) return null;
		return await verifyToken(token);
	} catch {
		return null;
	}
}