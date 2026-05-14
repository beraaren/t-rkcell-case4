export type Role = "STUDENT" | "INSTRUCTOR" | "ADMIN";
export type Level = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type QuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "MULTI_SELECT";
export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "EXPIRED";

export interface User {
  id: string;
  gsm: string;
  name: string;
  role: Role;
  bio?: string;
}

export interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  examId: string;
  type: QuestionType;
  text: string;
  options: Option[];
  orderIndex: number;
}

export interface Exam {
  id: string;
  moduleId: string;
  timeLimitMin: number;
  passingScore: number;
  shuffle: boolean;
  maxAttempts: number;
  questions: Question[];
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  content: string;
  estimatedDuration: number;
  orderIndex: number;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  orderIndex: number;
  lessons: Lesson[];
  exam?: Exam;
}

export interface Course {
  id: string;
  instructorId: string;
  instructorName: string;
  title: string;
  description: string;
  category: string;
  level: Level;
  coverEmoji: string;
  estimatedDuration: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  modules: Module[];
}

export interface Enrollment {
  userId: string;
  courseId: string;
  enrolledAt: string;
}

export interface LessonProgress {
  userId: string;
  lessonId: string;
  completedAt: string;
}

export interface UserAnswer {
  questionId: string;
  selectedOptionIds: string[];
}

export interface ExamAttempt {
  id: string;
  userId: string;
  examId: string;
  startedAt: string;
  expiresAt: string;
  submittedAt?: string;
  score?: number;
  status: AttemptStatus;
  answers: UserAnswer[];
  shuffledQuestionIds: string[];
}

export interface Certificate {
  id: string;
  number: string;
  userId: string;
  courseId: string;
  issuedAt: string;
}

export interface Comment {
  id: string;
  lessonId: string;
  userId: string;
  userName: string;
  userRole: Role;
  parentId?: string;
  text: string;
  createdAt: string;
}

export interface Review {
  id: string;
  courseId: string;
  userId: string;
  userName: string;
  rating: number;
  text?: string;
  createdAt: string;
}
