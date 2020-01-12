import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { MatButton } from "@angular/material/button";
import { DomSanitizer } from "@angular/platform-browser";
import { Episode } from "../../models/episode";

@Component({
  selector: 'app-episodes-list',
  templateUrl: './episodes-list.component.html',
  styleUrls: ['./episodes-list.component.scss']
})
export class EpisodesListComponent
{
	@Input() displayShowTitle: boolean = false;
  @Input() episodes: Episode[];
	@ViewChild("scrollView", { static: true }) private scrollView: ElementRef;
	@ViewChild("leftBtn", { static: false }) private leftBtn: MatButton;
	@ViewChild("rightBtn", { static: false }) private rightBtn: MatButton;
	@ViewChild("episodeDom", { static: false }) private episode: ElementRef;

	constructor(private sanitizer: DomSanitizer) { }

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
		let episodeSize: number = this.episode.nativeElement.scrollWidth;

		offset = Math.round(offset / episodeSize) * episodeSize;
		if (offset == 0)
			offset = episodeSize;
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

  sanitize(url: string)
  {
    return this.sanitizer.bypassSecurityTrustStyle("url(" + url + ")");
  }
}
