// EduCell — frontend mock data + tiny localStorage state layer
// Hierarchy: Course → Module → Lesson + Exam (per module) → Question

export type Level = "Başlangıç" | "Orta" | "İleri";
export type Category = "Yazılım" | "Mobil" | "Veri" | "İletişim" | "Liderlik";
export type CourseStatus = "Taslak" | "Yayında" | "Arşivlenmiş";

export type QuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "MULTI_SELECT";

export interface Option {
  id: string;
  text: string;
  is_correct: boolean;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options: Option[];
}

export interface Exam {
  id: string;
  module_id: string;
  title: string;
  time_limit_min: number;
  passing_score: number;
  shuffle: boolean;
  max_attempts: number;
  questions: Question[];
}

export interface Lesson {
  id: string;
  module_id: string;
  order: number;
  title: string;
  duration_min: number;
  content: string; // markdown-ish
}

export interface Module {
  id: string;
  course_id: string;
  order: number;
  title: string;
  description: string;
  lessons: Lesson[];
  exam: Exam;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  long_description: string;
  category: Category;
  level: Level;
  cover: string; // gradient class id
  duration_min: number;
  instructor: { id: string; name: string; title: string };
  status: CourseStatus;
  rating: number;
  enrolled: number;
  modules: Module[];
}

// ───────────────────────── helpers
const q = (
  type: QuestionType,
  text: string,
  options: { text: string; correct?: boolean }[],
): Question => ({
  id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
  type,
  text,
  options: options.map((o, i) => ({
    id: `opt-${i}`,
    text: o.text,
    is_correct: !!o.correct,
  })),
});

const mkExam = (title: string, qs: Question[]): Omit<Exam, "id" | "module_id"> => ({
  title,
  time_limit_min: 10,
  passing_score: 70,
  shuffle: true,
  max_attempts: 3,
  questions: qs,
});

// ───────────────────────── seed: 3 courses × 3 modules × 3 lessons + exam(10q)

const lessonContent = (topic: string) => `
## ${topic}

Bu derste **${topic}** konusunu pratik örneklerle inceleyeceğiz.

- Temel kavramlar
- Sektörden örnekler
- Mini uygulama

> Turkcell'in dijital dönüşüm yolculuğunda ${topic} kritik bir yetkinliktir.

\`\`\`
// kısa kod örneği
function selam() { return "Merhaba EduCell"; }
\`\`\`

İlerlemek için dersi **tamamlandı** olarak işaretleyebilirsin.
`;

function buildCourse(args: {
  id: string;
  title: string;
  description: string;
  category: Category;
  level: Level;
  cover: string;
  instructor: Course["instructor"];
  rating: number;
  enrolled: number;
  modules: { title: string; description: string; lessons: string[]; examTopic: string }[];
}): Course {
  const modules: Module[] = args.modules.map((m, mi) => {
    const moduleId = `${args.id}-m${mi + 1}`;
    const lessons: Lesson[] = m.lessons.map((lt, li) => ({
      id: `${moduleId}-l${li + 1}`,
      module_id: moduleId,
      order: li + 1,
      title: lt,
      duration_min: 8 + li * 2,
      content: lessonContent(lt),
    }));
    // 10 sorulu sınav
    const qs: Question[] = [
      q("MULTIPLE_CHOICE", `${m.examTopic} nedir?`, [
        { text: "İlgisiz bir kavram", correct: false },
        { text: `${m.examTopic} alanının temel taşı`, correct: true },
        { text: "Donanım bileşeni", correct: false },
        { text: "Bir oyun türü", correct: false },
      ]),
      q("TRUE_FALSE", `${m.examTopic} sadece teoride önemlidir.`, [
        { text: "Doğru", correct: false },
        { text: "Yanlış", correct: true },
      ]),
      q("MULTI_SELECT", `${m.examTopic} ile ilgili doğru ifadeler hangileridir?`, [
        { text: "Pratik uygulamaları vardır", correct: true },
        { text: "Sürekli güncellenir", correct: true },
        { text: "Hiçbir yerde kullanılmaz", correct: false },
        { text: "Sadece tarihseldir", correct: false },
      ]),
      q("MULTIPLE_CHOICE", `${m.lessons[0]} dersinin amacı aşağıdakilerden hangisidir?`, [
        { text: "Temel kavramları öğretmek", correct: true },
        { text: "Reklam yapmak", correct: false },
        { text: "Boş zaman geçirmek", correct: false },
        { text: "Hiçbiri", correct: false },
      ]),
      q("TRUE_FALSE", `${args.title} kursu Turkcell EduCell platformundadır.`, [
        { text: "Doğru", correct: true },
        { text: "Yanlış", correct: false },
      ]),
      q("MULTIPLE_CHOICE", `${m.lessons[1]} ile en çok ilişkili kavram hangisidir?`, [
        { text: "Temel ilkeler", correct: false },
        { text: "Uygulama pratiği", correct: true },
        { text: "Pazarlama", correct: false },
        { text: "Muhasebe", correct: false },
      ]),
      q("MULTI_SELECT", `Bu modüldeki dersler hangileridir?`,
        [
          ...m.lessons.map((l) => ({ text: l, correct: true })),
          { text: "Alakasız konu", correct: false },
        ]),
      q("MULTIPLE_CHOICE", `${m.examTopic} konusunda başarı için en kritik adım?`, [
        { text: "Düzenli pratik", correct: true },
        { text: "Görmezden gelmek", correct: false },
        { text: "Erteleme", correct: false },
        { text: "Tahmin yürütme", correct: false },
      ]),
      q("TRUE_FALSE", `Modül sınavlarında geçme notu %70'tir.`, [
        { text: "Doğru", correct: true },
        { text: "Yanlış", correct: false },
      ]),
      q("MULTIPLE_CHOICE", `${m.lessons[2]} sonunda öğrenci ne yapabilmelidir?`, [
        { text: "Konuyu uygulayabilmeli", correct: true },
        { text: "Konuyu unutmalı", correct: false },
        { text: "Hiçbir şey", correct: false },
        { text: "Sadece dinlemeli", correct: false },
      ]),
    ];
    const exam: Exam = {
      id: `${moduleId}-exam`,
      module_id: moduleId,
      ...mkExam(`${m.title} Sınavı`, qs),
    };
    return {
      id: moduleId,
      course_id: args.id,
      order: mi + 1,
      title: m.title,
      description: m.description,
      lessons,
      exam,
    };
  });

  return {
    id: args.id,
    title: args.title,
    description: args.description,
    long_description:
      `${args.description} Bu kursta sektörden gerçek örneklerle ${args.category.toLowerCase()} alanında ${args.level.toLowerCase()} düzeyde yetkinlik kazanırsın. Modül sonu sınavlarıyla bilgini test eder, başarıyla tamamladığında dijital sertifikanı alırsın.`,
    category: args.category,
    level: args.level,
    cover: args.cover,
    duration_min: modules.reduce(
      (s, m) => s + m.lessons.reduce((x, l) => x + l.duration_min, 0),
      0,
    ),
    instructor: args.instructor,
    status: "Yayında",
    rating: args.rating,
    enrolled: args.enrolled,
    modules,
  };
}

export const COURSES: Course[] = [
  buildCourse({
    id: "c-react-temelleri",
    title: "React ile Modern Web Geliştirme",
    description: "Bileşen tabanlı düşünmeyi ve modern React mimarisini öğren.",
    category: "Yazılım",
    level: "Başlangıç",
    cover: "from-amber-300 via-yellow-400 to-amber-500",
    instructor: { id: "u-elif", name: "Elif Kaya", title: "Senior Frontend Mühendisi" },
    rating: 4.8,
    enrolled: 1240,
    modules: [
      {
        title: "React Temelleri",
        description: "JSX, bileşenler, props ve state.",
        lessons: ["JSX ve Bileşenler", "Props ile Veri Akışı", "useState ile Durum"],
        examTopic: "React bileşen modeli",
      },
      {
        title: "Hooks ve Yan Etkiler",
        description: "useEffect, useMemo, custom hook'lar.",
        lessons: ["useEffect Yaşam Döngüsü", "Veri Çekme Pratiği", "Custom Hook Yazımı"],
        examTopic: "React hooks",
      },
      {
        title: "Yönlendirme ve Form",
        description: "Router, form yönetimi, doğrulama.",
        lessons: ["Router ile Sayfalar", "Kontrollü Formlar", "Doğrulama Kalıpları"],
        examTopic: "React router ve formlar",
      },
    ],
  }),
  buildCourse({
    id: "c-veri-analizi",
    title: "İş Dünyası için Veri Analizi",
    description: "SQL, görselleştirme ve karar destek için veri okuryazarlığı.",
    category: "Veri",
    level: "Orta",
    cover: "from-indigo-400 via-blue-500 to-cyan-500",
    instructor: { id: "u-mert", name: "Mert Aydın", title: "Veri Bilimi Lideri" },
    rating: 4.7,
    enrolled: 980,
    modules: [
      {
        title: "SQL ile Sorgulama",
        description: "SELECT, JOIN, agregasyon.",
        lessons: ["SELECT Temelleri", "JOIN Türleri", "GROUP BY ve Pencereler"],
        examTopic: "SQL temelleri",
      },
      {
        title: "Görselleştirme",
        description: "Grafik seçimi ve hikaye anlatımı.",
        lessons: ["Doğru Grafik Seçimi", "Renk ve Erişilebilirlik", "Dashboard Tasarımı"],
        examTopic: "veri görselleştirme",
      },
      {
        title: "Karar Destek",
        description: "KPI'lar, kohort analizi, tahmin.",
        lessons: ["KPI Tasarımı", "Kohort Analizi", "Basit Tahmin Modelleri"],
        examTopic: "karar destek analitiği",
      },
    ],
  }),
  buildCourse({
    id: "c-iletisim",
    title: "Etkili İş İletişimi",
    description: "Yazılı, sözlü ve sunum becerilerini güçlendir.",
    category: "İletişim",
    level: "Başlangıç",
    cover: "from-pink-400 via-rose-400 to-orange-400",
    instructor: { id: "u-zeynep", name: "Zeynep Demir", title: "Kurumsal İletişim Uzmanı" },
    rating: 4.9,
    enrolled: 2150,
    modules: [
      {
        title: "Yazılı İletişim",
        description: "E-posta, rapor, mesajlaşma.",
        lessons: ["Profesyonel E-posta", "Rapor Yapısı", "Net ve Kısa Yazmak"],
        examTopic: "yazılı iletişim",
      },
      {
        title: "Sözlü İletişim",
        description: "Toplantı, geri bildirim, müzakere.",
        lessons: ["Aktif Dinleme", "Yapıcı Geri Bildirim", "Müzakere Temelleri"],
        examTopic: "sözlü iletişim",
      },
      {
        title: "Sunum Becerileri",
        description: "Hikaye, slayt, sahne.",
        lessons: ["Hikaye Kurgusu", "Görsel Slayt İlkeleri", "Sahne Hakimiyeti"],
        examTopic: "sunum becerileri",
      },
    ],
  }),
];

export const findCourse = (id: string) => COURSES.find((c) => c.id === id);
export const findModule = (mid: string) =>
  COURSES.flatMap((c) => c.modules).find((m) => m.id === mid);
export const findExam = (eid: string) =>
  COURSES.flatMap((c) => c.modules.map((m) => m.exam)).find((e) => e.id === eid);
export const findLesson = (lid: string) =>
  COURSES.flatMap((c) => c.modules.flatMap((m) => m.lessons)).find((l) => l.id === lid);

// ───────────────────────── localStorage progress layer

const KEY = "educell.state.v1";

export interface Attempt {
  id: string;
  exam_id: string;
  course_id: string;
  started_at: number;
  submitted_at: number;
  score: number; // 0..100
  passed: boolean;
  answers: Record<string, string[]>; // question_id -> selected option ids
}

export interface Certificate {
  number: string;
  course_id: string;
  course_title: string;
  user_name: string;
  issued_at: number;
}

export interface Comment {
  id: string;
  lesson_id: string;
  author: string;
  role: "Öğrenci" | "Eğitmen";
  text: string;
  created_at: number;
  reply?: { author: string; text: string; created_at: number };
}

export interface Review {
  id: string;
  course_id: string;
  author: string;
  rating: number;
  text: string;
  created_at: number;
}

interface State {
  enrollments: string[]; // course ids
  completed_lessons: string[];
  attempts: Attempt[];
  certificates: Certificate[];
  comments: Comment[];
  reviews: Review[];
}

const defaultState = (): State => ({
  enrollments: ["c-react-temelleri"],
  completed_lessons: [],
  attempts: [],
  certificates: [
    {
      number: "EDU-DEMO-2026",
      course_id: "c-iletisim",
      course_title: "Etkili İş İletişimi",
      user_name: "Demo Öğrenci",
      issued_at: Date.now() - 86400000 * 5,
    },
  ],
  comments: [],
  reviews: [],
});

export function loadState(): State {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    return { ...defaultState(), ...JSON.parse(raw) };
  } catch {
    return defaultState();
  }
}

export function saveState(s: State) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new Event("educell:state"));
}

import * as React from "react";

export function useEducellState() {
  const [s, setS] = React.useState<State>(() => loadState());
  React.useEffect(() => {
    const h = () => setS(loadState());
    window.addEventListener("educell:state", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("educell:state", h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return s;
}

export function mutate(fn: (s: State) => State) {
  saveState(fn(loadState()));
}

// ───────────────────────── scoring (server-side mantığını taklit eden saf fonksiyon)
export function gradeExam(exam: Exam, answers: Record<string, string[]>) {
  let earned = 0;
  let total = 0;
  const breakdown = exam.questions.map((qu) => {
    total += 1;
    const correctIds = qu.options.filter((o) => o.is_correct).map((o) => o.id);
    const picked = answers[qu.id] ?? [];
    let pts = 0;
    if (qu.type === "MULTI_SELECT") {
      // kısmi puan: doğru seçilen / toplam doğru, yanlış seçim varsa 0
      const wrongPicked = picked.filter((id) => !correctIds.includes(id));
      const rightPicked = picked.filter((id) => correctIds.includes(id));
      if (wrongPicked.length === 0 && correctIds.length > 0) {
        pts = rightPicked.length / correctIds.length;
      }
    } else {
      const eq =
        picked.length === correctIds.length &&
        picked.every((p) => correctIds.includes(p));
      pts = eq ? 1 : 0;
    }
    earned += pts;
    return { question: qu, picked, correctIds, pts };
  });
  const score = total === 0 ? 0 : Math.round((earned / total) * 100);
  return { score, earned, total, breakdown };
}

// shuffle (Fisher–Yates)
export function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// course completion → otomatik sertifika kontrolü
export function checkCourseCompletion(courseId: string): Certificate | null {
  const course = findCourse(courseId);
  if (!course) return null;
  const s = loadState();
  const allLessonsDone = course.modules.every((m) =>
    m.lessons.every((l) => s.completed_lessons.includes(l.id)),
  );
  const allExamsPassed = course.modules.every((m) =>
    s.attempts.some((a) => a.exam_id === m.exam.id && a.passed),
  );
  if (!(allLessonsDone && allExamsPassed)) return null;
  const existing = s.certificates.find((c) => c.course_id === courseId);
  if (existing) return existing;
  const cert: Certificate = {
    number: `EDU-${courseId.slice(2, 6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
    course_id: courseId,
    course_title: course.title,
    user_name: "Demo Öğrenci",
    issued_at: Date.now(),
  };
  mutate((st) => ({ ...st, certificates: [...st.certificates, cert] }));
  return cert;
}

export function isModuleUnlocked(courseId: string, moduleIndex: number): boolean {
  if (moduleIndex === 0) return true;
  const course = findCourse(courseId);
  if (!course) return false;
  const prev = course.modules[moduleIndex - 1];
  const s = loadState();
  return s.attempts.some((a) => a.exam_id === prev.exam.id && a.passed);
}

export function courseProgress(courseId: string): number {
  const c = findCourse(courseId);
  if (!c) return 0;
  const s = loadState();
  const totalUnits = c.modules.reduce((acc, m) => acc + m.lessons.length + 1, 0); // +1 sınav
  let done = 0;
  for (const m of c.modules) {
    for (const l of m.lessons) if (s.completed_lessons.includes(l.id)) done += 1;
    if (s.attempts.some((a) => a.exam_id === m.exam.id && a.passed)) done += 1;
  }
  return Math.round((done / totalUnits) * 100);
}
