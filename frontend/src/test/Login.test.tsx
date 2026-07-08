import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Login from "../pages/Login";

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

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );
}

describe("Login page", () => {
  it("renders the login form with email tab active by default", () => {
    renderLogin();

    expect(screen.getAllByText("Sign In").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByPlaceholderText("you@example.com")).toBeTruthy();
    expect(screen.getByPlaceholderText("Your password")).toBeTruthy();
  });

  it("switches to API key tab", () => {
    renderLogin();

    fireEvent.click(screen.getByText("API Key"));

    expect(screen.getByPlaceholderText("mb_live_...")).toBeTruthy();
  });

  it("shows error on empty email submit", async () => {
    renderLogin();

    fireEvent.click(screen.getByText("Sign in"));

    await waitFor(() => {
      expect(screen.getByText("Email and password are required.")).toBeTruthy();
    });
  });

  it("shows error on empty API key submit", async () => {
    renderLogin();

    fireEvent.click(screen.getByText("API Key"));
    fireEvent.click(screen.getByText("Sign in with API Key"));

    await waitFor(() => {
      expect(screen.getByText("Please enter your API key.")).toBeTruthy();
    });
  });

  it("calls auth login API on email submit", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ token: "jwt_123", user: { id: "u1", email: "a@b.com" } }),
    });

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("Your password"), { target: { value: "mypassword" } });
    fireEvent.click(screen.getByText("Sign in"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/v1/auth/login",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "test@example.com", password: "mypassword" }),
        }),
      );
    });
  });

  it("stores JWT token and navigates to dashboard on successful login", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ token: "jwt_123", user: { id: "u1", email: "a@b.com" } }),
    });

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("Your password"), { target: { value: "pass" } });
    fireEvent.click(screen.getByText("Sign in"));

    await waitFor(() => {
      expect(localStorage.getItem("mb_token")).toBe("jwt_123");
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows error on failed login", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: { code: "invalid_credentials", message: "Invalid email or password" } }),
    });

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "bad@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("Your password"), { target: { value: "wrong" } });
    fireEvent.click(screen.getByText("Sign in"));

    await waitFor(() => {
      expect(screen.getByText("Invalid email or password")).toBeTruthy();
    });
  });

  it("stores API key and navigates on API key login", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    });

    renderLogin();

    fireEvent.click(screen.getByText("API Key"));
    fireEvent.change(screen.getByPlaceholderText("mb_live_..."), { target: { value: "mb_live_test_key_secret" } });
    fireEvent.click(screen.getByText("Sign in with API Key"));

    await waitFor(() => {
      expect(localStorage.getItem("mb_api_key")).toBe("mb_live_test_key_secret");
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows sign up link", () => {
    renderLogin();

    expect(screen.getByText("Sign up")).toBeTruthy();
  });
});
