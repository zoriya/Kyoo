import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BrowseComponent } from './browse/browse.component';
import { ShowDetailsComponent } from './show-details/show-details.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { ShowResolverService } from './services/show-resolver.service';
import { LibraryResolverService } from './services/library-resolver.service';
import { PlayerComponent } from "./player/player.component";
import { StreamResolverService } from "./services/stream-resolver.service";
import { CollectionComponent } from "./collection/collection.component";
import { CollectionResolverService } from "./services/collection-resolver.service";


const routes: Routes = [
  { path: "browse", component: BrowseComponent, pathMatch: "full", resolve: { shows: LibraryResolverService } },
  { path: "browse/:library-slug", component: BrowseComponent, resolve: { shows: LibraryResolverService } },
  { path: "show/:show-slug", component: ShowDetailsComponent, resolve: { show: ShowResolverService } },
  { path: "collection/:collection-slug", component: CollectionComponent, resolve: { collection: CollectionResolverService } },
  { path: "watch/:item", component: PlayerComponent, resolve: { item: StreamResolverService } },
  { path: "**", component: NotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes,
  {
    scrollPositionRestoration: "enabled"
  })],
  exports: [RouterModule],
  providers: [LibraryResolverService, ShowResolverService, StreamResolverService]
})
export class AppRoutingModule { }
