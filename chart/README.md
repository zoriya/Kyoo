# Kyoo Helm Chart
Kyoo consists of multiple interconnected workloads, leveraging a variety of technologies including Postgres.  This helm chart is designed to simplify configurations for basic setups while offering advanced customization options.  Naming and opinionation aims to follow structures described in [diagrams](../DIAGRAMS.md).

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
postgres:
  enabled: true
extraObjects:
  - apiVersion: v1
    kind: Secret
    metadata:
      name: bigsecret
    type: Opaque
    stringData:
      postgres_user: kyoo_all
      postgres_password: watchSomething4me
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
# specify external hosts for resources
global:
  postgres:
    kyoo_api:
      host: postgres
    kyoo_auth:
      host: postgres
    kyoo_transcoder:
      host: postgres
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
  tmdb_apikey: ""
  tvdb_apikey: ""
  tvdb_pin: ""
  postgres_user: kyoo_all
  postgres_password: watchSomething4me
```

# Additional Notes
## Postgres
Kyoo consists of multiple microservices.  Best practice is for each microservice to use its own database.  Kyoo workloads support best practices or sharing a single postgres database.  Please see the `POSTGRES_SCHEMA` setting for additional information.  Strongly recomended to use a Kubernetes operator for managing Postgres.

## Subchart Support
Subcharts are updated frequently and subject to changes.  This chart includes subcharts for deploying PostgreSQL.  Please consider hosting those independently of Kyoo to better handle versioning and lifecycle management.

# v5 Middleware Requirement
Starting with v5, Kyoo leverages middleware for offloading auth from the microservices onto a gateway.  For additional reading, please see gateway-api sigs [documentation](https://gateway-api.sigs.k8s.io/geps/gep-1494/). 

This Helm chart provides a few choices as most ingress/gatewayapi controllers do not currently support PhantomToken auth.  

## Add TraefikProxy (Default)
By default, this chart will deploy TraefikProxy behind the existing ingress/gateway resources.  TraefikProxy hop is added and configured to handle ForwardAuth.  This approach offers the most compatibility and requires the least amount of change from the user perspective.

## Direct to TraefikProxy
Instead of using an additional hop, Traefik can be exposed via LoadBalancer.  To do this securely, please be sure to mount and configuring the TLS certificate inside of Traefik.

## Ingress/GatewayApi (WIP)
Disable the integrated TraefikProxy and adopt a controller that supports PhantomToken auth.  This option will offer the most Kubernetes native experience.

This is a work in progress.  One of the challenges is that microserice to microservice communication relies upon this middleware as well.  Pointing microservices to Ingress/Gateway service address is not enough since those leverage Layer7 hosts for routing traffic--unless we create a dedicated one that routes all hosts to Kyoo.