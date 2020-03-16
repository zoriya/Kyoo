import {Directive, ElementRef, HostListener, Input} from '@angular/core';

@Directive({
	selector: 'img[fallback]'
})
export class FallbackDirective 
{
	@Input() fallback: string;
	
	constructor(private img: ElementRef) { }
	
	@HostListener("error")
	onError()
	{
		const html: HTMLImageElement = this.img.nativeElement;
		html.src = this.fallback;
	}
}
