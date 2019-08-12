import { Component, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent
{
  libraries: Library[];

  constructor(http: HttpClient, @Inject('BASE_URL') baseUrl: string)
  {
    http.get<Library[]>(baseUrl + 'api/libraries').subscribe(result =>
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
