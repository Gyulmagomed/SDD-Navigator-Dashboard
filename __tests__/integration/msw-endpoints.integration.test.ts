import { getCoverageBySpec, getDashboardStats, getSpecById, getSpecs } from "@/lib/api/endpoints";

describe("integration: msw endpoints", () => {
  it("serves dashboard stats through MSW", async () => {
    const result = await getDashboardStats();
    expect(result.data.totalSpecs).toBeGreaterThan(0);
  });

  it("serves paginated specifications and detail", async () => {
    const list = await getSpecs({ page: 1, pageSize: 5 });
    expect(list.data.length).toBe(5);
    const detail = await getSpecById(list.data[0].id);
    expect(detail.data.id).toEqual(list.data[0].id);
  });

  it("serves coverage by specification", async () => {
    const coverage = await getCoverageBySpec("spec-1");
    expect(coverage.data.length).toBeGreaterThan(0);
  });
});
