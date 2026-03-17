"use client";

import { useEffect, useMemo, useState } from "react";

type Finding = {
	id: string;
	network: "BTC" | "LTC" | "ETH" | "SOL";
	address: string;
	balanceCrypto: number;
	balanceUsd: number;
	status: string;
};

type NetworkOption = {
	key: string;
	label: string;
	feeCrypto: number;
	eta: string;
};

const NETWORK_OPTIONS: Record<string, NetworkOption[]> = {
	BTC: [
		{ key: "BTC", label: "Bitcoin", feeCrypto: 0.0002, eta: "30-60 min" },
		{ key: "LIGHTNING", label: "Lightning", feeCrypto: 0.00001, eta: "5-15 min" },
	],
	LTC: [
		{ key: "LTC", label: "Litecoin", feeCrypto: 0.001, eta: "15-30 min" },
	],
	ETH: [
		{ key: "ERC20", label: "Ethereum (ERC20)", feeCrypto: 0.0035, eta: "5-30 min" },
		{ key: "ARBITRUM", label: "Arbitrum One", feeCrypto: 0.0007, eta: "2-10 min" },
		{ key: "BASE", label: "Base", feeCrypto: 0.0005, eta: "2-10 min" },
	],
	SOL: [
		{ key: "SOL", label: "Solana", feeCrypto: 0.0008, eta: "1-5 min" },
	],
};

export default function WithdrawalsPage() {
	const [findings, setFindings] = useState<Finding[]>([]);
	const [selectedId, setSelectedId] = useState("");
	const [receiveAddress, setReceiveAddress] = useState("");
	const [selectedNetworkKey, setSelectedNetworkKey] = useState("");
	const [msg, setMsg] = useState("");
	const [error, setError] = useState("");

	useEffect(() => {
		async function loadFindings() {
			const res = await fetch("/api/findings", { cache: "no-store" });
			const data = await res.json();
			setFindings((data.findings || []).filter((f: Finding) => f.status === "AVAILABLE"));
		}

		loadFindings();
	}, []);

	const selectedFinding = useMemo(
		() => findings.find((f) => f.id === selectedId) || null,
		[findings, selectedId]
	);

	const availableNetworks = useMemo(() => {
		if (!selectedFinding) return [];
		return NETWORK_OPTIONS[selectedFinding.network] || [];
	}, [selectedFinding]);

	const selectedNetwork = useMemo(() => {
		return availableNetworks.find((n) => n.key === selectedNetworkKey) || null;
	}, [availableNetworks, selectedNetworkKey]);

	const netCrypto = useMemo(() => {
		if (!selectedFinding || !selectedNetwork) return 0;
		return Math.max(0, selectedFinding.balanceCrypto - selectedNetwork.feeCrypto);
	}, [selectedFinding, selectedNetwork]);

	const netUsd = useMemo(() => {
		if (!selectedFinding || !selectedNetwork || selectedFinding.balanceCrypto <= 0) return 0;
		const ratio = netCrypto / selectedFinding.balanceCrypto;
		return Number((selectedFinding.balanceUsd * ratio).toFixed(2));
	}, [selectedFinding, selectedNetwork, netCrypto]);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setMsg("");
		setError("");

		if (!selectedFinding || !selectedNetwork) {
			setError("Select a finding and a withdrawal network");
			return;
		}

		const res = await fetch("/api/withdrawals/request", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				foundWalletId: selectedFinding.id,
				receiveAddress,
				network: selectedNetwork.key,
			}),
		});

		const data = await res.json();

		if (!res.ok) {
			setError(data.error || "Could not request the withdrawal");
			return;
		}

		setMsg(data.message || "Request created");
		setSelectedId("");
		setSelectedNetworkKey("");
		setReceiveAddress("");
	}

	return (
		<div className="dashboard-page">
			<div className="page-header">
				<h1>Withdrawals</h1>
				<p>Demo withdrawal request / manual review for simulated findings.</p>
			</div>

			<div className="panel">
				<form className="license-form" onSubmit={handleSubmit}>
					<select
						value={selectedId}
						onChange={(e) => {
							setSelectedId(e.target.value);
							setSelectedNetworkKey("");
						}}
						required
					>
						<option value="">Select a finding</option>
						{findings.map((item) => (
							<option key={item.id} value={item.id}>
								{item.network} - {item.balanceCrypto} - ${item.balanceUsd}
							</option>
						))}
					</select>

					{selectedFinding && (
						<div className="withdraw-network-box">
							<div className="withdraw-network-box__title">Withdrawal network</div>

							<div className="withdraw-network-grid">
								{availableNetworks.map((option) => (
									<button
										type="button"
										key={option.key}
										className={`withdraw-network-card ${
											selectedNetworkKey === option.key ? "is-active" : ""
										}`}
										onClick={() => setSelectedNetworkKey(option.key)}
									>
										<div className="withdraw-network-card__top">
											<strong>{option.label}</strong>
											<span>{option.key}</span>
										</div>
										<div className="withdraw-network-card__meta">
											<span>Fee: {option.feeCrypto}</span>
											<span>ETA: {option.eta}</span>
										</div>
									</button>
								))}
							</div>
						</div>
					)}

					<input
						placeholder="Receiving address"
						value={receiveAddress}
						onChange={(e) => setReceiveAddress(e.target.value)}
						required
					/>

					<div className="withdraw-summary">
						{selectedFinding && selectedNetwork ? (
							<>
								<p>
									Gross amount: {selectedFinding.balanceCrypto} {selectedFinding.network} ≈ $
									{selectedFinding.balanceUsd.toLocaleString()}
								</p>
								<p>
									Network fee: {selectedNetwork.feeCrypto} {selectedFinding.network}
								</p>
								<p>
									Estimated net amount: {netCrypto.toFixed(6)} {selectedFinding.network} ≈ $
									{netUsd.toLocaleString()}
								</p>
							</>
						) : (
							<p>Select a finding and a network to calculate the withdrawal.</p>
						)}
					</div>

					<button className="btn btn-primary">Request withdrawal</button>
				</form>

				{msg && <div className="info-box">{msg}</div>}
				{error && <div className="error-box">{error}</div>}
			</div>
		</div>
	);
}