import logging
import os
import sys

from opentelemetry.sdk._logs import LoggingHandler


def configure_logging():
	root_logger = logging.getLogger()
	root_logger.setLevel(logging.DEBUG)

	logging.getLogger("watchfiles").setLevel(logging.WARNING)
	logging.getLogger("rebulk").setLevel(logging.WARNING)

	# Add stdout handler
	stdout_handler = logging.StreamHandler(sys.stdout)
	# set logging level via STDOUT_LOG_LEVEL env var or default to INFO
	stdout_handler.setLevel(
		getattr(logging, os.getenv("STDOUT_LOG_LEVEL", "INFO").upper())
	)
	stdout_handler.setFormatter(
		logging.Formatter(
			fmt="[STDOUT][{levelname}][{name}] {message}",
			style="{",
		)
	)
	root_logger.addHandler(stdout_handler)

	# Add OpenTelemetry handler
	# set logging level via OTEL_LOG_LEVEL env var
	# https://opentelemetry.io/docs/specs/otel/configuration/sdk-environment-variables/#general-sdk-configuration
	root_logger.addHandler(LoggingHandler())
