# perm check
POST {{host}}/keys
{
	"name": "dryflower",
	"claims": {
		"isAdmin": true,
		"permssions": ["core.read"]
	}
}
HTTP 401

POST {{host}}/keys
# this is created from the gh workflow file's env var
X-API-KEY: hurl-1234apikey
{
	"name": "dryflower",
	"claims": {
		"isAdmin": true,
		"permssions": ["core.read"]
	}
}
HTTP 201
[Captures]
token: jsonpath "$.token"

GET {{host}}/jwt
Authorization: Bearer {{token}}
HTTP 200
[Captures]
id: jsonpath "$.id"
jwt: jsonpath "$.token"

# Duplicates email
POST {{host}}/keys
X-API-KEY: hurl-1234apikey
{
	"name": "dryflower",
	"claims": {
		"isAdmin": true,
		"permssions": ["core.read"]
	}
}
HTTP 409

# List
GET {{host}}/keys
Authorization: Bearer {{token}}
HTTP 200
[Asserts]
jsonpath "$.items[0].id" == {{id}}
jsonpath "$.items[0].name" == "dryflower"
jsonpath "$.items[0].claims.permissions" contains "core.read"



DELETE {{host}}/keys/{{id}}
Authorization: Bearer {{jwt}}
HTTP 200
