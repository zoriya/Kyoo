import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BrowseComponent } from './browse/browse.component';
import { ShowDetailsComponent } from './show-details/show-details.component';
import { NotFoundComponent } from './not-found/not-found.component';


const routes: Routes = [
  { path: "browse", component: BrowseComponent, pathMatch: "full" },
  { path: "browse/:library-slug", component: BrowseComponent },
  { path: "shows/:show-slug", component: ShowDetailsComponent },
  { path: "**", component: NotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
