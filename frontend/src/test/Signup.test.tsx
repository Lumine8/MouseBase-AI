import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Signup from "../pages/Signup";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

beforeEach(() => {
  localStorage.clear();
  mockFetch.mockReset();
  mockNavigate.mockReset();
});

function renderSignup() {
  return render(
    <MemoryRouter>
      <Signup />
    </MemoryRouter>,
  );
}

describe("Signup page", () => {
  it("renders signup form fields", () => {
    renderSignup();

    expect(screen.getByPlaceholderText("Jane Doe")).toBeTruthy();
    expect(screen.getByPlaceholderText("you@example.com")).toBeTruthy();
    expect(screen.getByPlaceholderText("At least 8 characters")).toBeTruthy();
    expect(screen.getByText("Create Account")).toBeTruthy();
  });

  it("shows error on empty email", async () => {
    renderSignup();

    fireEvent.change(screen.getByPlaceholderText("At least 8 characters"), { target: { value: "password123" } });
    fireEvent.click(screen.getByText("Create Account"));

    await waitFor(() => {
      expect(screen.getByText("Email and password are required.")).toBeTruthy();
    });
  });

  it("shows error on short password", async () => {
    renderSignup();

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("At least 8 characters"), { target: { value: "short" } });
    fireEvent.click(screen.getByText("Create Account"));

    await waitFor(() => {
      expect(screen.getByText("Password must be at least 8 characters.")).toBeTruthy();
    });
  });

  it("calls signup API on valid submit", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve({
        token: "new_jwt",
        user: { id: "u1", email: "new@example.com", full_name: "Jane Doe", email_verified: true },
      }),
    });

    renderSignup();

    fireEvent.change(screen.getByPlaceholderText("Jane Doe"), { target: { value: "Jane Doe" } });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "new@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("At least 8 characters"), { target: { value: "strongpass123" } });
    fireEvent.click(screen.getByText("Create Account"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/v1/auth/signup",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "new@example.com", password: "strongpass123", full_name: "Jane Doe" }),
        }),
      );
    });
  });

  it("stores token, creates demo project, shows API key modal, navigates on dismiss", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({
          token: "new_jwt",
          user: { id: "u1", email: "new@example.com", full_name: "Jane Doe", email_verified: true },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({
          id: "proj_1", owner_id: "u1", name: "demo-project",
          api_key: "mb_live_test_abc123", api_key_id: "ak_1",
          status: "active",
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        }),
      });

    renderSignup();

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "new@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("At least 8 characters"), { target: { value: "strongpass123" } });
    fireEvent.click(screen.getByText("Create Account"));

    await waitFor(() => {
      expect(localStorage.getItem("mb_token")).toBe("new_jwt");
      expect(localStorage.getItem("mb_api_key")).toBe("mb_live_test_abc123");
    });

    expect(screen.getByText("Your API Key")).toBeTruthy();

    fireEvent.click(screen.getByText("I'll save it later — go to Dashboard"));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows error on duplicate email", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ error: { code: "email_already_exists", message: "An account with this email already exists" } }),
    });

    renderSignup();

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "existing@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("At least 8 characters"), { target: { value: "strongpass123" } });
    fireEvent.click(screen.getByText("Create Account"));

    await waitFor(() => {
      expect(screen.getByText("An account with this email already exists")).toBeTruthy();
    });
  });

  it("shows sign in link", () => {
    renderSignup();

    expect(screen.getByText("Sign in")).toBeTruthy();
  });
});
