import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-show-details',
  templateUrl: './show-details.component.html',
  styleUrls: ['./show-details.component.scss']
})
export class ShowDetailsComponent implements OnInit
{
  show: Show;

  constructor(private route: ActivatedRoute) { }

  ngOnInit()
  {
    this.show = this.route.snapshot.data.show;
  }
}
