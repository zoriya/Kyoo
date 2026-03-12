import logging
import os
import sys
from typing import override

from opentelemetry.sdk._logs import LoggingHandler


class HealthCheckFilter(logging.Filter):
	@override
	def filter(self, record: logging.LogRecord) -> bool:
		return (
			record.args is not None
			and len(record.args) >= 3
			and record.args[2] not in ["/health", "/ready"]  # pyright: ignore[reportArgumentType]
		)


def configure_logging():
	root_logger = logging.getLogger()
	root_logger.setLevel(logging.DEBUG)

	logging.getLogger("watchfiles").setLevel(logging.WARNING)
	logging.getLogger("rebulk").setLevel(logging.WARNING)
	# Only urllib3 consumer is the otel exporter (app uses aiohttp)
	logging.getLogger("urllib3.connectionpool").setLevel(logging.WARNING)
	logging.getLogger("uvicorn.access").addFilter(HealthCheckFilter())

	# Add stdout handler
	stdout_handler = logging.StreamHandler(sys.stdout)
	# set logging level via STDOUT_LOG_LEVEL env var or default to INFO
	stdout_handler.setLevel(
		getattr(logging, os.getenv("STDOUT_LOG_LEVEL", "INFO").upper())
	)
	stdout_handler.setFormatter(
		logging.Formatter(
			fmt="[{levelname}][{name}] {message}",
			style="{",
		)
	)
	root_logger.addHandler(stdout_handler)

	# Add OpenTelemetry handler
	# set logging level via OTEL_LOG_LEVEL env var
	# https://opentelemetry.io/docs/specs/otel/configuration/sdk-environment-variables/#general-sdk-configuration
	root_logger.addHandler(LoggingHandler())
