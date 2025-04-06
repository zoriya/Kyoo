POST {{host}}/users
{
    "username": "edit-password",
    "password": "password-login-user",
    "email": "invalid-password-user@zoriya.dev"
}
HTTP 201
[Captures]
first_token: jsonpath "$.token"

POST {{host}}/sessions
{
    "login": "edit-password",
    "password": "password-login-user"
}
HTTP 201
[Captures]
token: jsonpath "$.token"

GET {{host}}/jwt
Authorization: Bearer {{token}}
HTTP 200
[Captures]
jwt: jsonpath "$.token"

PATCH {{host}}/users/me/password
Authorization: Bearer {{jwt}}
{
	"password": "new-password"
}
HTTP 204

# Invalid password login
POST {{host}}/jwt
Authorization: Bearer {{first_token}}
HTTP 403

DELETE {{host}}/users/me
Authorization: Bearer {{jwt}}
HTTP 200
