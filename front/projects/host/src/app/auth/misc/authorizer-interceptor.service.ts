import { Injectable, Injector } from "@angular/core";
import {
	HttpRequest,
	HttpHandler,
	HttpEvent,
	HttpInterceptor
} from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable()
export class AuthorizerInterceptor implements HttpInterceptor
{
	constructor(private injector: Injector) {}

	intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>>
	{
		if (request.url.startsWith("http"))
			return next.handle(request);
		const token: string = null;
		if (token)
			request = request.clone({setHeaders: {Authorization: "Bearer " + token}});
		return next.handle(request);
	}
}
