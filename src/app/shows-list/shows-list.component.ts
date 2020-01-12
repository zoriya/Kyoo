import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { MatButton } from "@angular/material/button";
import { DomSanitizer } from "@angular/platform-browser";
import { Show } from "../../models/show";

@Component({
	selector: 'app-shows-list',
	templateUrl: './shows-list.component.html',
	styleUrls: ['./shows-list.component.scss']
})
export class ShowsListComponent
{
	@Input() shows: Show[];
	@ViewChild("scrollView", { static: true }) private scrollView: ElementRef;
	@ViewChild("leftBtn", { static: false }) private leftBtn: MatButton;
	@ViewChild("rightBtn", { static: false }) private rightBtn: MatButton;

	constructor(private sanitizer: DomSanitizer) { }

	scrollLeft()
	{
		let scroll: number = this.scrollView.nativeElement.offsetWidth * 0.80;
		this.scrollView.nativeElement.scrollBy({ top: 0, left: -scroll, behavior: "smooth" });
	}

	scrollRight()
	{
		let scroll: number = this.scrollView.nativeElement.offsetWidth * 0.80;
		this.scrollView.nativeElement.scrollBy({ top: 0, left: scroll, behavior: "smooth" });
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

	getThumb(slug: string)
	{
		return this.sanitizer.bypassSecurityTrustStyle("url(/poster/" + slug + ")");
	}
}
