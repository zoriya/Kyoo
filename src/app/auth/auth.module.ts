import {APP_INITIALIZER, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AccountComponent} from "./account/account.component";
import {AuthPipe} from "./misc/auth.pipe";
import {AutologinComponent} from "./autologin/autologin.component";
import {UnauthorizedComponent} from "./unauthorized/unauthorized.component";
import {LogoutComponent} from "./logout/logout.component";
import {ConfigResult, OidcConfigService, OidcSecurityService, OpenIdConfiguration, AuthModule as OidcModule} from "angular-auth-oidc-client";
import {HTTP_INTERCEPTORS, HttpClient, HttpClientModule} from "@angular/common/http";
import {AuthGuard} from "./misc/authenticated-guard.service";
import {AuthorizerInterceptor} from "./misc/authorizer-interceptor.service";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatIconModule} from "@angular/material/icon";
import {MatInputModule} from "@angular/material/input";
import {MatDialogModule} from "@angular/material/dialog";
import {MatButtonModule} from "@angular/material/button";
import {MatSelectModule} from "@angular/material/select";
import {MatMenuModule} from "@angular/material/menu";
import {MatSliderModule} from "@angular/material/slider";
import {MatTooltipModule} from "@angular/material/tooltip";
import {MatRippleModule} from "@angular/material/core";
import {MatCardModule} from "@angular/material/card";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatTabsModule} from "@angular/material/tabs";
import {MatCheckboxModule} from "@angular/material/checkbox";

export function loadConfig(oidcConfigService: OidcConfigService)
{
	return () => oidcConfigService.load_using_stsServer(window.location.origin);
}

@NgModule({
	declarations: [
		AutologinComponent,
		AuthPipe,
		AccountComponent,
		UnauthorizedComponent,
		LogoutComponent
	],
	imports: [
		CommonModule,
		MatButtonModule,
		MatIconModule,
		MatSelectModule,
		MatMenuModule,
		MatSliderModule,
		MatTooltipModule,
		MatRippleModule,
		MatCardModule,
		MatInputModule,
		MatFormFieldModule,
		MatDialogModule,
		FormsModule,
		MatTabsModule,
		MatCheckboxModule,
		OidcModule.forRoot()
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
		AuthGuard.guards,
		{
			provide: HTTP_INTERCEPTORS,
			useClass: AuthorizerInterceptor,
			multi: true
		}
	]
})
export class AuthModule 
{
	constructor(private oidcSecurityService: OidcSecurityService, private oidcConfigService: OidcConfigService, http: HttpClient)
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
				scope: "openid profile",
				silent_renew: true,
				silent_renew_url: "/silent",
				use_refresh_token: false,
				start_checksession: true,

				forbidden_route: '/Forbidden',
				unauthorized_route: '/Unauthorized',
				log_console_warning_active: true,
				log_console_debug_active: false
			};

			this.oidcSecurityService.setupModule(config, configResult.authWellknownEndpoints);
		});

		http.get("/api/account/default-permissions").subscribe((result: string[]) => AuthGuard.defaultPermissions = result);
	}
}
