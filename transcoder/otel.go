package main

import (
	"context"
	"os"

	"github.com/labstack/echo/v4"
	"go.opentelemetry.io/contrib/instrumentation/github.com/labstack/echo/otelecho"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlplog/otlploggrpc"
	"go.opentelemetry.io/otel/exporters/otlp/otlplog/otlploghttp"
	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetricgrpc"
	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetrichttp"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/log/global"
	"go.opentelemetry.io/otel/sdk/log"
	"go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/resource"
	"go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.26.0"
)

func setupOtel(e *echo.Echo) (func(), error) {
	ctx := context.Background()
	proto := os.Getenv("OTEL_EXPORTER_OTLP_PROTOCOL")
	if proto == "" {
		proto = "http/protobuf"
	}

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

	var le log.Exporter
	if proto == "http/protobuf" {
		le, err = otlploghttp.New(ctx)
	} else {
		le, err = otlploggrpc.New(ctx)
	}
	if err != nil {
		return nil, err
	}
	lp := log.NewLoggerProvider(
		log.WithProcessor(log.NewBatchProcessor(le)),
		log.WithResource(res),
	)
	global.SetLoggerProvider(lp)

	var me metric.Exporter
	if proto == "http/protobuf" {
		me, err = otlpmetrichttp.New(ctx)
	} else {
		me, err = otlpmetricgrpc.New(ctx)
	}
	if err != nil {
		return func() {}, err
	}
	mp := metric.NewMeterProvider(
		metric.WithReader(
			metric.NewPeriodicReader(me),
		),
		metric.WithResource(res),
	)
	otel.SetMeterProvider(mp)

	var te *otlptrace.Exporter
	if proto == "http/protobuf" {
		te, err = otlptracehttp.New(ctx)
	} else {
		te, err = otlptracegrpc.New(ctx)
	}
	if err != nil {
		return func() {}, err
	}
	tp := trace.NewTracerProvider(
		trace.WithBatcher(te),
		trace.WithResource(res),
	)
	otel.SetTracerProvider(tp)

	e.Use(otelecho.Middleware("kyoo.transcoder", otelecho.WithSkipper(func(c echo.Context) bool {
		return c.Path() == "/video/health" || c.Path() == "/video/ready"
	})))

	return func() {
		lp.Shutdown(ctx)
		mp.Shutdown(ctx)
		tp.Shutdown(ctx)
	}, nil
}
