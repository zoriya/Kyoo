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

# Edit
PATCH {{host}}/keys/{{id}}
Authorization: Bearer {{jwt}}
{
	"claims": {
		"permissions": ["core.read"]
	}
}
HTTP 403

PATCH {{host}}/keys/{{id}}
X-API-KEY: 1234apikey
{
	"name": "wetflower",
	"claims": {
		"permissions": ["apikeys.read", "core.read"]
	}
}
HTTP 200
[Asserts]
jsonpath "$.id" == {{id}}
jsonpath "$.name" == "wetflower"
jsonpath "$.claims.permissions" contains "core.read"
jsonpath "$.claims.isAdmin" not exists

PATCH {{host}}/keys/{{id}}
X-API-KEY: 1234apikey
{
	"name": "not-alpha"
}
HTTP 422


DELETE {{host}}/keys/{{id}}
Authorization: Bearer {{jwt}}
HTTP 403

DELETE {{host}}/keys/{{id}}
X-API-KEY: 1234apikey
HTTP 200
