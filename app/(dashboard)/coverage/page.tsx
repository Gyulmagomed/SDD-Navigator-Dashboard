import dynamic from "next/dynamic";

const CoverageMap = dynamic(() => import("@/components/coverage/coverage-map").then((mod) => mod.CoverageMap), {
  loading: () => <div className="h-72 animate-pulse rounded-xl bg-muted" />,
});

export default function CoveragePage() {
  return <CoverageMap />;
}
