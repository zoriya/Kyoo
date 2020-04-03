import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowseComponent } from './browse/browse.component';
import { CollectionComponent } from './collection/collection.component';
import { EpisodesListComponent } from './episodes-list/episodes-list.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { PeopleListComponent } from './people-list/people-list.component';
import { PlayerComponent } from './player/player.component';
import { SearchComponent } from './search/search.component';
import { ShowDetailsComponent } from './show-details/show-details.component';
import { ShowsListComponent } from './shows-list/shows-list.component';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import {MatTabsModule} from "@angular/material/tabs";
import {PasswordValidator} from "./misc/password-validator";
import {MatCheckboxModule} from "@angular/material/checkbox";
import {MatDialogModule} from '@angular/material/dialog';
import {FallbackDirective} from "./misc/fallback.directive";
import {AuthModule} from "./auth/auth.module";
import {AuthRoutingModule} from "./auth/auth-routing.module";
import { TrailerDialogComponent } from './trailer-dialog/trailer-dialog.component';


@NgModule({
	declarations: [
		AppComponent,
		NotFoundComponent,
		BrowseComponent,
		ShowDetailsComponent,
		EpisodesListComponent,
		PlayerComponent,
		CollectionComponent,
		SearchComponent,
		PeopleListComponent,
		ShowsListComponent,
		PasswordValidator,
		FallbackDirective,
		TrailerDialogComponent
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
		AuthModule
	],
	bootstrap: [AppComponent]
})
export class AppModule { }
