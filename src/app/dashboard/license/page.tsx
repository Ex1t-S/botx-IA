"use client";

import { useEffect, useState } from "react";

type LicenseInfo = {
	active: boolean;
	tier: string | null;
	priceUsd: number | null;
	keysPerMinute: number;
	expiresAt: string | null;
	code: string | null;
	status?: string;
};

const LICENSE_PLANS = [
	{
		name: "Starter",
		code: "BOTX-STARTER-50",
		price: "$50",
		keysPerMinute: "1,000 keys/min",
		description: "Ideal for getting started with a base simulation speed.",
	},
	{
		name: "Pro",
		code: "BOTX-PRO-200",
		price: "$200",
		keysPerMinute: "10,000 keys/min",
		description: "Higher scan speed and a better simulation pace.",
	},
	{
		name: "Ultra",
		code: "BOTX-ULTRA-500",
		price: "$500",
		keysPerMinute: "35,000 keys/min",
		description: "Maximum speed available in the demo.",
	},
];

export default function LicensePage() {
	const [code, setCode] = useState("");
	const [msg, setMsg] = useState("");
	const [error, setError] = useState("");
	const [info, setInfo] = useState<LicenseInfo>({
		active: false,
		tier: null,
		priceUsd: null,
		keysPerMinute: 0,
		expiresAt: null,
		code: null,
		status: "INACTIVE",
	});

	async function refresh() {
		const res = await fetch("/api/machine/state", { cache: "no-store" });
		const data = await res.json();
		setInfo(data.license);
	}

	useEffect(() => {
		refresh();
	}, []);

	async function activate(e: React.FormEvent) {
		e.preventDefault();
		setMsg("");
		setError("");

		const res = await fetch("/api/license/activate", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ code }),
		});

		const data = await res.json();

		if (!res.ok) {
			setError(data.error || "Could not activate license");
			return;
		}

		setMsg(data.message || "License activated");
		setCode("");
		refresh();
	}

	function fillCode(planCode: string) {
		setCode(planCode);
		setMsg("");
		setError("");
	}

	return (
		<div className="dashboard-page">
			<div className="page-header">
				<h1>License</h1>
				<p>
					Activate a plan to power on the machine. If you already have an active one and enter a higher-tier code, your license will be upgraded automatically.
				</p>
			</div>

			<div className="license-cards-grid">
				{LICENSE_PLANS.map((plan) => (
					<div key={plan.code} className="license-plan-card">
						<div className="license-plan-card__top">
							<h3>{plan.name}</h3>
							<span className="license-plan-card__price">{plan.price}</span>
						</div>

						<p className="license-plan-card__speed">{plan.keysPerMinute}</p>
						<p className="license-plan-card__description">{plan.description}</p>

						
					</div>
				))}
			</div>

			<div className="panel license-panel">
				<form onSubmit={activate} className="license-form">
					<input
						placeholder="Enter your license code"
						value={code}
						onChange={(e) => setCode(e.target.value)}
						required
					/>
					<button className="btn btn-primary">Activate license</button>
				</form>

				<div className="license-state">
					<div className={`license-pill ${info.active ? "ok" : "off"}`}>
						{info.active ? "Active" : "Inactive"}
					</div>

					<p>
						<strong>Current license:</strong> {info.tier || "No plan"}
					</p>
					<p>
						<strong>Speed:</strong> {info.keysPerMinute.toLocaleString()} keys/min
					</p>
					<p>
						<strong>Expiration:</strong> {info.expiresAt || "Not activated yet"}
					</p>

					{msg && <div className="info-box">{msg}</div>}
					{error && <div className="error-box">{error}</div>}
				</div>
			</div>
		</div>
	);
}