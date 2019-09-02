import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss']
})
export class PlayerComponent implements OnInit {

  constructor() { }

  ngOnInit()
  {
    document.getElementById("nav").classList.add("d-none");
  }

  ngOnDestroy()
  {
    document.getElementById("nav").classList.remove("d-none");
  }
}
