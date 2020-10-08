import { CommonModule } from "@angular/common";
import { HTTP_INTERCEPTORS, HttpClient } from "@angular/common/http";
import { APP_INITIALIZER, NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatRippleModule } from "@angular/material/core";
import { MatDialogModule } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatMenuModule } from "@angular/material/menu";
import { MatSelectModule } from "@angular/material/select";
import { MatSliderModule } from "@angular/material/slider";
import { MatTabsModule } from "@angular/material/tabs";
import { MatTooltipModule } from "@angular/material/tooltip";
import { RouterModule } from "@angular/router";
import { AuthModule as OidcModule, LogLevel, OidcConfigService } from "angular-auth-oidc-client";
import { tap } from "rxjs/operators";
import { AccountComponent } from "./account/account.component";
import { LogoutComponent } from "./logout/logout.component";
import { AuthPipe } from "./misc/auth.pipe";
import { AuthGuard } from "./misc/authenticated-guard.service";
import { AuthorizerInterceptor } from "./misc/authorizer-interceptor.service";
import { UnauthorizedComponent } from "./unauthorized/unauthorized.component";

export function loadConfig(oidcConfigService: OidcConfigService)
{
	return () => oidcConfigService.withConfig({
		stsServer: window.location.origin,
		redirectUrl: "/",
		postLogoutRedirectUri: "/logout",
		clientId: "kyoo.webapp",
		responseType: "code",
		triggerAuthorizationResultEvent: false,
		scope: "openid profile offline_access",
		silentRenew: true,
		silentRenewUrl: "/silent.html",
		useRefreshToken: true,
		startCheckSession: true,

		forbiddenRoute: "/forbidden",
		unauthorizedRoute: "/unauthorized",
		logLevel: LogLevel.Warn
	});
}

@NgModule({
	declarations: [
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
		OidcModule.forRoot(),
		RouterModule
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
	constructor(http: HttpClient)
	{
		AuthGuard.permissionsObservable = http.get<string[]>("/api/account/default-permissions")
			.pipe(tap(x => AuthGuard.defaultPermissions = x));
	}
}
