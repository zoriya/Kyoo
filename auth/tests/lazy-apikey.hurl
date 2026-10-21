# unknown lazy key
DELETE {{host}}/keys/unknown/lazy
HTTP 404

# only claimable from the local network, not through a proxy
DELETE {{host}}/keys/lazy/lazy
X-Forwarded-For: 1.2.3.4
HTTP 403

# can't create a key with the same name as a lazy one
POST {{host}}/keys
X-API-KEY: 1234apikey
{
	"name": "lazy",
	"claims": {}
}
HTTP 409

# nor rename one to it
POST {{host}}/keys
X-API-KEY: 1234apikey
{
	"name": "notlazy",
	"claims": {}
}
HTTP 201
[Captures]
other: jsonpath "$.id"

PATCH {{host}}/keys/{{other}}
X-API-KEY: 1234apikey
{
	"name": "lazy"
}
HTTP 409

DELETE {{host}}/keys/{{other}}
X-API-KEY: 1234apikey
HTTP 200

# this is defined from the gh workflow file's env var
DELETE {{host}}/keys/lazy/lazy
HTTP 200
[Captures]
id: jsonpath "$.id"
token: jsonpath "$.token"
[Asserts]
jsonpath "$.name" == "lazy"
jsonpath "$.claims.permissions" contains "apikeys.read"

# already claimed
DELETE {{host}}/keys/lazy/lazy
HTTP 409

GET {{host}}/jwt
X-API-KEY: {{token}}
HTTP 200
[Captures]
jwt: jsonpath "$.token"

GET {{host}}/keys
Authorization: Bearer {{jwt}}
HTTP 200
[Asserts]
jsonpath "$.items[?(@.name == 'lazy')].id" contains {{id}}

# deleting a claimed key allows it to be claimed again
DELETE {{host}}/keys/{{id}}
X-API-KEY: 1234apikey
HTTP 200

DELETE {{host}}/keys/lazy/lazy
HTTP 200
[Captures]
id: jsonpath "$.id"

DELETE {{host}}/keys/{{id}}
X-API-KEY: 1234apikey
HTTP 200
