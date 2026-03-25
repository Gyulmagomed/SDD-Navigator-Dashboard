import { useFilterStore } from "@/lib/store/filterStore";
import { useNotificationStore } from "@/lib/store/notificationStore";
import { useUiStore } from "@/lib/store/uiStore";

describe("zustand stores", () => {
  beforeEach(() => {
    useUiStore.setState({
      sidebarCollapsed: false,
      themePreference: "system",
      activeFilters: {},
    });
    useNotificationStore.setState({ notifications: [] });
    useFilterStore.setState({ dashboardFilters: {} });
  });

  it("uiStore updates sidebar and filters", () => {
    useUiStore.getState().setSidebarCollapsed(true);
    expect(useUiStore.getState().sidebarCollapsed).toBe(true);
    useUiStore.getState().setActiveFilters({ status: "active" });
    expect(useUiStore.getState().activeFilters.status).toBe("active");
    useUiStore.getState().clearActiveFilters();
    expect(useUiStore.getState().activeFilters).toEqual({});
  });

  it("notificationStore adds and marks read", () => {
    const id = useNotificationStore.getState().addNotification({ title: "Hello", body: "World" });
    expect(useNotificationStore.getState().notifications).toHaveLength(1);
    expect(useNotificationStore.getState().notifications[0].read).toBe(false);
    useNotificationStore.getState().markRead(id);
    expect(useNotificationStore.getState().notifications[0].read).toBe(true);
    useNotificationStore.getState().clearAll();
    expect(useNotificationStore.getState().notifications).toHaveLength(0);
  });

  it("filterStore merges dashboard filters", () => {
    useFilterStore.getState().setDashboardFilters({ status: "draft", owner: "team-a" });
    expect(useFilterStore.getState().dashboardFilters).toMatchObject({
      status: "draft",
      owner: "team-a",
    });
    useFilterStore.getState().resetDashboardFilters();
    expect(useFilterStore.getState().dashboardFilters).toEqual({});
  });
});
