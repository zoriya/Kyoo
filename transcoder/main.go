package main

import (
	"fmt"
	"net/http"

	"github.com/labstack/echo/v4"
)

// Direct video
//
// Retrieve the raw video stream, in the same container as the one on the server. No transcoding or
// transmuxing is done.
// Path: /:resource/:slug/direct
func DirectStream(c echo.Context) error {
	resource := c.Param("resource")
	slug := c.Param("slug")

	path, err := GetPath(resource, slug)
	if err != nil {
		return err
	}
	return c.File(*path)
}

func ErrorHandler(err error, c echo.Context) {
	code := http.StatusInternalServerError
	if he, ok := err.(*echo.HTTPError); ok {
		code = he.Code
	} else {
		c.Logger().Error(err)
	}
	c.JSON(code, struct {
		Errors []string `json:"errors"`
	}{Errors: []string{fmt.Sprint(err)}})
}

func main() {
	e := echo.New()
	e.HTTPErrorHandler = ErrorHandler

	e.GET("/:resource/:slug/direct", DirectStream)

	e.Logger.Fatal(e.Start(":7666"))
}
