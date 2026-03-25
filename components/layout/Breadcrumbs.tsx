"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LABEL_MAP: Record<string, string> = {
  specifications: "Specifications",
  coverage: "Coverage Map",
  reports: "Reports",
  login: "Login",
};

const prettifySegment = (segment: string): string => {
  const fromMap = LABEL_MAP[segment];
  if (fromMap) {
    return fromMap;
  }

  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return <p className="text-sm text-muted-foreground">Overview</p>;
  }

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <ol className="flex items-center gap-2">
        <li>
          <Link href="/" className="hover:text-foreground">
            Overview
          </Link>
        </li>
        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join("/")}`;
          const isCurrent = index === segments.length - 1;

          return (
            <li key={href} className="flex items-center gap-2">
              <span>/</span>
              {isCurrent ? (
                <span aria-current="page" className="text-foreground">
                  {prettifySegment(segment)}
                </span>
              ) : (
                <Link href={href} className="hover:text-foreground">
                  {prettifySegment(segment)}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
