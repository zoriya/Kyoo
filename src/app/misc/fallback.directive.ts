import { Directive, ElementRef, HostListener, Input } from "@angular/core";

/* tslint:disable:directive-selector */
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
