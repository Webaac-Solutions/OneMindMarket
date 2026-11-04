import { BASE_URL } from "../api";

const TOKEN_KEY = "adminToken";

export const login = async (username, password) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Login failed" }));
    throw new Error(err.message || "Login failed");
  }

  const data = await res.json();
  if (data.token) {
    localStorage.setItem(TOKEN_KEY, data.token);
    return { ok: true };
  }
  throw new Error("Login failed");
};

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const isAuthenticated = () => {
  return !!localStorage.getItem(TOKEN_KEY);
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const logoutAndRedirect = () => {
  logout();
  sessionStorage.setItem("adminSessionExpired", "1");
  window.location.href = "/login";
};

export default { login, logout, logoutAndRedirect, isAuthenticated, getToken };
