import { cats } from '../../drizzle/schema';

type Cat = typeof cats.$inferSelect;

export interface GetCatResponse extends Array<Cat> {}

export interface CreateCatResponse extends Cat {}
