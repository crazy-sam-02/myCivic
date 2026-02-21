const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const getAccessToken = () => localStorage.getItem("accessToken");
const setAccessToken = (token: string | null) => {
  if (token) {
    localStorage.setItem("accessToken", token);
  } else {
    localStorage.removeItem("accessToken");
  }
};

export const apiFetch = async (path: string, options: RequestInit = {}, retry = true) => {
  const token = getAccessToken();
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiFetch(path, options, false);
    }
  }

  return res;
};

export const refreshAccessToken = async () => {
  const res = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) return false;
  const data = await res.json();
  if (data?.token) {
    setAccessToken(data.token);
    return true;
  }
  return false;
};

export const authApi = {
  async login(email: string, password: string) {
    const res = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data?.token) setAccessToken(data.token);
    return { ok: res.ok, data };
  },
  async register(username: string, email: string, password: string, role = "user") {
    const res = await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password, role }),
    });
    const data = await res.json();
    if (data?.token) setAccessToken(data.token);
    return { ok: res.ok, data };
  },
  async me() {
    const res = await apiFetch("/api/auth/me");
    const data = await res.json();
    return { ok: res.ok, data };
  },
  async logout() {
    const res = await apiFetch("/api/auth/logout", { method: "POST" });
    setAccessToken(null);
    return { ok: res.ok };
  },
  async firebaseGoogleLogin(firebaseUser: { email: string; displayName: string; uid: string }) {
    const res = await apiFetch("/api/auth/firebase-google", {
      method: "POST",
      body: JSON.stringify({
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        firebaseUid: firebaseUser.uid,
      }),
    });
    const data = await res.json();
    if (data?.token) setAccessToken(data.token);
    return { ok: res.ok, data };
  },
  async updateProfile(name: string, location: string) {
    const res = await apiFetch("/api/auth/profile", {
      method: "PUT",
      body: JSON.stringify({ name, location }),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  },
  async changePassword(currentPassword: string, newPassword: string, confirmPassword: string) {
    const res = await apiFetch("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  },
};

export const reportApi = {
  async getPublicReports() {
    const res = await apiFetch("/api/reports/public");
    const data = await res.json();
    return { ok: res.ok, data };
  },
  async getUserReports() {
    const res = await apiFetch("/api/reports/user");
    const data = await res.json();
    return { ok: res.ok, data };
  },
  async createReport(payload: Record<string, unknown>) {
    const res = await apiFetch("/api/reports/create", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  },
  async updateStatus(id: string, status: string) {
    const res = await apiFetch(`/api/reports/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  },
  async toggleVote(id: string) {
    const res = await apiFetch(`/api/reports/${id}/vote`, { method: "POST" });
    const data = await res.json();
    return { ok: res.ok, data };
  },
  async voteSeverity(id: string, severity: string) {
    const res = await apiFetch(`/api/reports/${id}/severity-vote`, {
      method: "POST",
      body: JSON.stringify({ severity }),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  },
  async resolveReport(id: string, payload: { proofImageUrl: string; notes: string }) {
    const res = await apiFetch(`/api/admin/reports/${id}/resolve`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  },
};

export { setAccessToken };

export const aiApi = {
  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append("image", file);
    const res = await apiFetch("/api/upload/image", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    return { ok: res.ok, data };
  },
  async describeImage(imageUrl: string, hint: string) {
    const res = await apiFetch("/api/ai/describe", {
      method: "POST",
      body: JSON.stringify({ imageUrl, hint }),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  },
  async categorizeImage(imageUrl: string) {
    const res = await apiFetch("/api/ai/categorize", {
      method: "POST",
      body: JSON.stringify({ imageUrl }),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  },
  async summarize(text: string) {
    const res = await apiFetch("/api/ai/summarize", {
      method: "POST",
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  },
};
