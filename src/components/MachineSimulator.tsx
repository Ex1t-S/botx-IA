"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import StatCard from "./StatCard";

type WalletItem = {
	id: string;
	network: string;
	address: string;
	balanceCrypto?: number;
	balanceUsd?: number;
	balance?: string;
	foundAt: string;
	priceSnapshotUsd?: number | null;
};

type MachineResponse = {
	phrase: string[];
	attemptsPerTick: number;
	attemptsPerMinute?: number;
	totalAttempts?: number;
	totalFoundWallets?: number;
	uptimeHours: number;
	uptimeSeconds?: number;
	uptimeText?: string;
	status: string;
	nextDiscoveryEta: string;
	serverNow?: string;
	wallet: WalletItem | null;
	recentWallets?: WalletItem[];
	license: {
		active: boolean;
		expiresAt: string | null;
		tier?: string | null;
		priceUsd?: number | null;
		keysPerMinute?: number | null;
		status?: string | null;
	};
};

type StreamLine = {
	words: string[];
};

type LiveCounters = {
	baseAttempts: number;
	baseUptimeSeconds: number;
	attemptsPerSecond: number;
	syncedAt: number;
};

const STREAM_SIZE = 10;
const CASCADE_MS = 250;
const API_POLL_MS = 4000;
const COUNTER_TICK_MS = 250;

function rotateWords(words: string[], shift: number) {
	if (!words.length) return [];
	const normalizedShift = ((shift % words.length) + words.length) % words.length;
	return [...words.slice(normalizedShift), ...words.slice(0, normalizedShift)];
}

function mutateWords(baseWords: string[], seed: number) {
	if (!baseWords.length) return [];

	const words = rotateWords(baseWords, seed % Math.max(1, baseWords.length));
	const cloned = [...words];

	if (cloned.length >= 4) {
		const a = seed % cloned.length;
		const b = (seed * 3 + 1) % cloned.length;
		[cloned[a], cloned[b]] = [cloned[b], cloned[a]];
	}

	if (cloned.length >= 8 && seed % 2 === 0) {
		const c = (seed + 2) % cloned.length;
		const d = (seed + 5) % cloned.length;
		[cloned[c], cloned[d]] = [cloned[d], cloned[c]];
	}

	return cloned;
}

function buildInitialStream(basePhrase: string[]) {
	const lines: StreamLine[] = [];

	for (let i = 0; i < STREAM_SIZE; i++) {
		lines.push({
			words: mutateWords(basePhrase, i + 1),
		});
	}

	return lines;
}

function formatAttemptsDisplay(value: number) {
	if (!Number.isFinite(value) || value <= 0) return "0";

	const safeValue = Math.floor(value);

	if (safeValue >= 1_000_000_000) {
		const billions = safeValue / 1_000_000_000;
		return `${new Intl.NumberFormat("en-US", {
			minimumFractionDigits: billions < 10 ? 1 : 0,
			maximumFractionDigits: billions < 10 ? 1 : 0,
		}).format(billions)}B`;
	}

	if (safeValue >= 1_000_000) {
		const millions = safeValue / 1_000_000;
		return `${new Intl.NumberFormat("en-US", {
			minimumFractionDigits: millions < 100 ? 1 : 0,
			maximumFractionDigits: millions < 100 ? 1 : 0,
		}).format(millions)}M`;
	}

	if (safeValue >= 1_000) {
		const thousands = safeValue / 1_000;
		return `${new Intl.NumberFormat("en-US", {
			minimumFractionDigits: thousands < 100 ? 1 : 0,
			maximumFractionDigits: thousands < 100 ? 1 : 0,
		}).format(thousands)}K`;
	}

	return safeValue.toLocaleString("en-US");
}

function formatClock(totalSeconds: number) {
	const safe = Math.max(0, Math.floor(totalSeconds));
	const hours = Math.floor(safe / 3600);
	const minutes = Math.floor((safe % 3600) / 60);
	const seconds = safe % 60;

	if (hours > 0) {
		return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
	}

	return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function MachineSimulator() {
	const [data, setData] = useState<MachineResponse | null>(null);
	const [streamLines, setStreamLines] = useState<StreamLine[]>([]);
	const [basePhrase, setBasePhrase] = useState<string[]>([]);
	const [displayAttempts, setDisplayAttempts] = useState(0);
	const [displayUptimeSeconds, setDisplayUptimeSeconds] = useState(0);

	const latestDataRef = useRef<MachineResponse | null>(null);
	const liveCountersRef = useRef<LiveCounters>({
		baseAttempts: 0,
		baseUptimeSeconds: 0,
		attemptsPerSecond: 0,
		syncedAt: 0,
	});

	useEffect(() => {
		latestDataRef.current = data;
	}, [data]);

	useEffect(() => {
		let mounted = true;

		async function loadState() {
			try {
				const res = await fetch("/api/machine/state", { cache: "no-store" });

				if (!res.ok) {
					console.error("Could not fetch machine state");
					return;
				}

				const json: MachineResponse = await res.json();

				if (!mounted) return;

				setData(json);

				const isActive = Boolean(json.license?.active);
				const attempts = json.totalAttempts ?? 0;
				const uptimeSeconds = json.uptimeSeconds ?? 0;
				const attemptsPerMinute =
					json.attemptsPerMinute ?? json.license?.keysPerMinute ?? 0;

				liveCountersRef.current = {
					baseAttempts: attempts,
					baseUptimeSeconds: uptimeSeconds,
					attemptsPerSecond: isActive ? attemptsPerMinute / 60 : 0,
					syncedAt: Date.now(),
				};

				setDisplayAttempts(attempts);
				setDisplayUptimeSeconds(uptimeSeconds);

				if (!isActive) {
					setBasePhrase([]);
					setStreamLines([]);
					return;
				}

				if ((json.phrase?.length ?? 0) > 0) {
					setBasePhrase(json.phrase);
					setStreamLines((prev) =>
						prev.length === 0 ? buildInitialStream(json.phrase) : prev
					);
				}
			} catch (error) {
				console.error("Error loading machine state", error);
			}
		}

		void loadState();
		const apiInterval = setInterval(loadState, API_POLL_MS);

		return () => {
			mounted = false;
			clearInterval(apiInterval);
		};
	}, []);

	useEffect(() => {
		const counterInterval = setInterval(() => {
			const current = latestDataRef.current;
			const live = liveCountersRef.current;

			if (!current || !current.license?.active) {
				setDisplayAttempts(current?.totalAttempts ?? 0);
				setDisplayUptimeSeconds(current?.uptimeSeconds ?? 0);
				return;
			}

			const elapsedSeconds = Math.max(0, (Date.now() - live.syncedAt) / 1000);
			const nextAttempts = live.baseAttempts + elapsedSeconds * live.attemptsPerSecond;
			const nextUptime = live.baseUptimeSeconds + elapsedSeconds;

			setDisplayAttempts(nextAttempts);
			setDisplayUptimeSeconds(nextUptime);
		}, COUNTER_TICK_MS);

		return () => clearInterval(counterInterval);
	}, []);

	useEffect(() => {
		const cascadeInterval = setInterval(() => {
			const current = latestDataRef.current;
			if (!current || !current.license?.active) return;
			if (!basePhrase.length) return;

			setStreamLines((prev) => {
				const newLine: StreamLine = {
					words: mutateWords(basePhrase, Date.now() % 17),
				};

				return [newLine, ...prev].slice(0, STREAM_SIZE);
			});
		}, CASCADE_MS);

		return () => clearInterval(cascadeInterval);
	}, [basePhrase]);

	useEffect(() => {
		if (!data?.license?.active) return;
		if (!data?.phrase?.length) return;

		setBasePhrase(data.phrase);
	}, [data?.phrase, data?.license?.active]);

	const phraseRows = useMemo(() => streamLines.slice(0, STREAM_SIZE), [streamLines]);

	if (!data) {
		return <div className="panel">Loading engine...</div>;
	}

	const machineIsActive = Boolean(data.license?.active);
	const findingsCount = data.totalFoundWallets ?? data.recentWallets?.length ?? 0;

	return (
	<div className="machine-grid">
		<div className="panel panel-lg">
			<div className="panel__top">
				<div>
					<h2>Killing 2.0 </h2>
					<p>
						{machineIsActive
							? "Scan in progress."
							: "Machine stopped. Activate a license to start ."}
					</p>
				</div>

				<div className={`license-pill ${machineIsActive ? "ok" : "off"}`}>
					{machineIsActive ? "Active license" : "No license"}
				</div>
			</div>

			<div style={{ marginTop: 10 }}>
				{!machineIsActive ? (
					<div
						style={{
							borderRadius: 16,
							border: "1px solid rgba(255,255,255,.06)",
							background: "rgba(255,255,255,.03)",
							padding: "18px 16px",
							color: "#9fb5d9",
						}}
					>
						The scan is paused until you activate a valid license.
					</div>
				) : (
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							gap: 8,
						}}
					>
						{phraseRows.map((line, index) => (
							<div
								key={`stream-${index}`}
								style={{
									display: "block",
									padding: "9px 10px",
									borderRadius: 16,
									background:
										index === 0
											? "linear-gradient(180deg, rgba(56,189,248,.11), rgba(56,189,248,.05))"
											: "rgba(255,255,255,0.035)",
									border:
										index === 0
											? "1px solid rgba(56,189,248,.25)"
											: "1px solid rgba(255,255,255,.05)",
									opacity: 1 - index * 0.065,
									boxShadow:
										index === 0
											? "0 0 0 1px rgba(99,102,241,.08) inset"
											: "none",
									transition: "all .22s ease",
								}}
							>
								<div
									style={{
										display: "flex",
										flexWrap: "wrap",
										gap: 6,
									}}
								>
									{line.words.map((word, wordIndex) => (
										<span
											key={`word-${index}-${word}-${wordIndex}`}
											style={{
												display: "inline-flex",
												alignItems: "center",
												padding: index === 0 ? "6px 11px" : "5px 10px",
												borderRadius: 999,
												background:
													index === 0
														? "rgba(99,102,241,.16)"
														: "rgba(255,255,255,.04)",
												border:
													index === 0
														? "1px solid rgba(99,102,241,.28)"
														: "1px solid rgba(255,255,255,.055)",
												color: index === 0 ? "#f8fbff" : "#cedcf5",
												fontSize: 13,
												lineHeight: 1,
												fontFamily:
													"ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
											}}
										>
											{word}
										</span>
									))}
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			<div className="machine-status">{data.status}</div>
		</div>

		<div className="stats-grid">
			<StatCard
				label="Total attempts"
				value={machineIsActive ? formatAttemptsDisplay(displayAttempts) : "0"}
			/>
			<StatCard
				label="Active time"
				value={machineIsActive ? formatClock(displayUptimeSeconds) : "00:00"}
			/>
			<StatCard label="Estimated next finding" value={data.nextDiscoveryEta} />
			<StatCard label="Findings" value={findingsCount} />
			<StatCard label="License type" value={data.license.tier || "No license"} />
			<StatCard
				label="License expiration"
				value={data.license.expiresAt || "Inactive"}
			/>
		</div>
	</div>
);
}