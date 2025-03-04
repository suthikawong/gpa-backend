import { integer, pgTable, varchar } from 'drizzle-orm/pg-core';

export const catTable = pgTable('cat', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  age: integer().notNull(),
  breed: varchar({ length: 255 }).notNull(),
});
