import { Injectable } from "@angular/core";
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

@Injectable()
export class DatetimeInterceptorService implements HttpInterceptor
{
	intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>>
	{
		return next.handle(request)
			.pipe(map((event: HttpEvent<any>) =>
			{
				if (event instanceof HttpResponse)
					return event.clone({body: this.convertDates(event.body)});
				return event;
			}));
	}


	private convertDates<T>(object: T): T | Date
	{
		if (typeof(object) === "string" && /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z?$/.exec(object))
		{
			return new Date(object);
		}

		if (object instanceof Array)
		{
			for (const i in object)
				object[i] = this.convertDates(object[i]);
		}
		else if (object instanceof Object)
		{
			for (const key of Object.keys(object))
				object[key] = this.convertDates(object[key]);
		}
		return object;
	}
}
