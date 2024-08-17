# helm chart

# Recomendations
This helm chart includes subcharts for Meilisearch, Postgres, and RabbitMQ.  Those resources should be managed outside of this Helm release.

# Example Deployment
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
      name: back-storage
    spec:
      accessModes:
        - "ReadWriteOnce"
      resources:
        requests:
          storage: "3Gi"
  - kind: PersistentVolumeClaim
    apiVersion: v1
    metadata:
      name: media
    spec:
      accessModes:
        - "ReadWriteOnce"
      resources:
        requests:
          storage: "3Gi"
  - kind: PersistentVolumeClaim
    apiVersion: v1
    metadata:
      name: transcoder-storage
    spec:
      accessModes:
        - "ReadWriteOnce"
      resources:
        requests:
          storage: "3Gi"
```