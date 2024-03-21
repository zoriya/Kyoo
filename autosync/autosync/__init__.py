import logging
import os

import dataclasses_json
from datetime import datetime
from marshmallow import fields

dataclasses_json.cfg.global_config.encoders[datetime] = datetime.isoformat
dataclasses_json.cfg.global_config.decoders[datetime] = datetime.fromisoformat
dataclasses_json.cfg.global_config.mm_fields[datetime] = fields.DateTime(format="iso")
dataclasses_json.cfg.global_config.encoders[datetime | None] = datetime.isoformat
dataclasses_json.cfg.global_config.decoders[datetime | None] = datetime.fromisoformat
dataclasses_json.cfg.global_config.mm_fields[datetime | None] = fields.DateTime(
	format="iso"
)

import pika
from pika import spec
from pika.adapters.blocking_connection import BlockingChannel
import pika.credentials
from autosync.models.message import Message
from autosync.services.aggregate import Aggregate

from autosync.services.simkl import Simkl


logging.basicConfig(level=logging.INFO)
service = Aggregate([Simkl()])


def on_message(
	ch: BlockingChannel,
	method: spec.Basic.Deliver,
	properties: spec.BasicProperties,
	body: bytes,
):
	try:
		message = Message.from_json(body)  # type: Message
		service.update(message.value.user, message.value.resource, message.value)
	except Exception as e:
		logging.exception("Error processing message.", exc_info=e)
		logging.exception("Body: %s", body)


def main():
	connection = pika.BlockingConnection(
		pika.ConnectionParameters(
			host=os.environ.get("RABBITMQ_HOST", "rabbitmq"),
			credentials=pika.credentials.PlainCredentials(
				os.environ.get("RABBITMQ_DEFAULT_USER", "guest"),
				os.environ.get("RABBITMQ_DEFAULT_PASS", "guest"),
			),
		)
	)
	channel = connection.channel()

	channel.exchange_declare(exchange="events.watched", exchange_type="topic")
	result = channel.queue_declare("", exclusive=True)
	queue_name = result.method.queue
	channel.queue_bind(exchange="events.watched", queue=queue_name, routing_key="#")

	channel.basic_consume(
		queue=queue_name, on_message_callback=on_message, auto_ack=True
	)
	logging.info("Listening for autosync.")
	channel.start_consuming()
