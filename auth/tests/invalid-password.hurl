# Register a user for invalid password test
POST {{host}}/users
{
    "username": "login-user",
    "password": "password-login-user",
    "email": "invalid-password-user@zoriya.dev"
}
HTTP 201
[Captures]
token: jsonpath "$.token"

GET {{host}}/jwt
Authorization: Bearer {{token}}
HTTP 200
[Captures]
jwt: jsonpath "$.token"

GET {{host}}/users/me
Authorization: Bearer {{jwt}}
HTTP 200
[Captures]
register_info: body
[Asserts]
jsonpath "$.username" == "login-user"

DELETE {{host}}/sessions/current
Authorization: Bearer {{jwt}}
HTTP 200

POST {{hosts}}/sessions
{
    "login": "login-user",
    "password": "password-login-user"
}
HTTP 201
[Captures]
jwt: jsonpath "$.token"

GET {{host}}/jwt
Authorization: Bearer {{token}}
HTTP 200
[Captures]
jwt: jsonpath "$.token"

GET {{host}}/users/me
Authorization: Bearer {{jwt}}
HTTP 200
[Asserts]
jsonpath "$.username" == "login-user"
body == {{register_info}}

DELETE {{host}}/users/me
Authorization: Bearer {{jwt}}
HTTP 200
