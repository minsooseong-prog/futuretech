import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('user_role', ['student', 'teacher', 'admin']);
export const themeEnum = pgEnum('theme', ['light', 'dark']);
export const boardCategoryEnum = pgEnum('board_category', [
  'free',
  'question',
  'info',
  'chat',
  'photo',
  'homework',
  'etc',
]);

const createdAt = () => timestamp('created_at', { withTimezone: true }).defaultNow().notNull();
const updatedAt = () => timestamp('updated_at', { withTimezone: true }).defaultNow().notNull();

/* ─────────────────────────── 사용자 / 인증 ─────────────────────────── */

// 프로필 정보(아바타, 소개)는 1:1 관계이므로 users 테이블에 통합했습니다.
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    studentId: varchar('student_id', { length: 5 }).notNull().unique(),
    name: varchar('name', { length: 20 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    role: roleEnum('role').notNull().default('student'),
    grade: integer('grade'),
    classNumber: integer('class_number'),
    studentNumber: integer('student_number'),
    avatarPath: text('avatar_path'),
    bio: varchar('bio', { length: 160 }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('users_name_idx').on(t.name), index('users_grade_idx').on(t.grade)],
);

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('sessions_user_idx').on(t.userId)],
);

export const userPreferences = pgTable('user_preferences', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  theme: themeEnum('theme').notNull().default('light'),
  updatedAt: updatedAt(),
});

// 로그인/비밀번호 시도 등 속도 제한용 이벤트 로그
export const rateLimitEvents = pgTable(
  'rate_limit_events',
  {
    id: serial('id').primaryKey(),
    key: varchar('key', { length: 120 }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('rate_limit_key_time_idx').on(t.key, t.createdAt)],
);

/* ─────────────────────────── 개인 프로필 ─────────────────────────── */

export const profilePosts = pgTable(
  'profile_posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content: varchar('content', { length: 500 }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('profile_posts_user_idx').on(t.userId, t.createdAt)],
);

export const profileImages = pgTable(
  'profile_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    storagePath: text('storage_path').notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('profile_images_user_idx').on(t.userId, t.createdAt)],
);

/* ─────────────────────────── 게시판 ─────────────────────────── */

export const boardPosts = pgTable(
  'board_posts',
  {
    id: serial('id').primaryKey(),
    authorId: uuid('author_id').references(() => users.id, { onDelete: 'set null' }),
    category: boardCategoryEnum('category').notNull().default('free'),
    title: varchar('title', { length: 100 }).notNull(),
    content: text('content').notNull(),
    views: integer('views').notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('board_posts_created_idx').on(t.createdAt),
    index('board_posts_category_idx').on(t.category, t.createdAt),
  ],
);

export const boardImages = pgTable(
  'board_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    postId: integer('post_id')
      .notNull()
      .references(() => boardPosts.id, { onDelete: 'cascade' }),
    storagePath: text('storage_path').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index('board_images_post_idx').on(t.postId)],
);

export const boardLikes = pgTable(
  'board_likes',
  {
    postId: integer('post_id')
      .notNull()
      .references(() => boardPosts.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.postId, t.userId] })],
);

export const comments = pgTable(
  'comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    postId: integer('post_id')
      .notNull()
      .references(() => boardPosts.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id').references(() => users.id, { onDelete: 'set null' }),
    content: varchar('content', { length: 1000 }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('comments_post_idx').on(t.postId, t.createdAt)],
);

/* ─────────────────────────── 앨범 ─────────────────────────── */

export const albumPosts = pgTable(
  'album_posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    authorId: uuid('author_id').references(() => users.id, { onDelete: 'set null' }),
    title: varchar('title', { length: 60 }).notNull(),
    description: varchar('description', { length: 1000 }).notNull().default(''),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('album_posts_created_idx').on(t.createdAt)],
);

export const albumImages = pgTable(
  'album_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    albumPostId: uuid('album_post_id')
      .notNull()
      .references(() => albumPosts.id, { onDelete: 'cascade' }),
    storagePath: text('storage_path').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index('album_images_post_idx').on(t.albumPostId, t.sortOrder)],
);

/* ─────────────────────────── 공지 / 일정 ─────────────────────────── */

export const notices = pgTable(
  'notices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    authorId: uuid('author_id').references(() => users.id, { onDelete: 'set null' }),
    title: varchar('title', { length: 100 }).notNull(),
    content: text('content').notNull(),
    pinned: boolean('pinned').notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('notices_order_idx').on(t.pinned, t.createdAt)],
);

export const calendarEvents = pgTable(
  'calendar_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 60 }).notNull(),
    description: varchar('description', { length: 500 }).notNull().default(''),
    startDate: date('start_date', { mode: 'string' }).notNull(),
    endDate: date('end_date', { mode: 'string' }).notNull(),
    allDay: boolean('all_day').notNull().default(true),
    startTime: varchar('start_time', { length: 5 }),
    endTime: varchar('end_time', { length: 5 }),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
  },
  (t) => [index('calendar_events_range_idx').on(t.startDate, t.endDate)],
);

/* ─────────────────────────── 사이트 설정 / 졸업생 ─────────────────────────── */

export const siteSettings = pgTable('site_settings', {
  id: integer('id').primaryKey().default(1),
  noticePasswordHash: text('notice_password_hash').notNull(),
  calendarPasswordHash: text('calendar_password_hash').notNull(),
  updatedAt: updatedAt(),
});

export const alumni = pgTable('alumni', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 20 }).notNull(),
  graduatedAt: timestamp('graduated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type Role = (typeof roleEnum.enumValues)[number];
export type Theme = (typeof themeEnum.enumValues)[number];
export type BoardCategory = (typeof boardCategoryEnum.enumValues)[number];
