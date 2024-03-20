import json
import os
import pika
from pika import spec
from pika.adapters.blocking_connection import BlockingChannel
import pika.credentials
from autosync.services.aggregate import Aggregate

from autosync.services.simkl import Simkl

service = Aggregate([Simkl()])


def on_message(
	ch: BlockingChannel,
	method: spec.Basic.Deliver,
	properties: spec.BasicProperties,
	body: bytes,
):
	status = json.loads(body)
	service.update(status.user, status.resource, status)


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
	channel.start_consuming()
