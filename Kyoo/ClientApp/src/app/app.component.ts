import { Component, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent
{
  libraries: Library[];

  constructor(http: HttpClient)
  {
    http.get<Library[]>("api/libraries").subscribe(result =>
    {
      this.libraries = result;
    }, error => console.error(error));
  }
}

interface Library
{
  id: number;
  slug: string;
  name: string;
}
