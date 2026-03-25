import { fireEvent, render, screen } from "@testing-library/react";
import { SpecificationsList } from "@/components/specifications/specifications-list";
import { usePreferencesStore } from "@/lib/store/preferencesStore";

const replaceMock = jest.fn();
const prefetchMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, push: jest.fn() }),
  useSearchParams: () => new URLSearchParams("page=1&sortBy=name&sortOrder=asc"),
}));

jest.mock("@/lib/api/hooks", () => ({
  useSpecs: jest.fn(),
  useSpecsInfinite: jest.fn(),
  useSpecPrefetch: () => prefetchMock,
}));

const hooks = jest.requireMock("@/lib/api/hooks") as {
  useSpecs: jest.Mock;
  useSpecsInfinite: jest.Mock;
};

describe("integration: filters and spec table", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    prefetchMock.mockReset();
    usePreferencesStore.setState({ specsListMode: "pagination" });

    hooks.useSpecs.mockReturnValue({
      isLoading: false,
      isError: false,
      error: null,
      data: {
        data: [
          {
            id: "spec-1",
            name: "Alpha",
            version: "1.0.0",
            status: "active",
            totalItems: 100,
            coveredItems: 80,
            coveragePercent: 80,
            lastUpdated: "2026-03-20T10:00:00.000Z",
            owner: "team-a",
          },
        ],
        meta: { page: 1, pageSize: 20, total: 40, totalPages: 2 },
      },
    });
    hooks.useSpecsInfinite.mockReturnValue({
      isPending: false,
      isError: false,
      error: null,
      data: undefined,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
    });
  });

  it("updates query params when sort changes", () => {
    render(<SpecificationsList />);
    fireEvent.change(screen.getByLabelText("Sort specifications"), {
      target: { value: "coverage" },
    });
    expect(replaceMock).toHaveBeenCalled();
    expect(String(replaceMock.mock.calls[0][0])).toContain("sortBy=coverage");
  });

  it("handles pagination next button", () => {
    render(<SpecificationsList />);
    fireEvent.click(screen.getByText("Next"));
    expect(replaceMock).toHaveBeenCalled();
    expect(String(replaceMock.mock.calls[0][0])).toContain("page=2");
  });

  it("prefetches on row hover", () => {
    render(<SpecificationsList />);
    fireEvent.mouseEnter(screen.getByLabelText("Open specification Alpha"));
    expect(prefetchMock).toHaveBeenCalledWith("spec-1");
  });
});
