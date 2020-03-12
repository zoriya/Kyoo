import { HttpClientModule } from '@angular/common/http';
import {APP_INITIALIZER, NgModule} from '@angular/core';
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
import { LoginComponent } from './login/login.component';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import {MatTabsModule} from "@angular/material/tabs";
import {PasswordValidator} from "./misc/password-validator";
import {MatCheckboxModule} from "@angular/material/checkbox";
import {
	AuthModule,
	ConfigResult,
	OidcConfigService,
	OidcSecurityService,
	OpenIdConfiguration
} from "angular-auth-oidc-client";
import { AccountComponent } from './account/account.component';
import {AuthenticatedGuard} from "./guards/authenticated-guard.service";
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';
import { LogoutComponent } from './logout/logout.component';
import {MatDialogModule} from '@angular/material/dialog';

export function loadConfig(oidcConfigService: OidcConfigService)
{
	return () => oidcConfigService.load_using_stsServer(window.location.origin);
}

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
		LoginComponent,
		PasswordValidator,
		AccountComponent,
		UnauthorizedComponent,
		LogoutComponent
	],
	imports: [
		BrowserModule,
		HttpClientModule,
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
		AuthModule.forRoot()
	],
	entryComponents: [
		AccountComponent	
	],
	providers: [
		OidcConfigService,
		{
			provide: APP_INITIALIZER,
			useFactory: loadConfig,
			deps: [OidcConfigService],
			multi: true
		},
		AuthenticatedGuard
	],
	bootstrap: [AppComponent]
})
export class AppModule 
{
	constructor(private oidcSecurityService: OidcSecurityService, private oidcConfigService: OidcConfigService)
	{
		this.oidcConfigService.onConfigurationLoaded.subscribe((configResult: ConfigResult) =>
		{
			const config: OpenIdConfiguration = {
				stsServer: configResult.customConfig.stsServer,
				redirect_url: "/",
				post_logout_redirect_uri: "/logout",
				client_id: 'kyoo.webapp',
				response_type: "code",
				trigger_authorization_result_event: true,
				scope: "openid profile kyoo.read offline_access",
				silent_renew: false,
				silent_renew_url: "/silent",
				use_refresh_token: false,
				start_checksession: true,

				forbidden_route: '/Forbidden',
				unauthorized_route: '/Unauthorized',
				log_console_warning_active: true,
				log_console_debug_active: true
			};
			
			this.oidcSecurityService.setupModule(config, configResult.authWellknownEndpoints);
		});
	}
}
