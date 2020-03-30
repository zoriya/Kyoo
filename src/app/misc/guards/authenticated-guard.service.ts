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
	static forPermissions(permissions: string | string[])
	{
		@Injectable()
		class AuthenticatedGuard implements CanActivate, CanLoad
		{
			constructor(private router: Router, private authManager: AuthService)  {}
	
			canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree
			{
				return this.checkPermissions();
			}
	
			canLoad(route: Route, segments: UrlSegment[]): Observable<boolean> | Promise<boolean> | boolean
			{
				return this.checkPermissions();
			}
	
			checkPermissions(): boolean
			{
				if (this.authManager.isAuthenticated)
				{
					// if (this.authManager.user.claims)
					return true;
				}
				this.router.navigate(["/unauthorized"]);
				return false;
			}
		}
	}
}