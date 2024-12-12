# helm chart

# Recomendations

This helm chart includes subcharts for Meilisearch, Postgres, and RabbitMQ.  Those resources should be managed outside of this Helm release.

## Postgres

Kyoo consists of multiple microservices.  Best practice is for each microservice to use its own database.  Kyoo workloads support best practices or sharing a single postgres database.  Please see the `POSTGRES_SCHEMA` setting for additional information.

Strongly recomended to use a Kubernetes operator for managing Postgres.

## Storage

Kyoo currently uses storage volumes for media, backend-storage, and transcoder-storage.  Media content tends to consume a large amount of space and Kubernetes storage interfaces tend to replicate across nodes. Consider hosting the data outside of Kubernetes (e.g by using a networked file system like NFS) or assigning one node to handle storage.

Storage for backend and transcoder will eventually be moved into a datastore application.

# Quickstart

Below provides an example for deploying Kyoo and its dependencies.  This is a minimalist setup that is not intended for longterm use.  This approach uses a single Postgres instance and initializes multiple databases.

Clone Kyoo and navigate to the `chart` directory.
```bash
git clone https://github.com/zoriya/kyoo.git
cd kyoo/chart
```

Install the helm chart :

```bash
helm upgrade kyoo . --install -n kyoo --create-namespace
```

For production use, it is highly recommended to use a values file to configure unique secrets and settings.

```yaml
kyoo:
  secrets:
    stringData:
      MEILI_MASTER_KEY: barkLike8SuperDucks
      postgres_user: kyoo_all
      postgres_password: watchSomething4me
      rabbitmq_user: kyoo_all
      rabbitmq_password: youAreAmazing2
      rabbitmq_cookie: mmmGoodCookie
```

Consult the `values.yaml` file for additional configuration options.