package api

import (
	// Important: simply import the pprof package to register its with a default HTTP mux, if one is defined.
	// This is done in the init function of the pprof package, and is unavoidable.
	// This package should not use the default HTTP mux to prevent accidentially enabling these endpoints.
	"net/http"
	"net/http/pprof"
	"os"
	runtimepprof "runtime/pprof"
	"strconv"

	"github.com/labstack/echo/v4"
)

// This is similar to https://github.com/sevennt/echo-pprof/blob/master/pprof.go.
// Unfortunately, this library is not maintained anymore and doesn't support echo v4.
// It also hard-codes codes all pprof handlers, which sometimes change when new profiles are added.

func RegisterPProfHandlers(e *echo.Echo) {
	enablePProf := false
	if enablePProfVar, ok := os.LookupEnv("ENABLE_PPROF_ENDPOINT"); ok {
		enablePProf, _ = strconv.ParseBool(enablePProfVar)
	}

	if !enablePProf {
		return
	}

	prefix := "/debug/pprof" // Standard prefix for pprof
	g := e.Group(prefix)

	routers := map[string]http.HandlerFunc{
		"":         pprof.Index,
		"/":        pprof.Index,
		"/cmdline": pprof.Cmdline,
		"/profile": pprof.Profile,
		"/symbol":  pprof.Symbol,
		"/trace":   pprof.Trace,
	}

	// Handle all profiles supported by the Go runtime
	// These are not hard-coded so that this function does not need to be updated
	// when new profiles are added in the future.
	for _, profile := range runtimepprof.Profiles() {
		profileName := profile.Name()
		path := "/" + profileName
		routers[path] = pprof.Handler(profileName).ServeHTTP
	}

	for path, handler := range routers {
		handler := func(ctx echo.Context) error {
			handler(ctx.Response().Writer, ctx.Request())
			return nil
		}

		// The pprof handlers will accept/reject specific methods if needed.
		g.Any(path, handler)
	}
}
