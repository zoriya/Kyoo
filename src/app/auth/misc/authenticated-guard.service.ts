import {Injectable} from '@angular/core';
import {
	CanActivate,
	CanLoad,
	Route,
	UrlSegment,
	ActivatedRouteSnapshot,
	RouterStateSnapshot,
	Router
} from '@angular/router';
import {Observable} from 'rxjs';
import {AuthService} from "../auth.service";

@Injectable({providedIn: "root"})
export class AuthGuard 
{
	public static guards: any[] = [];
	public static defaultPermissions: string[];
	public static permissionsObservable: Observable<string[]>;

	static forPermissions(...permissions: string[])
	{
		@Injectable()
		class AuthenticatedGuard implements CanActivate, CanLoad
		{
			constructor(private router: Router, private authManager: AuthService)  {}
	
			async canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean>
			{
				if (!await this.checkPermissions())
				{
					await this.router.navigate(["/unauthorized"]);
					return false;
				}
				return true;
			}
	
			async canLoad(route: Route, segments: UrlSegment[]): Promise<boolean>
			{
				if (!await this.checkPermissions())
				{
					await this.router.navigate(["/unauthorized"]);
					return false;
				}
				return true;
			}
	
			async checkPermissions(): Promise<boolean>
			{
				if (this.authManager.isAuthenticated)
				{
					const perms: string[] = this.authManager.account.permissions;
					for (let perm of permissions) {
						if (!perms.includes(perm))
							return false;
					}
					return true;
				}
				else 
				{
					if (AuthGuard.defaultPermissions == undefined)
						await AuthGuard.permissionsObservable.toPromise()

					for (let perm of permissions)
						if (!AuthGuard.defaultPermissions.includes(perm))
							return false;
					return true;
				}
			}
		}

		AuthGuard.guards.push(AuthenticatedGuard);
		return AuthenticatedGuard;
	}
}
