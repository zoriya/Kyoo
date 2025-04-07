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

GET {{host}}/users/me
Authorization: Bearer {{jwt}}
HTTP 200
[Captures]
userId: jsonpath "$.id"
[Asserts]
# this should be defined in the `FIRST_USER_CLAIMS='{"permissions": ["users.read"]}'` env var
jsonpath "$.claims.permissions" contains "users.read"


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

# Cannot get non-existing user
GET {{host}}/users/dont-exist
Authorization: Bearer {{jwt}}
HTTP 404

# Can get user by id
GET {{host}}/users/{{userId}}
Authorization: Bearer {{jwt}}
HTTP 200
[Asserts]
jsonpath "$.username" == "user-1"

# Can get user by username
GET {{host}}/users/user-1
Authorization: Bearer {{jwt}}
HTTP 200
[Asserts]
jsonpath "$.id" == {{userId}}
jsonpath "$.username" == "user-1"


DELETE {{host}}/users/me
Authorization: Bearer {{jwt}}
HTTP 200
