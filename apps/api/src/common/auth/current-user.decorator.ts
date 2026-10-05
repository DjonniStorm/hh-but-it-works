import { ExecutionContext, createParamDecorator } from "@nestjs/common";

import { User } from "../../modules/users/user.entity";

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest<{ user: User }>();
    return request.user;
  },
);
