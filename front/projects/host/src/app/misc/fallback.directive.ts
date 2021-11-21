import { Directive, ElementRef, HostListener, Input, Pipe, PipeTransform } from "@angular/core";

/* eslint-disable @angular-eslint/directive-selector */
@Directive({
	selector: "img[fallback]"
})
export class FallbackDirective
{
	@Input() fallback: string;

	constructor(private img: ElementRef) { }

	@HostListener("error")
	onError(): void
	{
		const html: HTMLImageElement = this.img.nativeElement;
		html.src = this.fallback;
	}
}

@Pipe({
	name: "fallback",
	pure: true
})
export class FallbackPipe implements PipeTransform
{
	transform(value: any, ...args: any[]): any
	{
		return value ?? args.find(x => x);
	}
}
