import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { useState } from "react";
import EmailCheckForm from "@/components/EmailCheckForm";

vi.mock("framer-motion", () => ({
  motion: {
    p: ({ children, className, role }: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p className={className} role={role}>{children}</p>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function Wrapper({ initialEmail = "" }: { initialEmail?: string }) {
  const [email, setEmail] = useState(initialEmail);
  return (
    <EmailCheckForm
      email={email}
      onEmailChange={setEmail}
      apiUrl="https://mock-api.test/api/check-email"
    />
  );
}

describe("EmailCheckForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the email input and name input", () => {
    render(<Wrapper />);
    expect(screen.getByPlaceholderText("you@company.com")).toBeTruthy();
    expect(screen.getByPlaceholderText("Jane Doe")).toBeTruthy();
  });

  it("renders the Sign Up button", () => {
    render(<Wrapper />);
    expect(screen.getByRole("button", { name: /sign up/i })).toBeTruthy();
  });

  it("disables the submit button when email is empty", () => {
    render(<Wrapper />);
    const button = screen.getByRole("button", { name: /sign up/i }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it("disables the submit button when email format is invalid", async () => {
    const { rerender } = render(<Wrapper />);
    const emailInput = screen.getByPlaceholderText("you@company.com");
    await userEvent.type(emailInput, "notanemail");
    const button = screen.getByRole("button", { name: /sign up/i }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it("immediately shows disposable error for a known disposable domain without API call", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<Wrapper initialEmail="test@mailinator.com" />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeTruthy();
      expect(screen.getByText("Temporary email addresses are not allowed.")).toBeTruthy();
    });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("disables submit button when a disposable email is entered", async () => {
    render(<Wrapper initialEmail="user@guerrillamail.com" />);

    await waitFor(() => {
      const button = screen.getByRole("button", { name: /sign up/i }) as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    });
  });

  it("calls fetch API for non-locally-known domains", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ isDisposable: false }),
    } as Response);

    render(<Wrapper initialEmail="user@gmail.com" />);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "https://mock-api.test/api/check-email",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "user@gmail.com" }),
        })
      );
    });
  });

  it("shows success message when API returns isDisposable: false", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ isDisposable: false }),
    } as Response);

    render(<Wrapper initialEmail="contact@company.com" />);

    await waitFor(() => {
      expect(screen.getByRole("status")).toBeTruthy();
      expect(screen.getByText(/valid email address/i)).toBeTruthy();
    });
  });

  it("shows error message when API returns isDisposable: true", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ isDisposable: true }),
    } as Response);

    render(<Wrapper initialEmail="user@unknowndisposable.net" />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeTruthy();
      expect(screen.getByText("Temporary email addresses are not allowed.")).toBeTruthy();
    });
  });

  it("shows success (fallback) when API call fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

    render(<Wrapper initialEmail="user@example.com" />);

    await waitFor(() => {
      expect(screen.getByRole("status")).toBeTruthy();
    });
  });

  it("enables submit button for a valid non-disposable email", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ isDisposable: false }),
    } as Response);

    render(<Wrapper initialEmail="valid@company.com" />);

    await waitFor(() => {
      const button = screen.getByRole("button", { name: /sign up/i }) as HTMLButtonElement;
      expect(button.disabled).toBe(false);
    });
  });
});
