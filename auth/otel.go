package main

import (
	"context"
	"errors"
	"log/slog"
	"os"
	"strings"

	echootel "github.com/labstack/echo-opentelemetry"
	"github.com/labstack/echo/v5"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlplog/otlploggrpc"
	"go.opentelemetry.io/otel/exporters/otlp/otlplog/otlploghttp"
	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetricgrpc"
	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetrichttp"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	logotel "go.opentelemetry.io/otel/log"
	logotelglobal "go.opentelemetry.io/otel/log/global"
	logotelnoop "go.opentelemetry.io/otel/log/noop"
	metricotel "go.opentelemetry.io/otel/metric"
	metricotelnoop "go.opentelemetry.io/otel/metric/noop"
	"go.opentelemetry.io/otel/propagation"
	logsdk "go.opentelemetry.io/otel/sdk/log"
	metricsdk "go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/resource"
	tracesdk "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.26.0"
	traceotel "go.opentelemetry.io/otel/trace"
	traceotelnoop "go.opentelemetry.io/otel/trace/noop"
)

func setupOtel(ctx context.Context) (func(context.Context) error, error) {
	res, err := resource.New(
		ctx,
		resource.WithAttributes(semconv.ServiceNameKey.String("kyoo.auth")),
		resource.WithFromEnv(),
		resource.WithTelemetrySDK(),
		resource.WithProcess(),
		resource.WithOS(),
		resource.WithContainer(),
		resource.WithHost(),
	)
	if err != nil {
		return nil, err
	}

	slog.Info("Configuring OTEL")

	otel.SetTextMapPropagator(
		propagation.NewCompositeTextMapPropagator(
			propagation.TraceContext{},
			propagation.Baggage{},
		),
	)

	var le logsdk.Exporter
	var me metricsdk.Exporter
	var te tracesdk.SpanExporter
	switch {
	case strings.TrimSpace(os.Getenv("OTEL_EXPORTER_OTLP_ENDPOINT")) == "":
		slog.Info("Using OLTP type", "type", "noop")
		le = nil
		me = nil
		te = nil
	case strings.ToLower(strings.TrimSpace(os.Getenv("OTEL_EXPORTER_OTLP_PROTOCOL"))) == "grpc":
		slog.Info("Using OLTP type", "type", "grpc")
		le, err = otlploggrpc.New(ctx)
		if err != nil {
			slog.Error("Failed setting up OLTP", "err", err)
			return nil, err
		}
		me, err = otlpmetricgrpc.New(ctx)
		if err != nil {
			slog.Error("Failed setting up OLTP", "err", err)
			return nil, err
		}
		te, err = otlptracegrpc.New(ctx)
		if err != nil {
			slog.Error("Failed setting up OLTP", "err", err)
			return nil, err
		}
	default:
		slog.Info("Using OLTP type", "type", "http")
		le, err = otlploghttp.New(ctx)
		if err != nil {
			slog.Error("Failed setting up OLTP", "err", err)
			return nil, err
		}
		me, err = otlpmetrichttp.New(ctx)
		if err != nil {
			slog.Error("Failed setting up OLTP", "err", err)
			return nil, err
		}
		te, err = otlptracehttp.New(ctx)
		if err != nil {
			slog.Error("Failed setting up OLTP", "err", err)
			return nil, err
		}
	}
	if err != nil {
		return nil, err
	}

	// default to noop providers
	var lp logotel.LoggerProvider = logotelnoop.NewLoggerProvider()
	var mp metricotel.MeterProvider = metricotelnoop.NewMeterProvider()
	var tp traceotel.TracerProvider = traceotelnoop.NewTracerProvider()

	// use exporter if configured
	if le != nil {
		lp = logsdk.NewLoggerProvider(
			logsdk.WithProcessor(logsdk.NewBatchProcessor(le)),
			logsdk.WithResource(res),
		)
	}

	if me != nil {
		mp = metricsdk.NewMeterProvider(
			metricsdk.WithReader(
				metricsdk.NewPeriodicReader(me),
			),
			metricsdk.WithResource(res),
		)
	}

	if te != nil {
		tp = tracesdk.NewTracerProvider(
			tracesdk.WithBatcher(te),
			tracesdk.WithResource(res),
		)
	}

	// set providers
	logotelglobal.SetLoggerProvider(lp)
	otel.SetMeterProvider(mp)
	otel.SetTracerProvider(tp)

	// configure shutting down
	// noop providers do not have a Shudown method
	log_shutdown := func(ctx context.Context) error {
		if otelprovider, ok := lp.(*logsdk.LoggerProvider); ok && otelprovider != nil {
			return otelprovider.Shutdown(ctx)
		}
		return nil
	}

	metric_shutdown := func(ctx context.Context) error {
		if otelprovider, ok := mp.(*metricsdk.MeterProvider); ok && otelprovider != nil {
			return otelprovider.Shutdown(ctx)
		}
		return nil
	}

	trace_shutdown := func(ctx context.Context) error {
		if otelprovider, ok := tp.(*tracesdk.TracerProvider); ok && otelprovider != nil {
			return otelprovider.Shutdown(ctx)
		}
		return nil
	}

	return func(ctx context.Context) error {
		slog.Info("Shutting down OTEL")

		// run shutdowns and collect errors
		var errs []error
		if err := trace_shutdown(ctx); err != nil {
			errs = append(errs, err)
		}
		if err := metric_shutdown(ctx); err != nil {
			errs = append(errs, err)
		}
		if err := log_shutdown(ctx); err != nil {
			errs = append(errs, err)
		}

		if len(errs) == 0 {
			return nil
		}
		return errors.Join(errs...)
	}, nil
}

func instrument(e *echo.Echo) {
	e.Use(echootel.NewMiddlewareWithConfig(echootel.Config{
		ServerName: "kyoo.auth",
		Skipper: func(c *echo.Context) bool {
			return (c.Path() == "/auth/health" ||
				c.Path() == "/auth/ready" ||
				strings.HasPrefix(c.Path(), "/.well-known/"))
		},
	}))
}

// stolen from https://github.com/exaring/otelpgx/issues/47
func dbGetSpanName(sql string) string {
	if len(sql) >= 10 && sql[0:9] == "-- name: " {
		// -- name: {name} :{type}
		if index := strings.Index(sql[9:], ":"); index != -1 {
			// remove leading space before :
			// optimised assuming this comment has been generated by SQLC
			return sql[9 : 9+(index-1)]
		}
		// -- name: {name}
		if index := strings.Index(sql[9:], "\n"); index != -1 {
			if sql[len(sql[9:9+index])-1] != ' ' {
				return sql[9 : 9+index]
			}
			return strings.TrimSpace(sql[9 : 9+index])
		}
	}

	if len(sql) >= 9 && sql[0:8] == "-- name:" {
		// -- name:{name}
		if index := strings.Index(sql[8:], "\n"); index != -1 {
			if sql[len(sql[8:8+index])-1] != ' ' {
				return sql[8 : 8+index]
			}
			return strings.TrimSpace(sql[8 : 8+index])
		}
	}

	if len(sql) >= 8 && sql[0:7] == "--name:" {
		// -- name:{name}
		if index := strings.Index(sql[7:], "\n"); index != -1 {
			if sql[len(sql[7:7+index])-1] != ' ' {
				return sql[7 : 7+index]
			}
			return strings.TrimSpace(sql[7 : 7+index])
		}
	}

	return sql
}
