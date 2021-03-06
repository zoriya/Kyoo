import { ElementRef, ViewChild } from "@angular/core";
import { MatButton } from "@angular/material/button";


export class HorizontalScroller
{
	@ViewChild("scrollView", { static: true }) private scrollView: ElementRef;
	@ViewChild("leftBtn", { static: false }) private leftBtn: MatButton;
	@ViewChild("rightBtn", { static: false }) private rightBtn: MatButton;
	@ViewChild("itemsDom", { static: false }) private itemsDom: ElementRef;

	scrollLeft(): void
	{
		const scroll: number = this.roundScroll(this.scrollView.nativeElement.offsetWidth * 0.80);
		this.scrollView.nativeElement.scrollBy({ top: 0, left: -scroll, behavior: "smooth" });
	}

	scrollRight(): void
	{
		const scroll: number = this.roundScroll(this.scrollView.nativeElement.offsetWidth * 0.80);
		this.scrollView.nativeElement.scrollBy({ top: 0, left: scroll, behavior: "smooth" });
	}

	roundScroll(offset: number): number
	{
		const itemSize: number = this.itemsDom.nativeElement.scrollWidth;

		offset = Math.round(offset / itemSize) * itemSize;
		if (offset === 0)
			offset = itemSize;
		return offset;
	}

	onScroll(): void
	{
		const scroll: any = this.scrollView.nativeElement;

		if (scroll.scrollLeft <= 0)
			this.leftBtn._elementRef.nativeElement.classList.add("d-none");
		else
			this.leftBtn._elementRef.nativeElement.classList.remove("d-none");
		if (scroll.scrollLeft >= scroll.scrollWidth - scroll.clientWidth)
			this.rightBtn._elementRef.nativeElement.classList.add("d-none");
		else
			this.rightBtn._elementRef.nativeElement.classList.remove("d-none");
	}
}
