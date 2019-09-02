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

    document.getElementById("leftBtn").onclick = function ()
    {
      console.log(this.root);
    }
  }

  sanitize(url: string)
  {
    return this.sanitizer.bypassSecurityTrustStyle("url(" + url + ")");
  }

  /*document.getElementById("left-scroll").onclick = function()
    {
        slider.scrollBy({ top: 0, left: -slider.offsetWidth * 0.66, behavior: "smooth" });
        document.getElementById("right-scroll").style.display = "inline-block";

        if (slider.scrollLeft - slider.offsetWidth * 0.66 <= 0)
            document.getElementById("left-scroll").style.display = "none";
    }

    document.getElementById("right-scroll").onclick = function()
    {
        slider.scrollBy({ top: 0, left: slider.offsetWidth * 0.66, behavior: "smooth" });
        document.getElementById("left-scroll").style.display = "inline-block";

        if (slider.scrollLeft + slider.offsetWidth * 0.66 + 10 >= slider.scrollWidth - slider.clientWidth)
            document.getElementById("right-scroll").style.display = "none";
    }*/
}
