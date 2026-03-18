import { NextResponse } from "next/server";
import { processActiveMachines } from "../../../../lib/machine-processor";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
	const authHeader = request.headers.get("authorization");

	if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const result = await processActiveMachines();

		return NextResponse.json({
			ok: true,
			...result,
		});
	} catch (error) {
		console.error("machine-tick error", error);

		return NextResponse.json(
			{
				ok: false,
				error: "Internal error",
			},
			{ status: 500 }
		);
	}
}