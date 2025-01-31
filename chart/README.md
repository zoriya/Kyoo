# Kyoo Helm Chart
Kyoo consists of multiple interconnected workloads, leveraging a variety of technologies including Meilisearch, Postgres, and RabbitMQ.  This helm chart is designed to simplify configurations for basic setups while offering advanced customization options.  Naming and opinionation aims to follow structures described in [diagrams](../DIAGRAMS.md).

# Examples
## Quickstart
Below provides an example for deploying Kyoo and its dependencies using subcharts.  This uses a single Postgres instance and initializes mutliple databases.

```sh
helm upgrade kyoo oci://ghcr.io/zoriya/helm-charts/kyoo --install --values myvalues.yaml
```
`myvaules.yaml` content
```yaml
kyoo:
  address: https://kyoo.mydomain.com
meilisearch:
  enabled: true
postgresql:
  enabled: true
rabbitmq:
  enabled: true
extraObjects:
  - apiVersion: v1
    kind: Secret
    metadata:
      name: bigsecret
    type: Opaque
    stringData:
      kyoo_apikeys: yHXWGsjfjE6sy6UxavqmTUYxgCFYek
      MEILI_MASTER_KEY: barkLike8SuperDucks
      postgres_user: kyoo_all
      postgres_password: watchSomething4me
      rabbitmq_user: kyoo_all
      rabbitmq_password: youAreAmazing2
      rabbitmq_cookie: mmmGoodCookie
  - kind: PersistentVolumeClaim
    apiVersion: v1
    metadata:
      name: media
    spec:
      accessModes:
        - "ReadOnlyMany"
      resources:
        requests:
          storage: "3Gi"
```

## Common Setup

values.yaml configuration
```yaml
# specify external hosts for backend resources
global:
  meilisearch:
    kyoo_back:
      host: meilisearch
  postgres:
    kyoo_back:
      host: postgres
    kyoo_transcoder:
      host: postgres
  rabbitmq:
    host: rabbitmq
# specify hardware resources
transcoder:
  kyoo_transcoder:
    resources:
      limits:
        nvidia.com/gpu: 1
kyoo:
  address: https://kyoo.mydomain.com
  # specify hardware acceleration profile (valid values: disabled, vaapi, qsv, nvidia)
  transcoderAcceleration: nvidia
media:
  volumes:
    - name: media
      nfs:
        server: mynasserver
        path: /spin0/media
ingress:
  enabled: true
  host: kyoo.mydomain.com
  tls: true
```
by default the chart expects to consume a Kubernetes secret named `bigsecret`.  That secret should look similar to:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: bigsecret
type: Opaque
stringData:
  kyoo_apikeys: yHXWGsjfjE6sy6UxavqmTUYxgCFYek
  tmdb_apikey: ""
  tvdb_apikey: ""
  tvdb_pin: ""
  MEILI_MASTER_KEY: barkLike8SuperDucks
  postgres_user: kyoo_all
  postgres_password: watchSomething4me
  rabbitmq_user: kyoo_all
  rabbitmq_password: youAreAmazing2
```

# Additional Notes
## Postgres
Kyoo consists of multiple microservices.  Best practice is for each microservice to use its own database.  Kyoo workloads support best practices or sharing a single postgres database.  Please see the `POSTGRES_SCHEMA` setting for additional information.  Strongly recomended to use a Kubernetes operator for managing Postgres.

## Subchart Support
Subcharts are updated frequently and subject to changes.  This chart includes subcharts for deploying Meilisearch, PostgreSQL, and RabbitMQ.  Please consider hosting those independently of Kyoo to better handle versioning and lifecycle management.