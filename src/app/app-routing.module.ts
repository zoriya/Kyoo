import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BrowseComponent } from './browse/browse.component';
import { CollectionComponent } from "./collection/collection.component";
import { NotFoundComponent } from './not-found/not-found.component';
import { PlayerComponent } from "./player/player.component";
import { SearchComponent } from "./search/search.component";
import { CollectionResolverService } from "./services/collection-resolver.service";
import { LibraryResolverService } from './services/library-resolver.service';
import { PeopleResolverService } from "./services/people-resolver.service";
import { SearchResolverService } from "./services/search-resolver.service";
import { ShowResolverService } from './services/show-resolver.service';
import { StreamResolverService } from "./services/stream-resolver.service";
import { ShowDetailsComponent } from './show-details/show-details.component';
import {LoginComponent} from "./login/login.component";
import {UnauthorizedComponent} from "./unauthorized/unauthorized.component";
import {LogoutComponent} from "./logout/logout.component";

const routes: Routes = [
	{ path: "browse", component: BrowseComponent, pathMatch: "full", resolve: { shows: LibraryResolverService } },
	{ path: "browse/:library-slug", component: BrowseComponent, resolve: { shows: LibraryResolverService } },
	{ path: "show/:show-slug", component: ShowDetailsComponent, resolve: { show: ShowResolverService } },
	{ path: "collection/:collection-slug", component: CollectionComponent, resolve: { collection: CollectionResolverService } },
	{ path: "people/:people-slug", component: CollectionComponent, resolve: { collection: PeopleResolverService } },
	{ path: "watch/:item", component: PlayerComponent, resolve: { item: StreamResolverService } },
	{ path: "search/:query", component: SearchComponent, resolve: { items: SearchResolverService } },
	{ path: "login", component: LoginComponent },
	{ path: "logout", component: LogoutComponent },
	{ path: "unauthorized", component: UnauthorizedComponent },
	{ path: "**", component: NotFoundComponent }
];

@NgModule({
	imports: [RouterModule.forRoot(routes,
		{
			scrollPositionRestoration: "enabled"
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
