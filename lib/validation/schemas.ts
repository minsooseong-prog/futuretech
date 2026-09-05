import { z } from 'zod';

export const BOARD_CATEGORIES = ['자유', '질문', '정보', '잡담', '사진', '과제', '기타'] as const;
export type BoardCategory = (typeof BOARD_CATEGORIES)[number];

const name = z
  .string()
  .trim()
  .min(2, '이름은 2자 이상이어야 합니다.')
  .max(20, '이름은 20자 이하여야 합니다.')
  .regex(/^[가-힣a-zA-Z\s]+$/, '이름에는 한글 또는 영문만 사용할 수 있습니다.');

const studentId = z
  .string()
  .trim()
  .regex(/^\d{5}$/, '학번은 숫자 5자리입니다. 예) 20208');

const password = z
  .string()
  .min(5, '비밀번호는 5자 이상이어야 합니다.')
  .max(72, '비밀번호는 72자 이하여야 합니다.');

export const registerSchema = z
  .object({
    name,
    studentId: studentId.refine((v) => /^[1-3]/.test(v), {
      message: '학번의 첫 자리는 학년(1~3)이어야 합니다.',
    }),
    password,
    passwordConfirm: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    path: ['passwordConfirm'],
    message: '비밀번호가 일치하지 않습니다.',
  });

export const loginSchema = z.object({
  name,
  studentId,
  password: z.string().min(1, '비밀번호를 입력해 주세요.'),
});

export const profileSchema = z.object({
  bio: z.string().trim().max(200, '소개는 200자까지 쓸 수 있습니다.').optional().default(''),
});

export const profilePostSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, '내용을 입력해 주세요.')
    .max(500, '500자까지 쓸 수 있습니다.'),
});

export const boardPostSchema = z.object({
  category: z.enum(BOARD_CATEGORIES, { errorMap: () => ({ message: '말머리를 선택해 주세요.' }) }),
  title: z
    .string()
    .trim()
    .min(2, '제목은 2자 이상이어야 합니다.')
    .max(120, '제목은 120자 이하여야 합니다.'),
  content: z
    .string()
    .trim()
    .min(1, '내용을 입력해 주세요.')
    .max(20000, '내용이 너무 깁니다.'),
  imagePaths: z.array(z.string()).max(10, '사진은 10장까지 첨부할 수 있습니다.').default([]),
});

export const commentSchema = z.object({
  postId: z.string().uuid(),
  parentId: z.string().uuid().nullable().optional(),
  content: z
    .string()
    .trim()
    .min(1, '댓글을 입력해 주세요.')
    .max(1000, '댓글은 1000자까지 쓸 수 있습니다.'),
});

export const albumPostSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, '제목은 2자 이상이어야 합니다.')
    .max(120, '제목은 120자 이하여야 합니다.'),
  description: z.string().trim().max(2000, '설명이 너무 깁니다.').optional().default(''),
  images: z
    .array(z.object({ path: z.string().min(1), thumbPath: z.string().nullable().optional() }))
    .min(1, '사진을 한 장 이상 올려 주세요.')
    .max(10, '사진은 10장까지 올릴 수 있습니다.'),
});

export const noticeSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, '제목은 2자 이상이어야 합니다.')
    .max(120, '제목은 120자 이하여야 합니다.'),
  content: z.string().trim().min(1, '내용을 입력해 주세요.').max(20000, '내용이 너무 깁니다.'),
  pinned: z.boolean().default(false),
  password: z.string().optional().default(''),
});

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다.');
const clock = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, '시간 형식이 올바르지 않습니다.')
  .optional()
  .or(z.literal(''));

export const calendarEventSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, '일정 이름은 2자 이상이어야 합니다.')
      .max(120, '일정 이름이 너무 깁니다.'),
    description: z.string().trim().max(2000, '설명이 너무 깁니다.').optional().default(''),
    startDate: isoDate,
    endDate: isoDate,
    allDay: z.boolean().default(true),
    startTime: clock,
    endTime: clock,
    password: z.string().optional().default(''),
  })
  .refine((d) => d.endDate >= d.startDate, {
    path: ['endDate'],
    message: '종료일이 시작일보다 빠를 수 없습니다.',
  })
  .refine((d) => d.allDay || (!!d.startTime && !!d.endTime), {
    path: ['startTime'],
    message: '시작 시간과 종료 시간을 입력해 주세요.',
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, '현재 비밀번호를 입력해 주세요.'),
    newPassword: password,
    newPasswordConfirm: z.string(),
  })
  .refine((d) => d.newPassword === d.newPasswordConfirm, {
    path: ['newPasswordConfirm'],
    message: '새 비밀번호가 일치하지 않습니다.',
  });

export const sitePasswordSchema = z
  .object({
    target: z.enum(['notice', 'calendar']),
    newPassword: z
      .string()
      .min(5, '비밀번호는 5자 이상이어야 합니다.')
      .max(72, '비밀번호가 너무 깁니다.'),
    newPasswordConfirm: z.string(),
  })
  .refine((d) => d.newPassword === d.newPasswordConfirm, {
    path: ['newPasswordConfirm'],
    message: '비밀번호가 일치하지 않습니다.',
  });

export const GRADUATION_PHRASE = '학교를 졸업하겠습니다';

export const deleteAccountSchema = z
  .object({
    password: z.string().min(1, '비밀번호를 입력해 주세요.'),
    passwordAgain: z.string().min(1, '비밀번호를 한 번 더 입력해 주세요.'),
    phrase: z.string(),
  })
  .refine((d) => d.password === d.passwordAgain, {
    path: ['passwordAgain'],
    message: '두 비밀번호가 서로 다릅니다.',
  })
  .refine((d) => d.phrase.trim() === GRADUATION_PHRASE, {
    path: ['phrase'],
    message: `"${GRADUATION_PHRASE}" 를 정확히 입력해 주세요.`,
  });

export const roleChangeSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['student', 'teacher', 'admin']),
});

export const themeSchema = z.object({ theme: z.enum(['light', 'dark']) });

export const searchSchema = z.object({
  q: z.string().trim().min(1).max(60),
});
