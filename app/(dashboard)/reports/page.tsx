import dynamic from "next/dynamic";

const ReportsWorkspace = dynamic(
  () => import("@/components/reports/reports-workspace").then((mod) => mod.ReportsWorkspace),
  {
    loading: () => <div className="h-72 animate-pulse rounded-xl bg-muted" />,
  },
);

export default function ReportsPage() {
  return <ReportsWorkspace />;
}
