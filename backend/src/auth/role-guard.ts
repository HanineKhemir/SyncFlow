import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './decorator/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role || !user.companyId) {
      throw new ForbiddenException('Access denied: no valid user or company context.');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(`Access denied: role ${user.role} is not permitted.`);
    }

    // If you want to check against specific companyCode, you could enhance this
    // For now, we assume the JWT includes correct companyId

    return true;
  }
}
