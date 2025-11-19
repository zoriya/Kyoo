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

# Check external auth with api key
GET {{host}}/jwt
X-API-KEY: {{token}}
HTTP 200
[Captures]
auth_header_apikey: header "Authorization"

# Check if the auth header is working
GET {{host}}/keys
Authorization: {{auth_header_apikey}}
HTTP 200
[Asserts]
jsonpath "$.items[0].id" == {{id}}
jsonpath "$.items[0].name" == "dryflower"
jsonpath "$.items[0].claims.permissions" contains "apikeys.read"

# Clean api key

DELETE {{host}}/keys/{{id}}
X-API-KEY: 1234apikey
HTTP 200
