import { catsTable } from '../../src/db/schema/cat';

type Cat = typeof catsTable.$inferSelect;

export interface GetCatResponse extends Array<Cat> {}

export interface CreateCatResponse extends Cat {}
