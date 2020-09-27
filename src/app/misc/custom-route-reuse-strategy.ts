import { ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy } from "@angular/router";

export class CustomRouteReuseStrategy extends RouteReuseStrategy
{
	shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean
	{
		if (curr.routeConfig?.path == "browse"
			|| curr.routeConfig?.path == "genre/:slug"
			|| curr.routeConfig?.path == "studio/:slug")
		{
			console.log(`${curr.routeConfig?.path} - ${future.routeConfig?.path}`)
			return future.routeConfig.path == "browse"
				|| future.routeConfig.path == "genre/:slug"
				|| future.routeConfig.path == "studio/:slug";
		}
		return future.routeConfig === curr.routeConfig;
	}

	shouldAttach(route: ActivatedRouteSnapshot): boolean
	{
		return false;
	}

	shouldDetach(route: ActivatedRouteSnapshot): boolean
	{
		return false;
	}

	store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void  {}

	retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null
	{
		return null;
	}
}
