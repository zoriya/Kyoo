import {ElementRef, ViewChild} from "@angular/core";
import {MatButton} from "@angular/material/button";

export class HorizontalScroller
{
	@ViewChild("scrollView", { static: true }) private scrollView: ElementRef;
	@ViewChild("leftBtn", { static: false }) private leftBtn: MatButton;
	@ViewChild("rightBtn", { static: false }) private rightBtn: MatButton;
	@ViewChild("itemsDom", { static: false }) private itemsDom: ElementRef;

	scrollLeft()
	{
		let scroll: number = this.roundScroll(this.scrollView.nativeElement.offsetWidth * 0.80);
		this.scrollView.nativeElement.scrollBy({ top: 0, left: -scroll, behavior: "smooth" });
	}

	scrollRight()
	{
		let scroll: number = this.roundScroll(this.scrollView.nativeElement.offsetWidth * 0.80);
		this.scrollView.nativeElement.scrollBy({ top: 0, left: scroll, behavior: "smooth" });
	}

	roundScroll(offset: number): number
	{
		let itemSize: number = this.itemsDom.nativeElement.scrollWidth;

		offset = Math.round(offset / itemSize) * itemSize;
		if (offset == 0)
			offset = itemSize;
		return offset;
	}

	onScroll()
	{
		if (this.scrollView.nativeElement.scrollLeft <= 0)
			this.leftBtn._elementRef.nativeElement.classList.add("d-none");
		else
			this.leftBtn._elementRef.nativeElement.classList.remove("d-none");
		if (this.scrollView.nativeElement.scrollLeft >= this.scrollView.nativeElement.scrollWidth - this.scrollView.nativeElement.clientWidth)
			this.rightBtn._elementRef.nativeElement.classList.add("d-none");
		else
			this.rightBtn._elementRef.nativeElement.classList.remove("d-none");
	}
}