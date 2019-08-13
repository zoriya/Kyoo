import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-show-details',
  templateUrl: './show-details.component.html',
  styleUrls: ['./show-details.component.scss']
})
export class ShowDetailsComponent implements OnInit
{
  show: Show;

  private watch: any;

  constructor(private http: HttpClient, private route: ActivatedRoute) { }

  ngOnInit()
  {
    this.watch = this.route.params.subscribe(params =>
    {
      var slug: string = params["show-slug"];

      this.http.get<Show>("api/shows/" + slug).subscribe(result =>
      {
        this.show = result;
      }, error => console.log(error));
    });
  }

  ngOnDestroy()
  {
    this.watch.unsubscribe();
  }

}
