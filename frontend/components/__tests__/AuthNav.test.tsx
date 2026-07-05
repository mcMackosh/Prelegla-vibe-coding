import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthNav from "@/components/AuthNav";
import { clearSession, setSession } from "@/lib/session";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe("AuthNav", () => {
  afterEach(() => {
    clearSession();
    pushMock.mockClear();
  });

  it("shows Sign in / Sign up links when there is no session", () => {
    render(<AuthNav />);

    expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign up" })).toBeInTheDocument();
  });

  it("shows the email, My Documents link, and Sign out button when signed in", () => {
    setSession("jwt-token", "a@b.com");
    render(<AuthNav />);

    expect(screen.getByText("a@b.com")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "My Documents" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });

  it("clears the session and navigates home when Sign out is clicked", async () => {
    setSession("jwt-token", "a@b.com");
    const user = userEvent.setup();
    render(<AuthNav />);

    await user.click(screen.getByRole("button", { name: "Sign out" }));

    expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument();
    expect(pushMock).toHaveBeenCalledWith("/");
  });
});
