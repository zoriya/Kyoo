import {NgModule} from '@angular/core';
import {RouterModule, Routes} from "@angular/router";
import {UnauthorizedComponent} from "./unauthorized/unauthorized.component";
import {LoginComponent} from "./login/login.component";
import {LogoutComponent} from "./logout/logout.component";
import {AutologinComponent} from "./autologin/autologin.component";

const routes: Routes = [
	{path: "login", component: LoginComponent},
	{path: "logout", component: LogoutComponent},
	{path: "autologin", component: AutologinComponent},
	{path: "unauthorized", component: UnauthorizedComponent},
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule]
})
export class AuthRoutingModule { }
