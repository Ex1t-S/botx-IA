import MachineSimulator from "../../../components/MachineSimulator";

export default function MachinePage() {
	return (
		<div className="dashboard-page">
			<div className="page-header">
				<h1>Machine</h1>
			</div>

			<MachineSimulator />
		</div>
	);
}