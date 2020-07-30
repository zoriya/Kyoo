import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {LibraryItemGridComponent} from './components/library-item-grid/library-item-grid.component';
import {CollectionComponent} from "./collection/collection.component";
import {NotFoundComponent} from './not-found/not-found.component';
import {PlayerComponent} from "./pages/player/player.component";
import {SearchComponent} from "./pages/search/search.component";
import {CollectionResolverService} from "./services/resolvers/collection-resolver.service";
import {LibraryResolverService} from './services/resolvers/library-resolver.service';
import {PeopleResolverService} from "./services/resolvers/people-resolver.service";
import {SearchResolverService} from "./services/resolvers/search-resolver.service";
import {ShowResolverService} from './services/resolvers/show-resolver.service';
import {StreamResolverService} from "./services/resolvers/stream-resolver.service";
import {ShowDetailsComponent} from './pages/show-details/show-details.component';
import {AuthGuard} from "./auth/misc/authenticated-guard.service";

const routes: Routes = [
	{path: "browse", component: LibraryItemGridComponent, pathMatch: "full", resolve: { shows: LibraryResolverService }, canLoad: [AuthGuard.forPermissions("read")], canActivate: [AuthGuard.forPermissions("read")]},
	{path: "browse/:library-slug", component: LibraryItemGridComponent, resolve: { shows: LibraryResolverService }, canLoad: [AuthGuard.forPermissions("read")], canActivate: [AuthGuard.forPermissions("read")]},
	{path: "show/:show-slug", component: ShowDetailsComponent, resolve: { show: ShowResolverService }, canLoad: [AuthGuard.forPermissions("read")], canActivate: [AuthGuard.forPermissions("read")]},
	{path: "collection/:collection-slug", component: CollectionComponent, resolve: { collection: CollectionResolverService }, canLoad: [AuthGuard.forPermissions("read")], canActivate: [AuthGuard.forPermissions("read")]},
	{path: "people/:people-slug", component: CollectionComponent, resolve: { collection: PeopleResolverService }, canLoad: [AuthGuard.forPermissions("read")], canActivate: [AuthGuard.forPermissions("read")]},
	{path: "watch/:item", component: PlayerComponent, resolve: { item: StreamResolverService }, canLoad: [AuthGuard.forPermissions("play")], canActivate: [AuthGuard.forPermissions("play")]},
	{path: "search/:query", component: SearchComponent, resolve: { items: SearchResolverService }, canLoad: [AuthGuard.forPermissions("read")], canActivate: [AuthGuard.forPermissions("read")]},
	{path: "**", component: NotFoundComponent}
];

@NgModule({
	imports: [RouterModule.forRoot(routes,
		{
			scrollPositionRestoration: "enabled",
		})],
	exports: [RouterModule],
	providers: [
		LibraryResolverService,
		ShowResolverService,
		CollectionResolverService,
		PeopleResolverService,
		StreamResolverService,
		SearchResolverService
	]
})
export class AppRoutingModule { }
