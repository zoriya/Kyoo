# Kyoo Helm Chart
Kyoo consists of multiple interconnected workloads, leveraging a variety of technologies including Postgres, and RabbitMQ.  This helm chart is designed to simplify configurations for basic setups while offering advanced customization options.  Naming and opinionation aims to follow structures described in [diagrams](../DIAGRAMS.md).

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
Subcharts are updated frequently and subject to changes.  This chart includes subcharts for deploying PostgreSQL, and RabbitMQ.  Please consider hosting those independently of Kyoo to better handle versioning and lifecycle management.

# v5 ForwardAuth Requirement
Starting with v5, Kyoo leverages ForwardAuth middleware for offloading auth from the microservices onto a gateway.  For additional reading, please see gateway-api sigs [documentation](https://gateway-api.sigs.k8s.io/geps/gep-1494/). 

This Helm chart provides a few choices as most ingress/gatewayapi controllers do not currently support ForwardAuth.  

## Add TraefikProxy (Default)
By default, this chart will deploy TraefikProxy behind the existing ingress/gateway resources.  TraefikProxy hop is added and configured to handle ForwardAuth.  This approach offers the most compatibility and requires the least amount of change from the user perspective.

## Direct to TraefikProxy
Instead of using an additional hop, Traefik can be exposed via LoadBalancer.  To do this securely, please be sure to mount and configuring the TLS certificate inside of Traefik.

## Ingress/GatewayApi with ForwardAuth
Disable the integrated TraefikProxy and adopt a controller that supports ForwardAuth.  This option will offer the most Kubernetes native experience.