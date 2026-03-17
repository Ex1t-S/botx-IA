import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { comparePassword, createToken, setAuthCookie } from "../../../../lib/auth";
import { rateLimit } from "../../../../lib/rate-limit";
import { getClientIp, isAllowedOrigin } from "../../../../lib/request";

export async function POST(req: Request) {
	try {
		if (!isAllowedOrigin(req)) {
			return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
		}

		const body = await req.json();
		const email = String(body.email || "").trim().toLowerCase();
		const password = String(body.password || "");
		const ip = getClientIp(req);

		if (!email || !password) {
			return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
		}

		const ipLimit = rateLimit(`login:ip:${ip}`, 10, 15 * 60 * 1000);
		if (!ipLimit.ok) {
			return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
		}

		const emailLimit = rateLimit(`login:email:${email}`, 8, 15 * 60 * 1000);
		if (!emailLimit.ok) {
			return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
		}

		const user = await prisma.user.findUnique({ where: { email } });

		if (!user) {
			return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
		}

		const valid = await comparePassword(password, user.passwordHash);

		if (!valid) {
			return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
		}

		const token = await createToken({ userId: user.id, email: user.email });
		await setAuthCookie(token);

		return NextResponse.json({ ok: true });
	} catch {
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}