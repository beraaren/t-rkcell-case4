// localStorage-backed mock backend. Sunucu rolünü taklit eder.
// Tüm state burada; UI sadece bu fonksiyonları çağırır.

import { SEED_COURSES, SEED_USERS } from "./seed";
import type {
  Certificate, Comment, Course, Enrollment, Exam, ExamAttempt,
  LessonProgress, Question, Review, User, UserAnswer,
} from "./types";

const KEY = "educell:db:v1";

interface DB {
  users: (User & { password: string })[];
  courses: Course[];
  enrollments: Enrollment[];
  lessonProgress: LessonProgress[];
  attempts: ExamAttempt[];
  certificates: Certificate[];
  comments: Comment[];
  reviews: Review[];
  currentUserId: string | null;
}

function defaultDB(): DB {
  return {
    users: [...SEED_USERS],
    courses: JSON.parse(JSON.stringify(SEED_COURSES)),
    enrollments: [],
    lessonProgress: [],
    attempts: [],
    certificates: [],
    comments: [],
    reviews: [],
    currentUserId: null,
  };
}

function load(): DB {
  if (typeof window === "undefined") return defaultDB();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const db = defaultDB();
      localStorage.setItem(KEY, JSON.stringify(db));
      return db;
    }
    return JSON.parse(raw);
  } catch {
    return defaultDB();
  }
}

function save(db: DB) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(db));
  window.dispatchEvent(new Event("educell:db-update"));
}

export function resetDB() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
  load();
  window.dispatchEvent(new Event("educell:db-update"));
}

export function getDB(): DB {
  return load();
}

const uid = (p = "") => `${p}${Math.random().toString(36).slice(2, 10)}`;

// ============ AUTH ============

export function register(input: { gsm: string; password: string; name: string; role: User["role"] }): User {
  const db = load();
  if (db.users.find(u => u.gsm === input.gsm)) throw new Error("Bu GSM ile zaten kayıt var");
  const user: User & { password: string } = {
    id: uid("u-"), gsm: input.gsm, password: input.password, name: input.name, role: input.role,
  };
  db.users.push(user);
  save(db);
  const { password: _p, ...pub } = user;
  return pub;
}

export function login(gsm: string, password: string): User {
  const db = load();
  const u = db.users.find(x => x.gsm === gsm && x.password === password);
  if (!u) throw new Error("GSM veya şifre hatalı");
  const { password: _p, ...pub } = u;
  return pub;
}

export function setCurrentUser(userId: string | null) {
  const db = load();
  db.currentUserId = userId;
  save(db);
}

export function getCurrentUser(): User | null {
  const db = load();
  if (!db.currentUserId) return null;
  const u = db.users.find(x => x.id === db.currentUserId);
  if (!u) return null;
  const { password: _p, ...pub } = u;
  return pub;
}

export function updateProfile(patch: Partial<Pick<User, "name" | "bio">>) {
  const db = load();
  const u = db.users.find(x => x.id === db.currentUserId);
  if (!u) throw new Error("Yetkisiz");
  Object.assign(u, patch);
  save(db);
}

// ============ COURSES ============

export function listCourses(filter?: { category?: string; level?: string; q?: string }): Course[] {
  const db = load();
  let list = db.courses.filter(c => c.status === "PUBLISHED");
  if (filter?.category && filter.category !== "all") list = list.filter(c => c.category === filter.category);
  if (filter?.level && filter.level !== "all") list = list.filter(c => c.level === filter.level);
  if (filter?.q) {
    const q = filter.q.toLowerCase();
    list = list.filter(c => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
  }
  return list;
}

export function getCourse(id: string): Course | undefined {
  return load().courses.find(c => c.id === id);
}

export function getCategories(): string[] {
  const db = load();
  return Array.from(new Set(db.courses.map(c => c.category)));
}

// ============ ENROLLMENT ============

export function enroll(courseId: string) {
  const db = load();
  const userId = db.currentUserId;
  if (!userId) throw new Error("Giriş gerekli");
  if (db.enrollments.find(e => e.userId === userId && e.courseId === courseId)) return;
  db.enrollments.push({ userId, courseId, enrolledAt: new Date().toISOString() });
  save(db);
}

export function isEnrolled(courseId: string, userId?: string): boolean {
  const db = load();
  const uid2 = userId ?? db.currentUserId;
  if (!uid2) return false;
  return !!db.enrollments.find(e => e.userId === uid2 && e.courseId === courseId);
}

export function myEnrollments(): { course: Course; progressPct: number }[] {
  const db = load();
  if (!db.currentUserId) return [];
  return db.enrollments
    .filter(e => e.userId === db.currentUserId)
    .map(e => {
      const course = db.courses.find(c => c.id === e.courseId)!;
      return { course, progressPct: courseProgress(course.id) };
    })
    .filter(x => x.course);
}

// ============ PROGRESS ============

export function completeLesson(lessonId: string) {
  const db = load();
  const userId = db.currentUserId;
  if (!userId) throw new Error("Giriş gerekli");
  if (db.lessonProgress.find(p => p.userId === userId && p.lessonId === lessonId)) return;
  db.lessonProgress.push({ userId, lessonId, completedAt: new Date().toISOString() });
  save(db);
}

export function isLessonComplete(lessonId: string): boolean {
  const db = load();
  if (!db.currentUserId) return false;
  return !!db.lessonProgress.find(p => p.userId === db.currentUserId && p.lessonId === lessonId);
}

export function moduleProgress(courseId: string, moduleId: string): number {
  const db = load();
  const course = db.courses.find(c => c.id === courseId);
  const mod = course?.modules.find(m => m.id === moduleId);
  if (!mod || mod.lessons.length === 0) return 0;
  const completed = mod.lessons.filter(l => isLessonComplete(l.id)).length;
  return Math.round((completed / mod.lessons.length) * 100);
}

export function isModuleUnlocked(courseId: string, moduleIndex: number): boolean {
  if (moduleIndex === 0) return true;
  const course = getCourse(courseId);
  if (!course) return false;
  const prev = course.modules[moduleIndex - 1];
  if (!prev?.exam) return true;
  return hasPassedExam(prev.exam.id, prev.exam.passingScore);
}

export function courseProgress(courseId: string): number {
  const course = getCourse(courseId);
  if (!course) return 0;
  let totalUnits = 0, doneUnits = 0;
  course.modules.forEach(m => {
    totalUnits += m.lessons.length;
    doneUnits += m.lessons.filter(l => isLessonComplete(l.id)).length;
    if (m.exam) {
      totalUnits += 1;
      if (hasPassedExam(m.exam.id, m.exam.passingScore)) doneUnits += 1;
    }
  });
  if (totalUnits === 0) return 0;
  return Math.round((doneUnits / totalUnits) * 100);
}

// ============ EXAM ENGINE ============

export function getAttemptsForExam(examId: string): ExamAttempt[] {
  const db = load();
  if (!db.currentUserId) return [];
  return db.attempts.filter(a => a.userId === db.currentUserId && a.examId === examId);
}

export function bestScore(examId: string): number | null {
  const submitted = getAttemptsForExam(examId).filter(a => a.status !== "IN_PROGRESS" && a.score != null);
  if (submitted.length === 0) return null;
  return Math.max(...submitted.map(a => a.score!));
}

export function hasPassedExam(examId: string, passing: number): boolean {
  const best = bestScore(examId);
  return best != null && best >= passing;
}

export function startAttempt(examId: string): { attempt: ExamAttempt; questions: Question[] } {
  const db = load();
  const userId = db.currentUserId;
  if (!userId) throw new Error("Giriş gerekli");

  let exam: Exam | undefined;
  let courseId = "", moduleIndex = -1;
  for (const c of db.courses) {
    for (let i = 0; i < c.modules.length; i++) {
      if (c.modules[i].exam?.id === examId) {
        exam = c.modules[i].exam;
        courseId = c.id;
        moduleIndex = i;
      }
    }
  }
  if (!exam) throw new Error("Sınav bulunamadı");
  if (!isEnrolled(courseId)) throw new Error("Önce kursa kaydolmalısın");
  if (!isModuleUnlocked(courseId, moduleIndex)) throw new Error("Önceki modül sınavını geçmen gerek");

  const existing = db.attempts.find(a => a.userId === userId && a.examId === examId && a.status === "IN_PROGRESS");
  if (existing) {
    if (new Date(existing.expiresAt).getTime() < Date.now()) {
      // expired but not submitted yet
      existing.status = "EXPIRED";
      existing.submittedAt = new Date().toISOString();
      existing.score = gradeAttempt(existing, exam);
      save(db);
    } else {
      const qs = exam.questions.filter(q => existing.shuffledQuestionIds.includes(q.id));
      qs.sort((a, b) => existing.shuffledQuestionIds.indexOf(a.id) - existing.shuffledQuestionIds.indexOf(b.id));
      return { attempt: existing, questions: stripCorrect(qs) };
    }
  }

  const used = db.attempts.filter(a => a.userId === userId && a.examId === examId).length;
  if (used >= exam.maxAttempts) throw new Error("Deneme hakkın doldu");

  const ids = exam.questions.map(q => q.id);
  const ordered = exam.shuffle ? shuffle(ids) : ids;
  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + exam.timeLimitMin * 60_000);

  const attempt: ExamAttempt = {
    id: uid("a-"),
    userId, examId,
    startedAt: startedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: "IN_PROGRESS",
    answers: [],
    shuffledQuestionIds: ordered,
  };
  db.attempts.push(attempt);
  save(db);

  const qs = exam.questions.filter(q => ordered.includes(q.id));
  qs.sort((a, b) => ordered.indexOf(a.id) - ordered.indexOf(b.id));
  return { attempt, questions: stripCorrect(qs) };
}

export function submitAttempt(attemptId: string, answers: UserAnswer[]): ExamAttempt {
  const db = load();
  const attempt = db.attempts.find(a => a.id === attemptId);
  if (!attempt) throw new Error("Deneme bulunamadı");
  if (attempt.userId !== db.currentUserId) throw new Error("Yetkisiz");

  let exam: Exam | undefined;
  let courseId = "";
  for (const c of db.courses) for (const m of c.modules) if (m.exam?.id === attempt.examId) { exam = m.exam; courseId = c.id; }
  if (!exam) throw new Error("Sınav bulunamadı");

  const expired = new Date(attempt.expiresAt).getTime() < Date.now();
  attempt.answers = answers;
  attempt.submittedAt = new Date().toISOString();
  attempt.status = expired ? "EXPIRED" : "SUBMITTED";
  attempt.score = gradeAttempt(attempt, exam);

  save(db);

  // Sertifika kontrolü
  if (courseProgress(courseId) === 100) {
    issueCertificateIfMissing(courseId);
  }
  return attempt;
}

function gradeAttempt(attempt: ExamAttempt, exam: Exam): number {
  if (exam.questions.length === 0) return 0;
  let total = 0;
  for (const q of exam.questions) {
    const ans = attempt.answers.find(a => a.questionId === q.id);
    total += gradeAnswer(q, ans?.selectedOptionIds ?? []);
  }
  return Math.round((total / exam.questions.length) * 100 * 100) / 100;
}

export function gradeAnswer(q: Question, selected: string[]): number {
  const correctIds = q.options.filter(o => o.isCorrect).map(o => o.id);
  const correctSet = new Set(correctIds);
  const selectedSet = new Set(selected);

  if (q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE") {
    if (selectedSet.size !== 1) return 0;
    return correctSet.has([...selectedSet][0]) ? 1 : 0;
  }
  if (q.type === "MULTI_SELECT") {
    if (correctIds.length === 0) return 0;
    let hit = 0, wrong = 0;
    for (const s of selectedSet) (correctSet.has(s) ? hit++ : wrong++);
    return Math.max(0, (hit - wrong) / correctIds.length);
  }
  return 0;
}

function stripCorrect(qs: Question[]): Question[] {
  return qs.map(q => ({ ...q, options: q.options.map(o => ({ id: o.id, text: o.text, isCorrect: false })) }));
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getAttempt(attemptId: string): ExamAttempt | undefined {
  return load().attempts.find(a => a.id === attemptId);
}

export function getExamWithAnswers(examId: string): Exam | undefined {
  const db = load();
  for (const c of db.courses) for (const m of c.modules) if (m.exam?.id === examId) return m.exam;
  return undefined;
}

export function getLatestAttempt(examId: string): ExamAttempt | undefined {
  const list = getAttemptsForExam(examId).filter(a => a.status !== "IN_PROGRESS");
  if (list.length === 0) return undefined;
  return list.sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""))[0];
}

// ============ CERTIFICATES ============

function issueCertificateIfMissing(courseId: string) {
  const db = load();
  const userId = db.currentUserId!;
  if (db.certificates.find(c => c.userId === userId && c.courseId === courseId)) return;
  const number = `EDU-2026-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  db.certificates.push({
    id: uid("cert-"),
    number,
    userId,
    courseId,
    issuedAt: new Date().toISOString(),
  });
  save(db);
}

export function myCertificates(): (Certificate & { courseTitle: string; userName: string })[] {
  const db = load();
  if (!db.currentUserId) return [];
  return db.certificates
    .filter(c => c.userId === db.currentUserId)
    .map(c => ({
      ...c,
      courseTitle: db.courses.find(x => x.id === c.courseId)?.title ?? "—",
      userName: db.users.find(u => u.id === c.userId)?.name ?? "—",
    }));
}

export function verifyCertificate(number: string): null | {
  number: string; userName: string; courseTitle: string; issuedAt: string;
} {
  const db = load();
  const cert = db.certificates.find(c => c.number.toUpperCase() === number.toUpperCase());
  if (!cert) return null;
  const user = db.users.find(u => u.id === cert.userId);
  const course = db.courses.find(c => c.id === cert.courseId);
  return {
    number: cert.number,
    userName: user?.name ?? "—",
    courseTitle: course?.title ?? "—",
    issuedAt: cert.issuedAt,
  };
}

// ============ INTERACTIONS ============

export function getComments(lessonId: string): Comment[] {
  return load().comments.filter(c => c.lessonId === lessonId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function addComment(lessonId: string, text: string, parentId?: string) {
  const db = load();
  const user = getCurrentUser();
  if (!user) throw new Error("Giriş gerekli");
  db.comments.push({
    id: uid("cm-"), lessonId, userId: user.id, userName: user.name, userRole: user.role,
    text, parentId, createdAt: new Date().toISOString(),
  });
  save(db);
}

export function getReviews(courseId: string): Review[] {
  return load().reviews.filter(r => r.courseId === courseId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addReview(courseId: string, rating: number, text?: string) {
  const db = load();
  const user = getCurrentUser();
  if (!user) throw new Error("Giriş gerekli");
  if (!isEnrolled(courseId)) throw new Error("Önce kayıt olmalısın");
  const existing = db.reviews.find(r => r.courseId === courseId && r.userId === user.id);
  if (existing) {
    existing.rating = rating;
    existing.text = text;
  } else {
    db.reviews.push({
      id: uid("rv-"), courseId, userId: user.id, userName: user.name, rating, text,
      createdAt: new Date().toISOString(),
    });
  }
  save(db);
}

export function avgRating(courseId: string): { avg: number; count: number } {
  const list = getReviews(courseId);
  if (list.length === 0) return { avg: 0, count: 0 };
  return { avg: Math.round((list.reduce((s, r) => s + r.rating, 0) / list.length) * 10) / 10, count: list.length };
}
