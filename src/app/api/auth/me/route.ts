import { NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
export async function GET() {
	const session = await getCurrentUserFromCookie();
	if (!session) {
		return NextResponse.json({ user: null }, { status: 401 });
	}

	const user = await prisma.user.findUnique({
		where: { id: session.userId },
		select: {
			firstName: true,
			lastName: true,
			email: true
		}
	});

	return NextResponse.json({ user });
}