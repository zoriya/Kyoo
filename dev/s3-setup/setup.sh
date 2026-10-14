#!/bin/sh
# Idempotent bootstrap for the local dev Garage (single node, replication 1):
# cluster layout v1, one bucket per service, one shared dev key with access
# to all three buckets. Safe to re-run; every step checks before creating.
# Runs in garage's network namespace, so the default localhost RPC just works.
set -eu

GARAGE="/usr/local/bin/garage -c /etc/garage.toml"
KEY_NAME="kyoo-dev"

until $GARAGE status >/dev/null 2>&1; do
	echo "s3-setup: waiting for garage..."
	sleep 1
done

# Layout #0 is the empty bootstrap layout; skip when a layout newer than
# the empty bootstrap is current.
if ! $GARAGE layout history 2>/dev/null | grep -qE "^#[1-9][0-9]*[[:space:]]+Current"; then
	NODE_ID=$($GARAGE node id)
	echo "s3-setup: assigning layout v1 to $NODE_ID"
	$GARAGE layout assign -z dc1 -c 1G "$NODE_ID"
	$GARAGE layout apply --version 1
fi

for bucket in kyoo-api kyoo-auth kyoo-transcoder; do
	if ! $GARAGE bucket list | grep -q "$bucket"; then
		echo "s3-setup: creating bucket $bucket"
		$GARAGE bucket create "$bucket"
	fi
done

if ! $GARAGE key list | grep -q "$KEY_NAME"; then
	echo "s3-setup: importing key $KEY_NAME"
	# shellcheck disable=SC2086
	$GARAGE key import --yes -n "$KEY_NAME" $S3_ACCESS_KEY_ID $S3_SECRET_ACCESS_KEY
fi

for bucket in kyoo-api kyoo-auth kyoo-transcoder; do
	$GARAGE bucket allow --read --write --owner --key "$KEY_NAME" "$bucket" >/dev/null
done

echo "s3-setup: done (buckets: kyoo-api kyoo-auth kyoo-transcoder, key: $KEY_NAME)"
