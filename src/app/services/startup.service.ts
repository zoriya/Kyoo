import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root"
})
export class StartupService
{
	constructor() {}

	load(): Promise<any>
	{
		if (window.location.pathname.startsWith("/watch/"))
		{
			const show = window.location.pathname.match(/^\/watch\/(?<show>.*)(-s\d+e\d+)+?$/).groups["show"];
			history.pushState({}, null, `/show/${show}`)
		}
		return Promise.resolve(null);
	}
}
