import { Component, OnInit, Input, SimpleChange } from '@angular/core';
import { Episode } from "../../models/episode";
import { DomSanitizer } from "@angular/platform-browser";

@Component({
  selector: 'app-episodes-list',
  templateUrl: './episodes-list.component.html',
  styleUrls: ['./episodes-list.component.scss']
})
export class EpisodesListComponent implements OnInit
{
  @Input() episodes: Episode[];
  private root: HTMLElement;

  constructor(private sanitizer: DomSanitizer) { }

  ngOnInit()
  {
    this.root = document.getElementById("episodes");
  }

  sanitize(url: string)
  {
    return this.sanitizer.bypassSecurityTrustStyle("url(" + url + ")");
  }

  scrollLeft()
  {
    let scroll: number = this.roundScroll(this.root.offsetWidth * 0.80);
    this.root.scrollBy({ top: 0, left: -scroll, behavior: "smooth" });

    document.getElementById("rightBtn").classList.remove("d-none");

    if (this.root.scrollLeft - scroll <= 0)
      document.getElementById("leftBtn").classList.add("d-none");
  }

  scrollRight()
  {
    let scroll: number = this.roundScroll(this.root.offsetWidth * 0.80);
    this.root.scrollBy({ top: 0, left: scroll, behavior: "smooth" });
    document.getElementById("leftBtn").classList.remove("d-none");

    if (this.root.scrollLeft + scroll >= this.root.scrollWidth - this.root.clientWidth)
      document.getElementById("rightBtn").classList.add("d-none");
  }

  roundScroll(offset: number): number
  {
    let episodeSize: number = document.getElementById("1").scrollWidth;
    offset = Math.round(offset / episodeSize) * episodeSize;

    if (offset == 0)
      offset = episodeSize;

    return offset;
  }
}
