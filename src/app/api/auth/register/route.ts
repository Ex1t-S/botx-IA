import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { createToken, hashPassword, setAuthCookie } from "../../../../lib/auth";

function validatePassword(password: string) {
	const hasUpper = /[A-Z]/.test(password);
	const hasLower = /[a-z]/.test(password);
	const hasNumber = /\d/.test(password);
	const hasSpecial = /[^A-Za-z0-9]/.test(password);

	if (password.length < 8) return "Password must be at least 8 characters long";
	if (!hasUpper) return "Password must include at least one uppercase letter";
	if (!hasLower) return "Password must include at least one lowercase letter";
	if (!hasNumber) return "Password must include at least one number";
	if (!hasSpecial) return "Password must include at least one special character";
	return "";
}

export async function POST(req: Request) {
	try {
		const body = await req.json();

		const firstName = String(body.firstName || "").trim();
		const lastName = String(body.lastName || "").trim();
		const email = String(body.email || "").trim().toLowerCase();
		const password = String(body.password || "");

		if (!firstName || !lastName || !email || !password) {
			return NextResponse.json({ error: "Missing fields" }, { status: 400 });
		}

		if (firstName.length > 60 || lastName.length > 60 || email.length > 160) {
			return NextResponse.json({ error: "Input too long" }, { status: 400 });
		}

		const passwordError = validatePassword(password);
		if (passwordError) {
			return NextResponse.json({ error: passwordError }, { status: 400 });
		}

		const existing = await prisma.user.findUnique({ where: { email } });

		if (existing) {
			return NextResponse.json({ error: "That email already exists" }, { status: 409 });
		}

		const passwordHash = await hashPassword(password);

		const user = await prisma.user.create({
			data: {
				firstName,
				lastName,
				email,
				passwordHash,
			},
		});

		await prisma.license.create({
			data: {
				userId: user.id,
				tier: "STARTER",
				priceUsd: 50,
				keysPerMinute: 1000,
				machineEnabled: false,
				status: "INACTIVE",
			},
		});

		const token = await createToken({ userId: user.id, email: user.email });
		await setAuthCookie(token);

		return NextResponse.json({ ok: true });
	} catch {
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}