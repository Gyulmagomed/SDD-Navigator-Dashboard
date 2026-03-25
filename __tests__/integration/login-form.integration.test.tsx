import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import LoginPage from "@/app/(auth)/login/page";

const pushMock = jest.fn();
const refreshMock = jest.fn();
const signInMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

jest.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => signInMock(...args),
}));

describe("integration: login form", () => {
  beforeEach(() => {
    pushMock.mockReset();
    refreshMock.mockReset();
    signInMock.mockReset();
  });

  it("validates invalid form inputs", async () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
    expect(await screen.findByText("Password must be at least 6 characters")).toBeInTheDocument();
  });

  it("shows 401-like auth error", async () => {
    signInMock.mockResolvedValue({ error: "CredentialsSignin" });

    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret1" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid credentials or network error.");
  });

  it("redirects on successful login", async () => {
    signInMock.mockResolvedValue({ ok: true, error: undefined });

    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret1" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/"));
    expect(refreshMock).toHaveBeenCalled();
  });
});
