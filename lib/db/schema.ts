import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';

export const userRole = pgEnum('user_role', ['student', 'teacher', 'admin']);

/* ------------------------------------------------------------------ */
/* Users                                                               */
/* ------------------------------------------------------------------ */

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    studentId: varchar('student_id', { length: 5 }).notNull(),
    name: varchar('name', { length: 30 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    role: userRole('role').notNull().default('student'),
    grade: smallint('grade'),
    classNumber: smallint('class_number'),
    studentNumber: smallint('student_number'),
    avatarPath: text('avatar_path'),
    bio: text('bio'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    studentIdIdx: uniqueIndex('users_student_id_key').on(t.studentId),
    roleGradeIdx: index('users_role_grade_idx').on(t.role, t.grade, t.classNumber, t.studentNumber),
    nameIdx: index('users_name_idx').on(t.name),
  }),
);

/* ------------------------------------------------------------------ */
/* Sessions                                                            */
/* ------------------------------------------------------------------ */

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    userAgent: text('user_agent'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tokenIdx: uniqueIndex('sessions_token_hash_key').on(t.tokenHash),
    userIdx: index('sessions_user_id_idx').on(t.userId),
    expiresIdx: index('sessions_expires_at_idx').on(t.expiresAt),
  }),
);

/* ------------------------------------------------------------------ */
/* Personal mini-homepage (Cyworld inspired)                           */
/* ------------------------------------------------------------------ */

export const profilePosts = pgTable(
  'profile_posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ userIdx: index('profile_posts_user_idx').on(t.userId, t.createdAt) }),
);

export const profileImages = pgTable(
  'profile_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    storagePath: text('storage_path').notNull(),
    thumbPath: text('thumb_path'),
    caption: varchar('caption', { length: 120 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ userIdx: index('profile_images_user_idx').on(t.userId, t.createdAt) }),
);

/* ------------------------------------------------------------------ */
/* Community board                                                     */
/* ------------------------------------------------------------------ */

export const boardPosts = pgTable(
  'board_posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    category: varchar('category', { length: 12 }).notNull().default('자유'),
    title: varchar('title', { length: 120 }).notNull(),
    content: text('content').notNull(),
    views: integer('views').notNull().default(0),
    likes: integer('likes').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    createdIdx: index('board_posts_created_idx').on(t.createdAt),
    categoryIdx: index('board_posts_category_idx').on(t.category, t.createdAt),
    authorIdx: index('board_posts_author_idx').on(t.authorId),
  }),
);

export const boardImages = pgTable(
  'board_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    postId: uuid('post_id')
      .notNull()
      .references(() => boardPosts.id, { onDelete: 'cascade' }),
    storagePath: text('storage_path').notNull(),
    sortOrder: smallint('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ postIdx: index('board_images_post_idx').on(t.postId, t.sortOrder) }),
);

export const comments = pgTable(
  'comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    postId: uuid('post_id')
      .notNull()
      .references(() => boardPosts.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    parentId: uuid('parent_id').references((): AnyPgColumn => comments.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ postIdx: index('comments_post_idx').on(t.postId, t.createdAt) }),
);

export const postLikes = pgTable(
  'post_likes',
  {
    postId: uuid('post_id')
      .notNull()
      .references(() => boardPosts.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ pk: uniqueIndex('post_likes_pk').on(t.postId, t.userId) }),
);

/* ------------------------------------------------------------------ */
/* Class album                                                         */
/* ------------------------------------------------------------------ */

export const albumPosts = pgTable(
  'album_posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 120 }).notNull(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ createdIdx: index('album_posts_created_idx').on(t.createdAt) }),
);

export const albumImages = pgTable(
  'album_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    albumPostId: uuid('album_post_id')
      .notNull()
      .references(() => albumPosts.id, { onDelete: 'cascade' }),
    storagePath: text('storage_path').notNull(),
    thumbPath: text('thumb_path'),
    sortOrder: smallint('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ albumIdx: index('album_images_album_idx').on(t.albumPostId, t.sortOrder) }),
);

/* ------------------------------------------------------------------ */
/* Notices / calendar / settings                                       */
/* ------------------------------------------------------------------ */

export const notices = pgTable(
  'notices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    authorId: uuid('author_id').references(() => users.id, { onDelete: 'set null' }),
    authorName: varchar('author_name', { length: 30 }).notNull(),
    title: varchar('title', { length: 120 }).notNull(),
    content: text('content').notNull(),
    pinned: boolean('pinned').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ listIdx: index('notices_list_idx').on(t.pinned, t.createdAt) }),
);

export const calendarEvents = pgTable(
  'calendar_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 120 }).notNull(),
    description: text('description'),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    allDay: boolean('all_day').notNull().default(true),
    startTime: varchar('start_time', { length: 5 }),
    endTime: varchar('end_time', { length: 5 }),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdByName: varchar('created_by_name', { length: 30 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ rangeIdx: index('calendar_events_range_idx').on(t.startDate, t.endDate) }),
);

export const siteSettings = pgTable('site_settings', {
  id: smallint('id').primaryKey().default(1),
  noticePasswordHash: text('notice_password_hash').notNull(),
  calendarPasswordHash: text('calendar_password_hash').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const userPreferences = pgTable('user_preferences', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  theme: varchar('theme', { length: 8 }).notNull().default('light'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const alumni = pgTable(
  'alumni',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 30 }).notNull(),
    graduatedAt: timestamp('graduated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ gradIdx: index('alumni_graduated_idx').on(t.graduatedAt) }),
);

export const loginAttempts = pgTable(
  'login_attempts',
  {
    identifier: varchar('identifier', { length: 80 }).primaryKey(),
    attempts: smallint('attempts').notNull().default(0),
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({ lockedIdx: index('login_attempts_locked_idx').on(t.lockedUntil) }),
);

/* ------------------------------------------------------------------ */
/* Relations                                                           */
/* ------------------------------------------------------------------ */

export const usersRelations = relations(users, ({ many, one }) => ({
  sessions: many(sessions),
  boardPosts: many(boardPosts),
  albumPosts: many(albumPosts),
  comments: many(comments),
  profilePosts: many(profilePosts),
  profileImages: many(profileImages),
  preferences: one(userPreferences, {
    fields: [users.id],
    references: [userPreferences.userId],
  }),
}));

export const boardPostsRelations = relations(boardPosts, ({ one, many }) => ({
  author: one(users, { fields: [boardPosts.authorId], references: [users.id] }),
  images: many(boardImages),
  comments: many(comments),
}));

export const boardImagesRelations = relations(boardImages, ({ one }) => ({
  post: one(boardPosts, { fields: [boardImages.postId], references: [boardPosts.id] }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(boardPosts, { fields: [comments.postId], references: [boardPosts.id] }),
  author: one(users, { fields: [comments.authorId], references: [users.id] }),
}));

export const albumPostsRelations = relations(albumPosts, ({ one, many }) => ({
  author: one(users, { fields: [albumPosts.authorId], references: [users.id] }),
  images: many(albumImages),
}));

export const albumImagesRelations = relations(albumImages, ({ one }) => ({
  post: one(albumPosts, { fields: [albumImages.albumPostId], references: [albumPosts.id] }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type BoardPost = typeof boardPosts.$inferSelect;
export type AlbumPost = typeof albumPosts.$inferSelect;
export type Notice = typeof notices.$inferSelect;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
