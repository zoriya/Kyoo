import { configure, getLogger, getConsoleSink, withFilter, getLevelFilter, parseLogLevel } from "@logtape/logtape";
import { getOpenTelemetrySink } from "@logtape/otel";
import { redactByField } from "@logtape/redaction";
import { logs as logapi } from '@opentelemetry/api-logs';

const loggerProvider = logapi.getLoggerProvider();

export async function setupLogging() {
  await configure({
    sinks: {
      filteredConsole: (() => {
        const minLevelRaw = (process.env.STDOUT_LOG_LEVEL ?? "info").toLowerCase();
        //handles aliasing like 'warn' to 'warning'
        const aliasMap: Record<string, string> = { warn: "warning" };
        const minLevel = aliasMap[minLevelRaw] ?? minLevelRaw;
        return withFilter(
          redactByField(getConsoleSink(), {
            fieldPatterns: [/password/i, /secret/i],
            action: () => "[REDACTED]"
          }),
          getLevelFilter(parseLogLevel(minLevel))
        );
      })(),
      filteredOtel: (() => {
        const minLevelRaw = (process.env.OTEL_LOG_LEVEL ?? "info").toLowerCase();
        //handles aliasing like 'warn' to 'warning'
        const aliasMap: Record<string, string> = { warn: "warning" };
        const minLevel = aliasMap[minLevelRaw] ?? minLevelRaw;
        return withFilter(
          redactByField(getOpenTelemetrySink({ loggerProvider } ), {
            fieldPatterns: [/password/i, /secret/i, /apikey/i],
            action: () => "[REDACTED]"
          }),
          getLevelFilter(parseLogLevel(minLevel))
        );
      })(),
    },
    loggers: [
      { category: ["logtape", "meta"], sinks: [], lowestLevel: "warning" },
      { category: [], sinks: ["filteredConsole", "filteredOtel"] },
    ],
  });
}
