import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {LibraryItemGridComponent} from './components/library-item-grid/library-item-grid.component';
import {NotFoundComponent} from './not-found/not-found.component';
import {PageResolver} from './services/resolvers/page-resolver.service';
import {ShowDetailsComponent} from './pages/show-details/show-details.component';
import {AuthGuard} from "./auth/misc/authenticated-guard.service";
import {LibraryItem} from "../models/library-item";
import {LibraryItemService, LibraryService} from "./services/api.service";
import {Show} from "../models/show";
import {ItemResolver} from "./services/resolvers/item-resolver.service";

const routes: Routes = [
	{path: "browse", component: LibraryItemGridComponent, pathMatch: "full",
		resolve: { items: PageResolver.forResource<LibraryItem>("items") },
		canLoad: [AuthGuard.forPermissions("read")],
		canActivate: [AuthGuard.forPermissions("read")]
	},
	{path: "browse/:slug", component: LibraryItemGridComponent,
		resolve: { items: PageResolver.forResource<LibraryItem>("library/:slug/items") },
		canLoad: [AuthGuard.forPermissions("read")],
		canActivate: [AuthGuard.forPermissions("read")]
	},

	{path: "show/:slug", component: ShowDetailsComponent,
		resolve: { show: ItemResolver.forResource<Show>("shows/:slug") },
		canLoad: [AuthGuard.forPermissions("read")],
		canActivate: [AuthGuard.forPermissions("read")]
	},
	// {path: "collection/:collection-slug", component: CollectionComponent, resolve: { collection: CollectionResolverService }, canLoad: [AuthGuard.forPermissions("read")], canActivate: [AuthGuard.forPermissions("read")]},
	//
	// {path: "people/:people-slug", component: CollectionComponent, resolve: { collection: PeopleResolverService }, canLoad: [AuthGuard.forPermissions("read")], canActivate: [AuthGuard.forPermissions("read")]},
	// {path: "watch/:item", component: PlayerComponent, resolve: { item: StreamResolverService }, canLoad: [AuthGuard.forPermissions("play")], canActivate: [AuthGuard.forPermissions("play")]},
	// {path: "search/:query", component: SearchComponent, resolve: { items: SearchResolverService }, canLoad: [AuthGuard.forPermissions("read")], canActivate: [AuthGuard.forPermissions("read")]},
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
		PageResolver.resolvers,
		ItemResolver.resolvers,
	]
})
export class AppRoutingModule { }
