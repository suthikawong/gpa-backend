import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from '../decorators/roles.decorator';
import { User } from '../../drizzle/schema';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roleList = this.reflector.get(Roles, context.getHandler());
    if (!roleList) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user: User = request.user;
    const roles = roleList.map((role) => parseInt(role));
    return roles.includes(user.roleId);
  }
}
