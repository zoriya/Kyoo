import {HttpClient} from "@angular/common/http";

export class Page<T>
{
	this: string;
	next: string;
	first: string;
	count: number;
	items: T[];
	private _isLoading: boolean = false;

	constructor(init?:Partial<Page<T>>)
	{
		Object.assign(this, init);
	}

	loadNext(client: HttpClient)
	{
		if (this.next == null || this._isLoading)
			return;

		this._isLoading = true;
		client.get<Page<T>>(this.next).subscribe(x =>
		{
			this.items.push(...x.items);
			this.count += x.count;
			this.next = x.next;
			this.this = x.this;
			this._isLoading = false;
		});
	}

	changeType(type: string)
	{
		return this.first.replace(/\/\w*($|\?)/, `/${type}$1`)
	}
}
