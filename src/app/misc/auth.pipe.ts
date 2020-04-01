import {Injector, Pipe, PipeTransform} from '@angular/core';
import {AuthService} from "../services/auth.service";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {OidcSecurityService} from "angular-auth-oidc-client";

@Pipe({
	name: 'auth'
})
export class AuthPipe implements PipeTransform 
{
	private oidcSecurity: OidcSecurityService
	
	constructor(private injector: Injector, private http: HttpClient) {}
	
	async transform(uri: string): Promise<string> 
	{
		if (this.oidcSecurity === undefined)
			this.oidcSecurity = this.injector.get(OidcSecurityService);
		let token = this.oidcSecurity.getToken();
		if (!token)
			return uri;
		const headers = new HttpHeaders({"Authorization": "Bearer " + token});
		const img = await this.http.get(uri, {headers, responseType: 'blob'}).toPromise();
		const reader = new FileReader();
		return new Promise((resolve, reject) => {
			reader.onloadend = () => resolve(reader.result as string);
			reader.readAsDataURL(img);
		});
	}
}
