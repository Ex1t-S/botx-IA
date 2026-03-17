import MachineSimulator from "../../components/MachineSimulator";

export default function DashboardHome() {
	return (
		<div className="dashboard-page">
			<div className="page-header">
				<h1>Home</h1>
				<p>Overview of the Kiling 2.0 machine.</p>
			</div>
			<MachineSimulator />
		</div>
	);
}