import { Injectable } from '@angular/core';
import {
	CanActivate,
	CanLoad,
	Route,
	UrlSegment,
	ActivatedRouteSnapshot,
	RouterStateSnapshot,
	UrlTree,
	Router
} from '@angular/router';
import { Observable } from 'rxjs';
import {AuthService} from "../../services/auth.service";

@Injectable({providedIn: "root"})
export class AuthGuard 
{
	public static guards: any[] = [];
	
	static forPermissions(...permissions: string[])
	{
		@Injectable()
		class AuthenticatedGuard implements CanActivate, CanLoad
		{
			constructor(private router: Router, private authManager: AuthService)  {}
	
			canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree
			{
				if (!this.checkPermissions())
				{
					this.router.navigate(["/unauthorized"]);
					return false;
				}
				return true;
			}
	
			canLoad(route: Route, segments: UrlSegment[]): Observable<boolean> | Promise<boolean> | boolean
			{
				if (!this.checkPermissions())
				{
					this.router.navigate(["/unauthorized"]);
					return false;
				}
				return true;
			}
	
			checkPermissions(): boolean
			{
				if (this.authManager.isAuthenticated)
				{
					let perms = this.authManager.user.permissions.split(",");
					for (let perm of permissions) {
						if (!perms.includes(perm))
							return false;
					}
					return true;
				}
				return false;
			}
		}

		AuthGuard.guards.push(AuthenticatedGuard);
		return AuthenticatedGuard;
	}
}