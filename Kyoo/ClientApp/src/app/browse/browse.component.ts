import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-browse',
  templateUrl: './browse.component.html',
  styleUrls: ['./browse.component.scss']
})
export class BrowseComponent implements OnInit
{
  shows: Show[];

  constructor(private route: ActivatedRoute, private sanitizer: DomSanitizer) { }

  ngOnInit()
  {
    this.shows = this.route.snapshot.data.shows;
  }

  getThumb(slug: string)
  {
    return this.sanitizer.bypassSecurityTrustStyle("url(/thumb/" + slug + ")");
  }
}
