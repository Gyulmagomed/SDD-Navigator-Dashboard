import { Suspense } from "react";
import { SpecificationsListShell } from "@/components/specifications/specifications-list-shell";

function SpecificationsFallback() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
      <div className="h-80 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}

export default function SpecificationsPage() {
  return (
    <Suspense fallback={<SpecificationsFallback />}>
      <SpecificationsListShell />
    </Suspense>
  );
}
