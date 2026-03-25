import type { Specification } from "@/types";

export type MatrixCellValue = { percent: number; itemCount: number };

const escapeCell = (value: string): string => {
  if (value.includes('"') || value.includes(",") || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export function specificationsToCsv(specs: Specification[]): string {
  const header = [
    "id",
    "name",
    "version",
    "status",
    "coveragePercent",
    "owner",
    "lastUpdated",
  ];
  const rows = specs.map((spec) =>
    [
      spec.id,
      spec.name,
      spec.version,
      spec.status,
      String(spec.coveragePercent),
      spec.owner,
      spec.lastUpdated,
    ].map((cell) => escapeCell(String(cell))),
  );
  return [ header.join(","), ...rows.map((r) => r.join(",")) ].join("\n");
}

export function coverageMatrixToCsv(
  specs: Specification[],
  sections: string[],
  getCell: (specId: string, section: string) => MatrixCellValue | null,
): string {
  const header = ["specId", "name", "owner", "overallCoverage", ...sections];
  const rows = specs.map((spec) => {
    const sectionCells = sections.map((section) => {
      const cell = getCell(spec.id, section);
      if (!cell) {
        return "";
      }
      return `${String(cell.percent)}% (${String(cell.itemCount)} items)`;
    });
    return [
      spec.id,
      spec.name,
      spec.owner,
      String(spec.coveragePercent),
      ...sectionCells,
    ].map((cell) => escapeCell(String(cell)));
  });
  return [header.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

export function downloadTextFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
