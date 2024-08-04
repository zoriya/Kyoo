module github.com/zoriya/kyoo/transcoder

go 1.22

require (
	github.com/golang-migrate/migrate/v4 v4.17.1
	github.com/jmoiron/sqlx v1.4.0
	github.com/labstack/echo/v4 v4.12.0
	github.com/lib/pq v1.10.9
	gopkg.in/vansante/go-ffprobe.v2 v2.2.0
)

require (
	github.com/disintegration/imaging v1.6.2
	github.com/golang-jwt/jwt v3.2.2+incompatible // indirect
	github.com/hashicorp/errwrap v1.1.0 // indirect
	github.com/hashicorp/go-multierror v1.1.1 // indirect
	github.com/labstack/gommon v0.4.2 // indirect
	github.com/mattn/go-colorable v0.1.13 // indirect
	github.com/mattn/go-isatty v0.0.20 // indirect
	github.com/valyala/bytebufferpool v1.0.0 // indirect
	github.com/valyala/fasttemplate v1.2.2 // indirect
	gitlab.com/opennota/screengen v1.0.2
	go.uber.org/atomic v1.7.0 // indirect
	golang.org/x/crypto v0.22.0 // indirect
	golang.org/x/image v0.10.0 // indirect
	golang.org/x/net v0.24.0 // indirect
	golang.org/x/sys v0.19.0 // indirect
	golang.org/x/text v0.14.0
	golang.org/x/time v0.5.0 // indirect
)

replace github.com/jmoiron/sqlx v1.4.0 => github.com/kmpm/sqlx v1.3.5-0.20220614102404-845a9a7f1301
