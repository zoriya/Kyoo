package main

import (
	"context"
	"errors"
	"log/slog"
	"os"
	"strings"

	"github.com/labstack/echo/v4"
	"go.opentelemetry.io/contrib/instrumentation/github.com/labstack/echo/otelecho"
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
		resource.WithAttributes(semconv.ServiceNameKey.String("kyoo.transcoder")),
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
	e.Use(otelecho.Middleware("kyoo.transcoder", otelecho.WithSkipper(func(c echo.Context) bool {
		return c.Path() == "/video/health" || c.Path() == "/video/ready"
	})))
}
