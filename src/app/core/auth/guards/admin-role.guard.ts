import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';
import { UserService } from 'app/core/user/user.service';
import { Role } from 'app/models/role.model';
import { of, switchMap } from 'rxjs';

export const AdminRoleGuard: CanActivateFn | CanActivateChildFn = (route, state) =>
{
    const router: Router = inject(Router);

    // Check the authentication status
    return inject(UserService).user$.pipe(
        switchMap((user) =>
        {
            console.log(user, "from AdminRoleGuard");
            if (user.role !== Role.Admin && user.role !== Role.SuperAdmin) {
                router.navigateByUrl('');
            }
            // Allow the access
            return of(user.role === Role.Admin || user.role === Role.SuperAdmin);
        }),
    );
};
