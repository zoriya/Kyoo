# Local dev only: bootstraps the single-node Garage cluster used by
# docker-compose.dev.s3.yml (layout, buckets, dev key).
# The upstream image has no shell, so wrap the garage binary with alpine's.
FROM alpine:3.21
COPY --from=dxflrs/garage:v2.4.1 /garage /usr/local/bin/garage
COPY setup.sh /setup.sh
ENTRYPOINT ["/bin/sh", "/setup.sh"]
