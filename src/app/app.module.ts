import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatRippleModule} from '@angular/material/core';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatSelectModule} from '@angular/material/select';
import {MatSliderModule} from '@angular/material/slider';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {ItemsGridComponent} from './components/items-grid/items-grid.component';
import {CollectionComponent} from './pages/collection/collection.component';
import {EpisodesListComponent} from './components/episodes-list/episodes-list.component';
import {NotFoundComponent} from './pages/not-found/not-found.component';
import {PeopleListComponent} from './components/people-list/people-list.component';
import {PlayerComponent} from './pages/player/player.component';
import {SearchComponent} from './pages/search/search.component';
import {ShowDetailsComponent} from './pages/show-details/show-details.component';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatInputModule} from "@angular/material/input";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatTabsModule} from "@angular/material/tabs";
import {PasswordValidator} from "./misc/password-validator";
import {MatCheckboxModule} from "@angular/material/checkbox";
import {MatDialogModule} from '@angular/material/dialog';
import {FallbackDirective} from "./misc/fallback.directive";
import {AuthModule} from "./auth/auth.module";
import {AuthRoutingModule} from "./auth/auth-routing.module";
import {TrailerDialogComponent} from './pages/trailer-dialog/trailer-dialog.component';
import {ItemsListComponent} from "./components/items-list/items-list.component";
import {MetadataEditComponent} from './pages/metadata-edit/metadata-edit.component';
import {MatChipsModule} from "@angular/material/chips";
import {MatAutocompleteModule} from "@angular/material/autocomplete";
import {MatExpansionModule} from "@angular/material/expansion";
import {InfiniteScrollModule} from "ngx-infinite-scroll";


@NgModule({
	declarations: [
		AppComponent,
		NotFoundComponent,
		ItemsGridComponent,
		ShowDetailsComponent,
		EpisodesListComponent,
		PlayerComponent,
		CollectionComponent,
		SearchComponent,
		PeopleListComponent,
		PasswordValidator,
		FallbackDirective,
		TrailerDialogComponent,
		ItemsListComponent,
		MetadataEditComponent,
	],
	imports: [
		BrowserModule,
		HttpClientModule,
		AuthRoutingModule,
		AppRoutingModule,
		BrowserAnimationsModule,
		MatSnackBarModule,
		MatProgressBarModule,
		MatButtonModule,
		MatIconModule,
		MatSelectModule,
		MatMenuModule,
		MatSliderModule,
		MatTooltipModule,
		MatRippleModule,
		MatCardModule,
		ReactiveFormsModule,
		MatInputModule,
		MatFormFieldModule,
		MatDialogModule,
		FormsModule,
		MatTabsModule,
		MatCheckboxModule,
		AuthModule,
		MatChipsModule,
		MatAutocompleteModule,
		MatExpansionModule,
		InfiniteScrollModule
	],
	bootstrap: [AppComponent]
})
export class AppModule { }
