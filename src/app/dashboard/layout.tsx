import Sidebar from "../../components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="dashboard-shell">
			<Sidebar />
			<div className="dashboard-main">{children}</div>
		</div>
	);
}