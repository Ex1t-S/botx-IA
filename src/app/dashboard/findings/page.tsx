"use client";

import { useEffect, useState } from "react";

type Finding = {
	id: string;
	network: string;
	address: string;
	balanceCrypto: number;
	balanceUsd: number;
	foundAt: string;
	status: string;
};

export default function FindingsPage() {
	const [findings, setFindings] = useState<Finding[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function loadFindings() {
			const res = await fetch("/api/findings", { cache: "no-store" });
			const data = await res.json();
			setFindings(data.findings || []);
			setLoading(false);
		}

		loadFindings();
	}, []);

	return (
		<div className="dashboard-page">
			<div className="page-header">
				<h1>Findings</h1>
				<p>Wallets found by Killing.</p>
			</div>

			<div className="panel">
				{loading ? (
					<p>Loading findings...</p>
				) : findings.length === 0 ? (
					<p>There are no saved findings yet.</p>
				) : (
					<div className="wallet-table">
						<div className="wallet-row wallet-head">
							<span>Network</span>
							<span>Address</span>
							<span>Crypto balance</span>
							<span>USD balance</span>
							<span>Date</span>
						</div>

						{findings.map((item) => (
							<div className="wallet-row" key={item.id}>
								<span>{item.network}</span>
								<span className="wallet-address">{item.address}</span>
								<span>
									{item.balanceCrypto} {item.network}
								</span>
								<span>${item.balanceUsd.toLocaleString()}</span>
								<span>{new Date(item.foundAt).toLocaleString()}</span>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}