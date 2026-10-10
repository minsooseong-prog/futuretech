import type { BoardCategory } from '@/lib/db/schema';

export const STORAGE_BUCKET = 'future-tech';

export const BOARD_CATEGORIES: { value: BoardCategory; label: string }[] = [
  { value: 'free', label: '자유' },
  { value: 'question', label: '질문' },
  { value: 'info', label: '정보' },
  { value: 'chat', label: '잡담' },
  { value: 'photo', label: '사진' },
  { value: 'homework', label: '과제' },
  { value: 'etc', label: '기타' },
];

export const categoryLabel = (value: string) =>
  BOARD_CATEGORIES.find((c) => c.value === value)?.label ?? '기타';

export const GRADUATION_PHRASE = '학교를 졸업하겠습니다';

export const LIMITS = {
  albumImages: 10,
  boardImages: 5,
  profileImagesPerUpload: 5,
  boardPageSize: 20,
} as const;

export const IMAGE_SIZES = {
  full: 1920,
  thumb: 480,
  avatar: 512,
} as const;
