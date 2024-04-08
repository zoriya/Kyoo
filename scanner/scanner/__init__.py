async def main():
	import logging
	import sys
	from providers.provider import Provider
	from providers.kyoo_client import KyooClient
	from .scanner import Scanner
	from .subscriber import Subscriber

	logging.basicConfig(level=logging.INFO)
	if len(sys.argv) > 1 and sys.argv[1] == "-v":
		logging.basicConfig(level=logging.DEBUG)
	logging.getLogger("watchfiles").setLevel(logging.WARNING)
	logging.getLogger("rebulk").setLevel(logging.WARNING)

	async with KyooClient() as kyoo, Subscriber() as sub:
		provider, xem = Provider.get_all(kyoo.client)
		scanner = Scanner(kyoo, provider, xem)
		await sub.listen(scanner)
