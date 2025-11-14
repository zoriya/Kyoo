import { opentelemetry } from "@elysiajs/opentelemetry";
import { OTLPMetricExporter as GrpcMetricExporter } from "@opentelemetry/exporter-metrics-otlp-grpc";
import { OTLPMetricExporter as HttpMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import { OTLPTraceExporter as GrpcTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import { OTLPTraceExporter as HttpTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";
import Elysia from "elysia";

const protocol =
	process.env.OTEL_EXPORTER_OTLP_TRACES_PROTOCOL ??
	process.env.OTEL_EXPORTER_OTLP_PROTOCOL ??
	"http/protobuf";

export const otel = new Elysia()
	.use(
		opentelemetry({
			serviceName: "kyoo.api",
			spanProcessors: [
				new BatchSpanProcessor(
					protocol === "grpc"
						? new GrpcTraceExporter()
						: new HttpTraceExporter(),
				),
			],
			metricReader: new PeriodicExportingMetricReader({
				exporter:
					protocol === "grpc"
						? new GrpcMetricExporter()
						: new HttpMetricExporter(),
			}),
		}),
	)
	.as("global");
