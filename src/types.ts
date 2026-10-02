export enum PartType {
  PART1 = 1,
  PART2 = 2,
  PART3 = 3,
}

export interface Folder {
  id: string;
  name: string;
  createdAt: string;
  teacherId?: string;
  parentId?: string;
  type?: 'question' | 'student';
}

export interface Question {
  id: string;
  part: PartType;
  question: string;
  A?: string;
  B?: string;
  C?: string;
  D?: string;
  statements?: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  answer: string | { a: boolean; b: boolean; c: boolean; d: boolean };
  folderId?: string;
  teacherId?: string;
}

export interface StudentResult {
  id: string;
  studentName: string;
  studentId: string;
  score: number;
  part1Score: number;
  part2Score: number;
  part3Score: number;
  timestamp: string;
  answers: Record<string, any>;
  examId?: string;
  examName?: string;
}

export interface Student {
  id: string; // SBD
  name: string;
  createdAt: string;
  teacherId?: string; // ID of the teacher who registered them
  className?: string; // Class name or identifier
  folderId?: string;
}

export interface Teacher {
  id: string; // Username/Teacher Code
  name: string;
  className: string;
  createdAt: string;
  password?: string;
}

export interface ExamRoom {
  id: string;
  name: string;
  code: string;
  duration: number; // in minutes
  startTime?: string;
  endTime?: string;
  releaseTime?: string; // ISO 8601 string
  isActive: boolean;
  questionIds: string[];
  part1Point?: number;
  part2Point1?: number;
  part2Point2?: number;
  part2Point3?: number;
  part2Point4?: number;
  part3Point?: number;
  allowReview?: boolean;
  teacherId?: string;
  isFree?: boolean;
  shuffleQuestions?: boolean;
  shuffleAnswers?: boolean;
}
