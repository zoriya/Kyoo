# Setup
POST {{host}}/users
{
    "username": "user-1",
    "password": "password-user-1",
    "email": "user-1@zoriya.dev"
}
HTTP 201
[Captures]
token: jsonpath "$.token"

GET {{host}}/jwt
Authorization: Bearer {{token}}
HTTP 200
[Captures]
jwt: jsonpath "$.token"


# Duplicates usernames
POST {{host}}/users
{
    "username": "user-1",
    "password": "password-user-duplicate",
    "email": "user-duplicate@zoriya.dev"
}
HTTP 409


# Duplicates email
POST {{host}}/users
{
    "username": "user-duplicate",
    "password": "pass",
    "email": "user-1@zoriya.dev"
}
HTTP 409


DELETE {{host}}/users/me
Authorization: Bearer {{jwt}}
HTTP 200
