import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ItemsGridComponent} from './components/items-grid/items-grid.component';
import {NotFoundComponent} from './pages/not-found/not-found.component';
import {PageResolver} from './services/resolvers/page-resolver.service';
import {ShowDetailsComponent} from './pages/show-details/show-details.component';
import {AuthGuard} from "./auth/misc/authenticated-guard.service";
import {LibraryItem} from "../models/library-item";
import {
	EpisodeService,
	LibraryItemService,
	LibraryService,
	PeopleService,
	SeasonService,
	ShowService
} from "./services/api.service";
import {Show} from "../models/show";
import {ItemResolver} from "./services/resolvers/item-resolver.service";
import {CollectionComponent} from "./pages/collection/collection.component";
import {Collection} from "../models/collection";
import {SearchComponent} from "./pages/search/search.component";
import {SearchResult} from "../models/search-result";

const routes: Routes = [
	{path: "browse", component: ItemsGridComponent, pathMatch: "full",
		resolve: { items: PageResolver.forResource<LibraryItem>("items") },
		canLoad: [AuthGuard.forPermissions("read")],
		canActivate: [AuthGuard.forPermissions("read")]
	},
	{path: "browse/:slug", component: ItemsGridComponent,
		resolve: { items: PageResolver.forResource<LibraryItem>("library/:slug/items") },
		canLoad: [AuthGuard.forPermissions("read")],
		canActivate: [AuthGuard.forPermissions("read")]
	},

	{path: "show/:slug", component: ShowDetailsComponent,
		resolve: { show: ItemResolver.forResource<Show>("shows/:slug") },
		canLoad: [AuthGuard.forPermissions("read")],
		canActivate: [AuthGuard.forPermissions("read")]
	},
	{path: "collection/:slug", component: CollectionComponent,
		resolve:
		{
			collection: ItemResolver.forResource<Collection>("collections/:slug"),
			shows: PageResolver.forResource<Show>("collections/:slug/shows")
		},
		canLoad: [AuthGuard.forPermissions("read")],
		canActivate: [AuthGuard.forPermissions("read")]
	},
	{path: "people/:slug", component: CollectionComponent,
		resolve:
		{
			collection: ItemResolver.forResource<Collection>("people/:slug"),
			shows: PageResolver.forResource<Show>("people/:slug/roles")
		},
		canLoad: [AuthGuard.forPermissions("read")],
		canActivate: [AuthGuard.forPermissions("read")]
	},

	{path: "search/:query", component: SearchComponent,
		resolve: { items: ItemResolver.forResource<SearchResult>("search/:query") },
		canLoad: [AuthGuard.forPermissions("read")],
		canActivate: [AuthGuard.forPermissions("read")]
	},

	// {path: "watch/:item", component: PlayerComponent, resolve: { item: StreamResolverService }, canLoad: [AuthGuard.forPermissions("play")], canActivate: [AuthGuard.forPermissions("play")]},
	// TODO implement missing pages: /genre, /studio & an home page.
	{path: "**", component: NotFoundComponent}
];

@NgModule({
	imports: [RouterModule.forRoot(routes,
		{
			scrollPositionRestoration: "enabled",
		})],
	exports: [RouterModule],
	providers: [
		LibraryService,
		LibraryItemService,
		PeopleService,
		ShowService,
		SeasonService,
		EpisodeService,
		PageResolver.resolvers,
		ItemResolver.resolvers,
	]
})
export class AppRoutingModule { }
