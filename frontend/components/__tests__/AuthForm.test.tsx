import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthForm from "@/components/AuthForm";

describe("AuthForm", () => {
  it("calls onSubmit with the entered email and password", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({ status: "ok" });
    render(<AuthForm submitLabel="Sign up" onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Email"), "a@b.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign up" }));

    expect(onSubmit).toHaveBeenCalledWith({ email: "a@b.com", password: "password123" });
    expect(await screen.findByText("Success.")).toBeInTheDocument();
  });

  it("shows the error message when onSubmit rejects", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error("email must be an email"));
    render(<AuthForm submitLabel="Sign in" onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Email"), "a@b.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("email must be an email")).toBeInTheDocument();
  });
});
