import { createParamDecorator, ExecutionContext } from '@nestjs/common';

const getLoggedInUserByContext = (context: ExecutionContext) => {
  return context.switchToHttp().getRequest().user;
};

export const LoggedInUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    getLoggedInUserByContext(context),
);
