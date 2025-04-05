POST {{host}}/users
{
    "username": "edit-settings",
    "password": "password-login-user",
    "email": "edit-settings@zoriya.dev"
}
HTTP 201
[Captures]
token: jsonpath "$.token"

GET {{host}}/jwt
Authorization: Bearer {{token}}
HTTP 200
[Captures]
jwt: jsonpath "$.token"

PATCH {{host}}/users/me
Authorization: Bearer {{jwt}}
{
	"claims": {
		"preferOriginal": true
	}
}
HTTP 200
[Asserts]
jsonpath ".claims.preferOriginal" == true
jsonpath ".username" == "edit-settings"

# Invalid password login
POST {{host}}/jwt
Authorization: Bearer {{token}}
HTTP 403

DELETE {{host}}/users/me
Authorization: Bearer {{jwt}}
HTTP 200
