import type { Role } from '@/lib/db/schema';

/**
 * 학번 5자리 해석: 첫째 자리 = 학년, 둘째·셋째 = 반, 넷째·다섯째 = 번호
 * 20208 → 2학년 2반 8번
 */
export function parseStudentId(studentId: string) {
  if (!/^\d{5}$/.test(studentId)) return null;
  const grade = Number(studentId[0]);
  const classNumber = Number(studentId.slice(1, 3));
  const studentNumber = Number(studentId.slice(3, 5));
  if (grade < 1 || grade > 3 || classNumber < 1 || studentNumber < 1) return null;
  return { grade, classNumber, studentNumber };
}

type Info = {
  role: Role;
  grade: number | null;
  classNumber: number | null;
  studentNumber: number | null;
};

export function formatStudentInfo(u: Info) {
  if (u.role === 'admin') return '교사 (관리자)';
  if (u.role === 'teacher') return '교사';
  if (u.grade && u.classNumber && u.studentNumber) {
    return `${u.grade}학년 ${u.classNumber}반 ${u.studentNumber}번`;
  }
  return '';
}

export const isStaff = (role: Role) => role === 'admin' || role === 'teacher';
