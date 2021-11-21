import { Injector, Pipe, PipeTransform } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { OidcSecurityService } from "angular-auth-oidc-client";

@Pipe({
	name: "auth"
})
export class AuthPipe implements PipeTransform
{
	private oidcSecurity: OidcSecurityService;

	constructor(private injector: Injector, private http: HttpClient) {}

	async transform(uri: string): Promise<string>
	{
		if (this.oidcSecurity === undefined)
			this.oidcSecurity = this.injector.get(OidcSecurityService);
		const token: string = this.oidcSecurity.getAccessToken();
		if (!token)
			return uri;
		const headers: HttpHeaders = new HttpHeaders({Authorization: "Bearer " + token});
		const img: Blob = await this.http.get(uri, {headers, responseType: "blob"}).toPromise();
		const reader: FileReader = new FileReader();
		return new Promise((resolve) => {
			reader.onloadend = () => resolve(reader.result as string);
			reader.readAsDataURL(img);
		});
	}
}
