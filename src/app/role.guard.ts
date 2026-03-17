import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.canAccessSettings()) return true;
  router.navigate(['/quotes']);
  return false;
};

export const approverGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.canApproveQuotes()) return true;
  router.navigate(['/quotes']);
  return false;
};

export const creatorGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.canCreateQuotes()) return true;
  router.navigate(['/quotes']);
  return false;
};