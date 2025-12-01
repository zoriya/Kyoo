import logging
from fastapi import FastAPI

logger = logging.getLogger(__name__)


def setup_otelproviders() -> tuple[object, object, object]:
	import os

	if not (os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "").strip()):
		logger.info(
			"OTEL_EXPORTER_OTLP_ENDPOINT not specified, skipping otel provider setup."
		)
		return None, None, None

	# choose exporters (grpc vs http) ...
	if os.getenv("OTEL_EXPORTER_OTLP_PROTOCOL", "").lower().strip() == "grpc":
		try:
			from opentelemetry.exporter.otlp.proto.grpc._log_exporter import (
				OTLPLogExporter,
			)
			from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import (
				OTLPMetricExporter,
			)
			from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import (
				OTLPSpanExporter,
			)
		except Exception as exc:
			raise RuntimeError(
				"gRPC OTLP exporter imports failed. Install the necessary packages / system libs."
			) from exc
		else:
			logger.info("Using gRPC libs for OpenTelemetry exporter.")
	else:
		try:
			from opentelemetry.exporter.otlp.proto.http._log_exporter import (
				OTLPLogExporter,
			)
			from opentelemetry.exporter.otlp.proto.http.metric_exporter import (
				OTLPMetricExporter,
			)
			from opentelemetry.exporter.otlp.proto.http.trace_exporter import (
				OTLPSpanExporter,
			)
		except Exception as exc:
			raise RuntimeError(
				"HTTP OTLP exporter imports failed. Install the necessary packages / system libs."
			) from exc
		else:
			logger.info("Using HTTP libs for OpenTelemetry exporter.")

	from opentelemetry import trace, metrics, _logs
	from opentelemetry.sdk.trace import TracerProvider
	from opentelemetry.sdk.trace.export import BatchSpanProcessor
	from opentelemetry.sdk.metrics import MeterProvider
	from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
	from opentelemetry.sdk._logs import LoggerProvider
	from opentelemetry.sdk._logs.export import BatchLogRecordProcessor
	from opentelemetry.sdk.resources import Resource

	resource = Resource.create(
		{"service.name": os.getenv("OTEL_SERVICE_NAME", "testpythonapp")}
	)

	# Traces
	tracer_provider = TracerProvider(resource=resource)
	tracer_provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter()))
	trace.set_tracer_provider(tracer_provider)

	# Metrics
	meter_provider = MeterProvider(
		resource=resource,
		metric_readers=[PeriodicExportingMetricReader(OTLPMetricExporter())],
	)
	metrics.set_meter_provider(meter_provider)

	# Logs — install logger provider + processor/exporter
	logger_provider = LoggerProvider(resource=resource)
	logger_provider.add_log_record_processor(BatchLogRecordProcessor(OTLPLogExporter()))
	_logs.set_logger_provider(logger_provider)

	return tracer_provider, meter_provider, logger_provider


def instrument(app: FastAPI):
	from opentelemetry.instrumentation.aiohttp_client import AioHttpClientInstrumentor
	from opentelemetry.instrumentation.asyncpg import AsyncPGInstrumentor
	from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

	FastAPIInstrumentor.instrument_app(
		app,
		http_capture_headers_server_request=[".*"],
		http_capture_headers_server_response=[".*"],
		excluded_urls="/health$,/ready$",
	)
	AioHttpClientInstrumentor().instrument()
	AsyncPGInstrumentor().instrument()
