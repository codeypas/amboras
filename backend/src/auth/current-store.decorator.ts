import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export type CurrentStoreContext = {
  sub: string;
  storeId: string;
  storeName: string;
};

export const CurrentStore = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CurrentStoreContext => {
    const request = context.switchToHttp().getRequest();
    return request.user as CurrentStoreContext;
  }
);
