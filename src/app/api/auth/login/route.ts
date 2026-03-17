import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { comparePassword, createToken, setAuthCookie } from "../../../../lib/auth";

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const email = String(body.email || "").trim().toLowerCase();
		const password = String(body.password || "");

		if (!email || !password) {
			return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
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