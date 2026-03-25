import { render, screen } from "@testing-library/react";
import { OverviewDashboard } from "@/components/dashboard/overview-dashboard";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock("@/lib/api/hooks", () => ({
  useDashboardStats: jest.fn(),
  useSpecs: jest.fn(),
  useSpecPrefetch: () => jest.fn(),
}));

const hooks = jest.requireMock("@/lib/api/hooks") as {
  useDashboardStats: jest.Mock;
  useSpecs: jest.Mock;
};

describe("integration: KPI cards", () => {
  it("renders KPI values from mocked dashboard hook", () => {
    hooks.useDashboardStats.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        data: {
          totalSpecs: 12,
          avgCoverage: 81.5,
          criticalGaps: 1,
          fullyCoveredSpecs: 3,
          totalSpecsDeltaLastWeek: 2,
          trend: [],
        },
      },
    });
    hooks.useSpecs.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 } },
    });

    render(<OverviewDashboard />);

    expect(screen.getByText("Total Specifications")).toBeInTheDocument();
    expect(screen.getByText("+2 vs last week")).toBeInTheDocument();
    expect(screen.getByText("Average Coverage")).toBeInTheDocument();
    expect(screen.getByText("Critical Gaps")).toBeInTheDocument();
    expect(screen.getByText("Fully Covered")).toBeInTheDocument();
  });

  it("shows skeleton state while loading", () => {
    hooks.useDashboardStats.mockReturnValue({
      isLoading: true,
      isError: false,
      data: undefined,
    });
    hooks.useSpecs.mockReturnValue({
      isLoading: true,
      isError: false,
      data: undefined,
    });

    const { container } = render(<OverviewDashboard />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });
});
