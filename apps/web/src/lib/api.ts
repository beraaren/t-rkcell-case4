const BASE = "http://localhost:3001/api/v1";

function getToken() {
  return localStorage.getItem("educell:token");
}

export function setToken(token: string) {
  localStorage.setItem("educell:token", token);
}

export function setRefreshToken(token: string) {
  localStorage.setItem("educell:refresh", token);
}

export function clearTokens() {
  localStorage.removeItem("educell:token");
  localStorage.removeItem("educell:refresh");
}

export function getRefreshToken() {
  return localStorage.getItem("educell:refresh");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    const refresh = getRefreshToken();
    if (refresh) {
      const r = await fetch(`${BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refresh }),
      });
      if (r.ok) {
        const data = await r.json();
        setToken(data.data.accessToken);
        headers["Authorization"] = `Bearer ${data.data.accessToken}`;
        const retry = await fetch(`${BASE}${path}`, { ...options, headers });
        if (!retry.ok) {
          const err = await retry.json().catch(() => ({}));
          throw new Error(err?.message || `HTTP ${retry.status}`);
        }
        return retry.json().then((d) => d.data ?? d);
      }
    }
    clearTokens();
    window.location.href = "/login";
    throw new Error("Oturum süresi doldu");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `HTTP ${res.status}`);
  }

  const json = await res.json();
  return json.data ?? json;
}

// ── AUTH ──────────────────────────────────────────────────────────────
export const auth = {
  register: (body: { gsm: string; password: string; name: string; role: string }) =>
    request<{ message: string }>("/auth/register", { method: "POST", body: JSON.stringify(body) }),

  verifyOtp: (gsm: string, code: string) =>
    request<{ accessToken: string; refreshToken: string }>("/auth/verify-otp", { method: "POST", body: JSON.stringify({ gsm, code }) }),

  login: (gsm: string, password: string) =>
    request<{ message: string; gsm: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ gsm, password }),
    }),

  me: () => request<any>("/auth/me"),
};

// ── COURSES ───────────────────────────────────────────────────────────
export const courses = {
  list: async (params?: { q?: string; category?: string; level?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    const res = await request<any>(`/courses${qs ? `?${qs}` : ""}`);
    return Array.isArray(res) ? res : (res?.courses ?? []);
  },

  get: (id: string) => request<any>(`/courses/${id}`),

  curriculum: (id: string) => request<any>(`/courses/${id}/curriculum`),

  create: (body: any) =>
    request<any>("/courses", { method: "POST", body: JSON.stringify(body) }),

  update: (id: string, body: any) =>
    request<any>(`/courses/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  enroll: (id: string) =>
    request<any>(`/courses/${id}/enroll`, { method: "POST" }),
};

// ── MODULES ───────────────────────────────────────────────────────────
export const modules = {
  list: (courseId: string) => request<any[]>(`/courses/${courseId}/modules`),

  get: (id: string) => request<any>(`/modules/${id}`),

  create: (courseId: string, body: any) =>
    request<any>(`/courses/${courseId}/modules`, { method: "POST", body: JSON.stringify(body) }),
};

// ── LESSONS ───────────────────────────────────────────────────────────
export const lessons = {
  get: (id: string) => request<any>(`/lessons/${id}`),

  create: (moduleId: string, body: any) =>
    request<any>(`/modules/${moduleId}/lessons`, { method: "POST", body: JSON.stringify(body) }),

  update: (id: string, body: any) =>
    request<any>(`/lessons/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  complete: (id: string) =>
    request<any>(`/lessons/${id}/complete`, { method: "PATCH" }),
  uncomplete: (id: string) =>
    request<any>(`/lessons/${id}/complete`, { method: "DELETE" }),
};

// ── EXAMS ─────────────────────────────────────────────────────────────
export const exams = {
  start: (examId: string) =>
    request<any>(`/exams/${examId}/start`, { method: "POST" }),

  submit: (examId: string, body: { attemptId: string; answers: { questionId: string; selectedOptionIds: string[] }[] }) =>
    request<any>(`/exams/${examId}/submit`, { method: "POST", body: JSON.stringify(body) }),

  result: (examId: string) => request<any>(`/exams/${examId}/result`),

  manage: (examId: string) => request<any>(`/exams/${examId}/manage`),

  attempts: (examId: string) => request<any[]>(`/exams/${examId}/attempts`),

  create: (moduleId: string, body: any) =>
    request<any>(`/modules/${moduleId}/exam`, { method: "POST", body: JSON.stringify(body) }),

  addQuestion: (examId: string, body: any) =>
    request<any>(`/exams/${examId}/questions`, { method: "POST", body: JSON.stringify(body) }),

  deleteQuestion: (questionId: string) =>
    request<any>(`/questions/${questionId}`, { method: "DELETE" }),
};

// ── MY COURSES ────────────────────────────────────────────────────────
export const me = {
  courses: () => request<any[]>("/me/courses"),
  certificates: () => request<any[]>("/me/certificates"),
};

// ── CERTIFICATES ──────────────────────────────────────────────────────
export const certificates = {
  verify: (number: string) => request<any>(`/certificates/${number}/verify`),
};

// ── INTERACTIONS ──────────────────────────────────────────────────────
export const interactions = {
  getComments: (lessonId: string) => request<any[]>(`/lessons/${lessonId}/comments`),

  addComment: (lessonId: string, body: { text: string; parentId?: string }) =>
    request<any>(`/lessons/${lessonId}/comments`, { method: "POST", body: JSON.stringify(body) }),

  replyComment: (commentId: string, body: { text: string }) =>
    request<any>(`/comments/${commentId}/reply`, { method: "POST", body: JSON.stringify(body) }),

  getReviews: (courseId: string) => request<any[]>(`/courses/${courseId}/reviews`),

  addReview: (courseId: string, body: { rating: number; text?: string }) =>
    request<any>(`/courses/${courseId}/reviews`, { method: "POST", body: JSON.stringify(body) }),
};

// ── ADMIN ─────────────────────────────────────────────────────────────
export const admin = {
  stats: () => request<any>("/admin/stats"),
  users: async () => {
    const res = await request<any>("/admin/users");
    return Array.isArray(res) ? res : (res?.users ?? []);
  },
  updateRole: (id: string, role: string) =>
    request<any>(`/admin/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) }),
  courses: async () => {
    const res = await request<any>("/admin/courses");
    return Array.isArray(res) ? res : (res?.courses ?? []);
  },
  archiveCourse: (id: string) =>
    request<any>(`/admin/courses/${id}/archive`, { method: "PATCH" }),
};
