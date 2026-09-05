/**
 * A student ID is exactly five digits: G CC NN
 *   20208 -> grade 2, class 02, number 08 -> "2학년 2반 8번"
 *
 * 00000 is reserved for the administrator and is never parsed as a student.
 */
export const ADMIN_STUDENT_ID = '00000';

export type ParsedStudentId = {
  grade: number;
  classNumber: number;
  studentNumber: number;
};

export function parseStudentId(studentId: string): ParsedStudentId | null {
  if (!/^\d{5}$/.test(studentId)) return null;
  if (studentId === ADMIN_STUDENT_ID) return null;

  const grade = Number(studentId.slice(0, 1));
  const classNumber = Number(studentId.slice(1, 3));
  const studentNumber = Number(studentId.slice(3, 5));

  if (grade < 1 || grade > 3) return null;
  if (classNumber < 1 || studentNumber < 1) return null;

  return { grade, classNumber, studentNumber };
}

export function formatClassInfo(
  grade: number | null,
  classNumber: number | null,
  studentNumber: number | null,
): string {
  if (grade == null || classNumber == null || studentNumber == null) return '';
  return `${grade}학년 ${classNumber}반 ${studentNumber}번`;
}

export function roleLabel(role: 'student' | 'teacher' | 'admin'): string {
  if (role === 'admin') return '관리자';
  if (role === 'teacher') return '교사';
  return '학생';
}
