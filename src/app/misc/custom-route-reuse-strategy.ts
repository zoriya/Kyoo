import { ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy } from "@angular/router";

export class CustomRouteReuseStrategy extends RouteReuseStrategy
{
	shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean
	{
		if (curr.routeConfig?.path === "browse"
			|| curr.routeConfig?.path === "genre/:slug"
			|| curr.routeConfig?.path === "studio/:slug")
		{
			return future.routeConfig.path === "browse"
				|| future.routeConfig.path === "genre/:slug"
				|| future.routeConfig.path === "studio/:slug";
		}
		return future.routeConfig === curr.routeConfig;
	}

	shouldAttach(): boolean
	{
		return false;
	}

	shouldDetach(): boolean
	{
		return false;
	}

	store(): void  {}

	retrieve(): DetachedRouteHandle | null
	{
		return null;
	}
}
