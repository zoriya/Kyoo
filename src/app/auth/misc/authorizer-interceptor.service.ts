import {Injectable, Injector} from '@angular/core';
import {
	HttpRequest,
	HttpHandler,
	HttpEvent,
	HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import {OidcSecurityService} from "angular-auth-oidc-client";

@Injectable()
export class AuthorizerInterceptor implements HttpInterceptor 
{
	private oidcSecurity: OidcSecurityService;
	
	
	constructor(private injector: Injector) {}

	intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>>
	{
		if (this.oidcSecurity === undefined)
			this.oidcSecurity = this.injector.get(OidcSecurityService);
		let token = this.oidcSecurity.getToken();
		if (token)
			request = request.clone({setHeaders: {Authorization: "Bearer " + token}});
		return next.handle(request);
	}
}
