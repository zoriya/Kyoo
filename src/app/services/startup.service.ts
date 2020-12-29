import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root"
})
export class StartupService
{
	loadedFromWatch: boolean = false;
	show: string = null;

	constructor() {}

	load(): Promise<any>
	{
		if (window.location.pathname.startsWith("/watch/"))
		{
			this.loadedFromWatch = true;
			this.show = window.location.pathname.match(/^\/watch\/(?<show>.*)(-s\d+e\d+)+?$/).groups["show"];
		}
		return Promise.resolve(null);
	}
}
