import logging
import os

from fastapi import FastAPI
from opentelemetry import metrics, trace
from opentelemetry._logs import set_logger_provider
from opentelemetry.exporter.otlp.proto.grpc._log_exporter import (
	OTLPLogExporter as GrpcLogExporter,
)
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import (
	OTLPMetricExporter as GrpcMetricExporter,
)
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import (
	OTLPSpanExporter as GrpcSpanExporter,
)
from opentelemetry.exporter.otlp.proto.http._log_exporter import (
	OTLPLogExporter as HttpLogExporter,
)
from opentelemetry.exporter.otlp.proto.http.metric_exporter import (
	OTLPMetricExporter as HttpMetricExporter,
)
from opentelemetry.exporter.otlp.proto.http.trace_exporter import (
	OTLPSpanExporter as HttpSpanExporter,
)
from opentelemetry.instrumentation.aiohttp_client import AioHttpClientInstrumentor
from opentelemetry.instrumentation.asyncpg import AsyncPGInstrumentor
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.sdk._logs import LoggerProvider, LoggingHandler
from opentelemetry.sdk._logs.export import BatchLogRecordProcessor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.sdk.resources import SERVICE_NAME, Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor


def instrument(app: FastAPI):
	proto = os.getenv("OTEL_EXPORTER_OTLP_PROTOCOL", "http/protobuf")
	resource = Resource.create(attributes={SERVICE_NAME: "kyoo.scanner"})

	provider = LoggerProvider(resource=resource)
	provider.add_log_record_processor(
		BatchLogRecordProcessor(
			HttpLogExporter() if proto == "http/protobuf" else GrpcLogExporter()
		)
	)
	set_logger_provider(provider)
	handler = LoggingHandler(level=logging.DEBUG, logger_provider=provider)
	logging.basicConfig(handlers=[handler], level=logging.DEBUG)
	logging.getLogger("watchfiles").setLevel(logging.WARNING)
	logging.getLogger("rebulk").setLevel(logging.WARNING)

	provider = TracerProvider(resource=resource)
	provider.add_span_processor(
		BatchSpanProcessor(
			HttpSpanExporter() if proto == "http/protobuf" else GrpcSpanExporter()
		)
	)
	trace.set_tracer_provider(provider)

	provider = MeterProvider(
		metric_readers=[
			PeriodicExportingMetricReader(
				HttpMetricExporter() if proto == "http/protobuf" else GrpcMetricExporter()
			)
		],
		resource=resource,
	)
	metrics.set_meter_provider(provider)

	FastAPIInstrumentor.instrument_app(
		app,
		http_capture_headers_server_request=[".*"],
		http_capture_headers_server_response=[".*"],
		excluded_urls="/health$,/ready$",
	)
	AioHttpClientInstrumentor().instrument()
	AsyncPGInstrumentor().instrument()
