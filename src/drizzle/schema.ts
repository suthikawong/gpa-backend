import { integer, pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core';

export const cats = pgTable('cats', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  age: integer().notNull(),
  breed: varchar({ length: 255 }).notNull(),
});

export const users = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  email: varchar({ length: 255 }).notNull(),
  password: varchar({ length: 255 }).notNull(),
  refreshToken: text(),
});
