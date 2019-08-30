import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-show-details',
  templateUrl: './show-details.component.html',
  styleUrls: ['./show-details.component.scss']
})
export class ShowDetailsComponent implements OnInit
{
  show: Show;

  private toolbar: HTMLElement
  private backdrop: HTMLElement

  constructor(private route: ActivatedRoute, private sanitizer: DomSanitizer) { }

  ngOnInit()
  {
    this.show = this.route.snapshot.data.show;
    //document.body.style.backgroundImage = "url(/backdrop/" + this.show.slug + ")";


    this.toolbar = document.getElementById("toolbar");
    this.backdrop = document.getElementById("backdrop");
    window.addEventListener("scroll", this.scroll, true);
    this.toolbar.setAttribute("style", `background-color: rgba(0, 0, 0, 0) !important`);
  }

  ngOnDestroy()
  {
    window.removeEventListener("scroll", this.scroll, true);
  }

  scroll = (event) =>
  {
    let opacity: number = 2 * window.scrollY / this.backdrop.clientHeight;
    this.toolbar.setAttribute("style", `background-color: rgba(0, 0, 0, ${opacity}) !important`);
  }



  getPeopleIcon(slug: string)
  {
    return this.sanitizer.bypassSecurityTrustStyle("url(/peopleimg/" + slug + ")");
  }

  getBackdrop()
  {
    return this.sanitizer.bypassSecurityTrustStyle("url(/backdrop/" + this.show.slug + ")");
  }
}
