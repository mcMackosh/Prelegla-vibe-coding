import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NdaChatPanel from "@/components/NdaChatPanel";
import { sendNdaChatMessage } from "@/lib/chat";

vi.mock("@/lib/chat", () => ({
  sendNdaChatMessage: vi.fn(),
}));

async function openChat(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Open chat assistant" }));
}

describe("NdaChatPanel", () => {
  it("stays closed until the toggle button is clicked", () => {
    render(<NdaChatPanel onFieldsExtracted={vi.fn()} />);

    expect(screen.queryByPlaceholderText("Type a message…")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open chat assistant" })).toBeInTheDocument();
  });

  it("renders a greeting message once opened", async () => {
    const user = userEvent.setup();
    render(<NdaChatPanel onFieldsExtracted={vi.fn()} />);

    await openChat(user);

    expect(screen.getByText(/Hi! I can help you fill out your Mutual NDA/)).toBeInTheDocument();
  });

  it("sends the typed message, renders the assistant reply, and reports extracted fields", async () => {
    const user = userEvent.setup();
    const onFieldsExtracted = vi.fn();
    vi.mocked(sendNdaChatMessage).mockResolvedValue({
      reply: "Got it, what is Party A's address?",
      fields: { partyAName: "Acme Corp." },
    });

    render(<NdaChatPanel onFieldsExtracted={onFieldsExtracted} />);
    await openChat(user);

    await user.type(screen.getByPlaceholderText("Type a message…"), "Party A is Acme Corp.");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(sendNdaChatMessage).toHaveBeenCalledWith([
      expect.objectContaining({ role: "assistant" }),
      { role: "user", content: "Party A is Acme Corp." },
    ]);
    expect(await screen.findByText("Got it, what is Party A's address?")).toBeInTheDocument();
    expect(onFieldsExtracted).toHaveBeenCalledWith({ partyAName: "Acme Corp." });
  });

  it("shows an error message when the chat request fails", async () => {
    const user = userEvent.setup();
    vi.mocked(sendNdaChatMessage).mockRejectedValue(new Error("network error"));

    render(<NdaChatPanel onFieldsExtracted={vi.fn()} />);
    await openChat(user);

    await user.type(screen.getByPlaceholderText("Type a message…"), "hello");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(
      await screen.findByText("Something went wrong talking to the assistant. Please try again.")
    ).toBeInTheDocument();
  });

  it("closes the panel and reopens with the conversation preserved", async () => {
    const user = userEvent.setup();
    vi.mocked(sendNdaChatMessage).mockResolvedValue({ reply: "Noted.", fields: {} });

    render(<NdaChatPanel onFieldsExtracted={vi.fn()} />);
    await openChat(user);
    await user.type(screen.getByPlaceholderText("Type a message…"), "hi");
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByText("Noted.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close chat assistant" }));
    expect(screen.queryByText("Noted.")).not.toBeInTheDocument();

    await openChat(user);
    expect(screen.getByText("Noted.")).toBeInTheDocument();
  });
});
