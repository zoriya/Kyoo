import os
import pika
from pika import spec
from pika.adapters.blocking_connection import BlockingChannel
import pika.credentials


def callback(
	ch: BlockingChannel,
	method: spec.Basic.Deliver,
	properties: spec.BasicProperties,
	body: bytes,
):
	print(f" [x] {method.routing_key}:{body}")


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

	channel.basic_consume(queue=queue_name, on_message_callback=callback, auto_ack=True)
	channel.start_consuming()
