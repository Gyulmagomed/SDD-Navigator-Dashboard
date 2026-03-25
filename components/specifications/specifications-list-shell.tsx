"use client";

import type { ReactElement } from "react";
import { useSearchParams } from "next/navigation";
import { SpecificationsList } from "@/components/specifications/specifications-list";

export function SpecificationsListShell(): ReactElement {
  const searchParams = useSearchParams();
  return <SpecificationsList key={searchParams.toString()} />;
}
