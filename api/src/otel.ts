import { record as elysiaRecord } from "@elysiajs/opentelemetry";
import { getLogger } from "@logtape/logtape";
import { metrics as metricapi, trace as traceapi } from "@opentelemetry/api";
import { logs as logapi } from "@opentelemetry/api-logs";
import { SDK_INFO } from "@opentelemetry/core";
import { OTLPLogExporter as OLTPLogExporterGRPC } from "@opentelemetry/exporter-logs-otlp-grpc";
import { OTLPLogExporter as OLTPLogExporterHTTPjson } from "@opentelemetry/exporter-logs-otlp-http";
import { OTLPLogExporter as OLTPLogExporterHTTPprotobuf } from "@opentelemetry/exporter-logs-otlp-proto";
import { OTLPMetricExporter as OLTPMetricsExporterGRPC } from "@opentelemetry/exporter-metrics-otlp-grpc";
// does not currently have a shared 'base'.  Need to use from http package
import type { OTLPMetricExporterBase } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPMetricExporter as OLTPMetricsExporterHTTPjson } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPMetricExporter as OLTPMetricsExporterHTTPprotobuf } from "@opentelemetry/exporter-metrics-otlp-proto";
import { OTLPTraceExporter as OLTPTraceExporterGRPC } from "@opentelemetry/exporter-trace-otlp-grpc";
import { OTLPTraceExporter as OLTPTraceExporterHTTPjson } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPTraceExporter as OLTPTraceExporterHTTPprotobuf } from "@opentelemetry/exporter-trace-otlp-proto";
import { resourceFromAttributes } from "@opentelemetry/resources";
import type { LogRecordExporter } from "@opentelemetry/sdk-logs";
import {
	BatchLogRecordProcessor,
	LoggerProvider,
} from "@opentelemetry/sdk-logs";
import {
	MeterProvider,
	PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";
import { SpanProcessor } from '@opentelemetry/sdk-trace-base';
import type { SpanExporter } from "@opentelemetry/sdk-trace-base";
import {
	BatchSpanProcessor,
	NodeTracerProvider,
} from "@opentelemetry/sdk-trace-node";
import {
	ATTR_SERVICE_NAME,
	ATTR_TELEMETRY_SDK_LANGUAGE,
	ATTR_TELEMETRY_SDK_NAME,
	ATTR_TELEMETRY_SDK_VERSION,
} from "@opentelemetry/semantic-conventions";

const resource = resourceFromAttributes({
	[ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || "kyoo.api",
	[ATTR_TELEMETRY_SDK_LANGUAGE]: SDK_INFO[ATTR_TELEMETRY_SDK_LANGUAGE],
	[ATTR_TELEMETRY_SDK_NAME]: SDK_INFO[ATTR_TELEMETRY_SDK_NAME],
	[ATTR_TELEMETRY_SDK_VERSION]: SDK_INFO[ATTR_TELEMETRY_SDK_VERSION],
});


const logger = getLogger();

class DropSelectOneProcessor implements SpanProcessor {
  constructor(private next: SpanProcessor) {}

  onStart() {}

  onEnd(span) {
		const stmt =
			span.attributes['db.statement'];

    if (
      typeof stmt === 'string' &&
      stmt.trim().toLowerCase() === 'select 1'
    ) {
      return; // drop span
    }

    this.next.onEnd(span);
  }

  shutdown() {
    return this.next.shutdown();
  }

  forceFlush() {
    return this.next.forceFlush();
  }
}

export function setupOtel() {
	logger.info("Configuring OTEL");
	const protocol = (
		process.env.OTEL_EXPORTER_OTLP_PROTOCOL || ""
	).toLowerCase();

	let le: LogRecordExporter | null;
	let me: OTLPMetricExporterBase | null;
	let te: SpanExporter | null;

	switch (true) {
		case !process.env.OTEL_EXPORTER_OTLP_ENDPOINT:
			logger.info("Using OLTP type: {type}", {
				type: "noop",
			});
			le = null;
			me = null;
			te = null;
			break;
		case protocol === "grpc":
			logger.info("Using OLTP type: {type}", {
				type: "grpc",
			});
			le = new OLTPLogExporterGRPC();
			me = new OLTPMetricsExporterGRPC();
			te = new OLTPTraceExporterGRPC();
			break;
		case protocol === "http/json":
		case protocol === "http_json":
		case protocol === "httpjson":
			logger.info("Using OLTP type: {type}", {
				type: "http/json",
			});
			le = new OLTPLogExporterHTTPjson();
			me = new OLTPMetricsExporterHTTPjson();
			te = new OLTPTraceExporterHTTPjson();
			break;
		default:
			logger.info("Using OLTP type: {type}", {
				type: "http/protobuf",
			});
			le = new OLTPLogExporterHTTPprotobuf();
			me = new OLTPMetricsExporterHTTPprotobuf();
			te = new OLTPTraceExporterHTTPprotobuf();
			break;
	}

	let lp = new LoggerProvider({ resource });
	let mp = new MeterProvider({ resource });
	let tp = new NodeTracerProvider({ resource });

	if (le) {
		lp = new LoggerProvider({
			resource,
			processors: [new BatchLogRecordProcessor(le)],
		});
	}

	if (me) {
		mp = new MeterProvider({
			resource,
			readers: [
				new PeriodicExportingMetricReader({
					exporter: me,
					exportIntervalMillis: 5000,
				}),
			],
		});
	}

	if (te) {
		tp = new NodeTracerProvider({
			resource,
			spanProcessors: [
				new DropSelectOneProcessor(
					new BatchSpanProcessor(te, {
						maxQueueSize: 100,
						maxExportBatchSize: 10,
						scheduledDelayMillis: 500,
						exportTimeoutMillis: 30000,
					}),
				)
			],
		});
	}

	logapi.setGlobalLoggerProvider(lp);
	metricapi.setGlobalMeterProvider(mp);
	traceapi.setGlobalTracerProvider(tp);
}

export function record<T extends (...args: any) => any>(
	spanName: string,
	fn: T,
): T {
	const wrapped = (...args: Parameters<T>) =>
		elysiaRecord(spanName, () => fn(...args));
	return wrapped as T;
}
