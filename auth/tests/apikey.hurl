# perm check
POST {{host}}/keys
{
	"name": "dryflower",
	"claims": {
		"isAdmin": true,
		"permissions": ["core.read"]
	}
}
HTTP 401

POST {{host}}/keys
# this is created from the gh workflow file's env var
X-API-KEY: 1234apikey
{
	"name": "dryflower",
	"claims": {
		"isAdmin": true,
		"permissions": ["apikeys.read"]
	}
}
HTTP 201
[Captures]
id: jsonpath "$.id"
token: jsonpath "$.token"

GET {{host}}/jwt
X-API-KEY: {{token}}
HTTP 200
[Captures]
jwt: jsonpath "$.token"

# apikey passed as a query param (used to load videos/images in third-party
# browsers where headers/cookies can't be set)
GET {{host}}/jwt?apikey={{token}}
HTTP 200
[Asserts]
jsonpath "$.token" exists

# apikey forwarded by traefik's forward-auth in the X-Forwarded-Uri header
GET {{host}}/jwt
X-Forwarded-Uri: /api/videos/x/master.m3u8?apikey={{token}}
HTTP 200
[Asserts]
jsonpath "$.token" exists

# Duplicates email
POST {{host}}/keys
X-API-KEY: 1234apikey
{
	"name": "dryflower",
	"claims": {
		"isAdmin": true,
		"permissions": ["core.read"]
	}
}
HTTP 409

# List
GET {{host}}/keys
Authorization: Bearer {{jwt}}
HTTP 200
[Asserts]
jsonpath "$.items[0].id" == {{id}}
jsonpath "$.items[0].name" == "dryflower"
jsonpath "$.items[0].claims.permissions" contains "apikeys.read"


DELETE {{host}}/keys/{{id}}
Authorization: Bearer {{jwt}}
HTTP 403

DELETE {{host}}/keys/{{id}}
X-API-KEY: 1234apikey
HTTP 200
