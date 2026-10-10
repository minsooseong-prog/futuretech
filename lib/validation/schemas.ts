import { z } from 'zod';
import { GRADUATION_PHRASE } from '@/lib/constants';

export function firstError(error: z.ZodError) {
  return error.issues[0]?.message ?? '입력값을 확인해주세요.';
}

const trimmed = (min: number, max: number, label: string) =>
  z
    .string({ invalid_type_error: `${label}을(를) 입력해주세요.` })
    .trim()
    .min(min, min <= 1 ? `${label}을(를) 입력해주세요.` : `${label}은(는) ${min}자 이상이어야 합니다.`)
    .max(max, `${label}은(는) ${max}자 이하로 입력해주세요.`);

export const nameSchema = trimmed(1, 20, '이름').regex(
  /^[가-힣a-zA-Z ]+$/,
  '이름은 한글 또는 영문만 사용할 수 있습니다.',
);

export const studentIdSchema = z
  .string({ invalid_type_error: '학번을 입력해주세요.' })
  .trim()
  .regex(/^\d{5}$/, '학번은 숫자 5자리여야 합니다. (예: 20208)');

// bcrypt는 72바이트까지만 사용하므로 상한을 둡니다.
export const newPasswordSchema = z
  .string({ invalid_type_error: '비밀번호를 입력해주세요.' })
  .min(8, '비밀번호는 8자 이상이어야 합니다.')
  .max(72, '비밀번호는 72자 이하로 입력해주세요.');

const anyPassword = z
  .string({ invalid_type_error: '비밀번호를 입력해주세요.' })
  .min(1, '비밀번호를 입력해주세요.')
  .max(72, '비밀번호가 너무 깁니다.');

export const registerSchema = z
  .object({
    name: nameSchema,
    studentId: studentIdSchema,
    password: newPasswordSchema,
    passwordConfirm: z.string(),
  })
  .refine((v) => v.password === v.passwordConfirm, {
    message: '비밀번호 확인이 일치하지 않습니다.',
    path: ['passwordConfirm'],
  });

export const loginSchema = z.object({
  name: trimmed(1, 20, '이름'),
  studentId: studentIdSchema,
  password: anyPassword,
});

export const gatePasswordSchema = anyPassword;

export const changePasswordSchema = z
  .object({
    currentPassword: anyPassword,
    newPassword: newPasswordSchema,
    newPasswordConfirm: z.string(),
  })
  .refine((v) => v.newPassword === v.newPasswordConfirm, {
    message: '새 비밀번호 확인이 일치하지 않습니다.',
    path: ['newPasswordConfirm'],
  });

export const gatePasswordChangeSchema = z
  .object({
    newPassword: z
      .string()
      .min(4, '비밀번호는 4자 이상이어야 합니다.')
      .max(72, '비밀번호는 72자 이하로 입력해주세요.'),
    newPasswordConfirm: z.string(),
  })
  .refine((v) => v.newPassword === v.newPasswordConfirm, {
    message: '새 비밀번호 확인이 일치하지 않습니다.',
    path: ['newPasswordConfirm'],
  });

export const deleteAccountSchema = z
  .object({
    password: anyPassword,
    passwordAgain: anyPassword,
    phrase: z.string(),
  })
  .refine((v) => v.password === v.passwordAgain, {
    message: '두 비밀번호가 일치하지 않습니다.',
    path: ['passwordAgain'],
  })
  .refine((v) => v.phrase === GRADUATION_PHRASE, {
    message: `확인 문구를 정확히 입력해주세요: ${GRADUATION_PHRASE}`,
    path: ['phrase'],
  });

export const boardPostSchema = z.object({
  category: z.enum(['free', 'question', 'info', 'chat', 'photo', 'homework', 'etc'], {
    errorMap: () => ({ message: '말머리를 선택해주세요.' }),
  }),
  title: trimmed(1, 100, '제목'),
  content: trimmed(1, 10000, '내용'),
});

export const commentSchema = z.object({
  content: trimmed(1, 1000, '댓글'),
});

export const albumPostSchema = z.object({
  title: trimmed(1, 60, '제목'),
  description: z.string().trim().max(1000, '설명은 1000자 이하로 입력해주세요.'),
});

export const noticeSchema = z.object({
  title: trimmed(1, 100, '제목'),
  content: trimmed(1, 10000, '내용'),
  pinned: z.boolean(),
});

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다.');
const hm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, '시간 형식이 올바르지 않습니다.');

export const calendarEventSchema = z
  .object({
    title: trimmed(1, 60, '일정 제목'),
    description: z.string().trim().max(500, '설명은 500자 이하로 입력해주세요.'),
    startDate: ymd,
    endDate: ymd,
    allDay: z.boolean(),
    startTime: hm.nullable(),
    endTime: hm.nullable(),
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: '종료일은 시작일보다 빠를 수 없습니다.',
    path: ['endDate'],
  })
  .refine((v) => v.allDay || v.startTime !== null, {
    message: '시작 시간을 입력해주세요.',
    path: ['startTime'],
  });

export const bioSchema = z.string().trim().max(160, '소개는 160자 이하로 입력해주세요.');

export const profilePostSchema = trimmed(1, 500, '글');
