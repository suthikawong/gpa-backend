import { User } from 'src/drizzle/schema';

export type UserProtected = Omit<User, 'password' | 'refreshToken'>;
