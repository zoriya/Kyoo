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

  constructor(private route: ActivatedRoute, private sanitizer: DomSanitizer) { }

  ngOnInit()
  {
    this.show = this.route.snapshot.data.show;
    document.body.style.backgroundImage = "url(/backdrop/" + this.show.slug + ")";
  }

  getBackdrop()
  {
    return this.sanitizer.bypassSecurityTrustStyle("url(/backdrop/" + this.show.slug + ")");
  }
}
