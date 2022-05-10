import { Injector, Pipe, PipeTransform } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";

@Pipe({
	name: "auth"
})
export class AuthPipe implements PipeTransform
{
	constructor(private injector: Injector, private http: HttpClient) {}

	async transform(uri: string): Promise<string>
	{
		const token: string = null;
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
