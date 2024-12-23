# Kyoo Helm Chart
Kyoo consists of multiple interconnected workloads, leveraging a variety of technologies including Meilisearch, Postgres, and RabbitMQ.  This helm chart is designed to simplify configurations for basic setups while offering advanced customization options.  Naming and opinionation aims to follow structures described in [diagrams](../DIAGRAMS.md).

## Subchart Support
This chart includes subcharts for deploying Meilisearch, PostgreSQL, and RabbitMQ as a demonstration of how these resources can be configured. However, subcharts are frequently updated, and upgrades between versions are **NOT** supported.

Deploying these resources independently of Kyoo ensures operational independence and long-term maintainability. This approach provides better control over versioning, lifecycle management, and the ability to apply updates or patches without impacting Kyoo's deployment.


# Examples
## Quickstart
Below provides an example for deploying Kyoo and its dependencies.  This is a minimalist setup that is not intended for longterm use.  This approach uses a single Postgres instance and initializes mutliple databases.

```sh
helm upgrade kyoo . --install --values myvalues.yaml
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
      #KYOO
      # The following value should be set to a random sequence of characters.
      # You MUST change it when installing kyoo (for security)
      # You can input multiple api keys separated by a ,
      kyoo_apikeys: yHXWGsjfjE6sy6UxavqmTUYxgCFYek
      # Keep those empty to use kyoo's default api key. You can also specify a custom API key if you want.
      # go to https://www.themoviedb.org/settings/api and copy the api key (not the read access token, the api key)
      tmdb_apikey: ""
      tvdb_apikey: ""
      tvdb_pin: ""
      #RESOURCES
      # meilisearch does not allow mapping their key in yet.
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
      host: kyoo-meilisearch.kyoo
  postgres:
    # postgres instance information to connect to back's database
    kyoo_back:
      host: cluster01.postgres
    # postgres instance information to connect to transcoder's database
    kyoo_transcoder:
      host: cluster01.postgres
  rabbitmq:
    host: cluster01.rabbitmq
kyoo:
  address: https://kyoo.mydomain.com
# leverage NFS for media
media:
  volumes:
    - name: media
      nfs:
        server: mynasserver
        path: /spin0/media
  volumeMounts:
    - name: media
      mountPath: /data
      readOnly: true
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

# Recomendations
## Secret



## Postgres
Kyoo consists of multiple microservices.  Best practice is for each microservice to use its own database.  Kyoo workloads support best practices or sharing a single postgres database.  Please see the `POSTGRES_SCHEMA` setting for additional information.  Strongly recomended to use a Kubernetes operator for managing Postgres.

## Media
Media is condiered an read-only external resource for Kyoo.  Media content tends to consume a large amount of space and Kubernetes storage interfaces tend to replicate across nodes.  Consider hosting the data outside of Kubernetes or assigning one node to handle storage.
