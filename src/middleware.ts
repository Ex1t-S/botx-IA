import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "wallet_demo_token";

if (!process.env.JWT_SECRET) {
	throw new Error("JWT_SECRET is required");
}

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(request: NextRequest) {
	const token = request.cookies.get(COOKIE_NAME)?.value;
	const pathname = request.nextUrl.pathname;

	const isDashboard = pathname.startsWith("/dashboard");
	const isAuthPage = pathname === "/login" || pathname === "/register";

	if (!isDashboard && !isAuthPage) {
		return NextResponse.next();
	}

	if (!token) {
		if (isDashboard) {
			return NextResponse.redirect(new URL("/login", request.url));
		}

		return NextResponse.next();
	}

	try {
		await jwtVerify(token, secret);

		if (isAuthPage) {
			return NextResponse.redirect(new URL("/dashboard", request.url));
		}

		return NextResponse.next();
	} catch {
		const response = isDashboard
			? NextResponse.redirect(new URL("/login", request.url))
			: NextResponse.next();

		response.cookies.set(COOKIE_NAME, "", {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			path: "/",
			maxAge: 0,
		});

		return response;
	}
}

export const config = {
	matcher: ["/dashboard/:path*", "/login", "/register"],
};