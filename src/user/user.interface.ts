import { Exclude } from 'class-transformer';
import { User } from '../drizzle/schema';

export class UserProtected {
  userId: User['userId'];
  name: User['name'];
  email: User['email'];
  roleId: User['roleId'];

  @Exclude()
  password?: User['password'];

  @Exclude()
  refreshToken?: User['refreshToken'];

  @Exclude()
  isVerified?: User['isVerified'];

  @Exclude()
  verificationToken?: User['verificationToken'];

  @Exclude()
  resetPasswordToken?: User['resetPasswordToken'];

  @Exclude()
  createdDate?: User['createdDate'];

  @Exclude()
  updatedDate?: User['updatedDate'];
}
