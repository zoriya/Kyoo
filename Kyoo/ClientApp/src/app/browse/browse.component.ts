import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-browse',
  templateUrl: './browse.component.html',
  styleUrls: ['./browse.component.scss']
})
export class BrowseComponent implements OnInit
{
  shows: Show[];

  private watch: any;

  constructor(private http: HttpClient, private route: ActivatedRoute) { }

  ngOnInit()
  {
    this.watch = this.route.params.subscribe(params =>
    {
      var slug: string = params["library-slug"];

      if (slug == null)
      {
        this.http.get<Show[]>("api/shows").subscribe(result =>
        {
          this.shows = result;
        }, error => console.log(error));
      }
      else
      {
        this.http.get<Show[]>("api/library/" + slug).subscribe(result =>
        {
          this.shows = result;
        }, error => console.log(error));
      }
    });
  }

  ngOnDestroy()
  {
    this.watch.unsubscribe();
  }
}
