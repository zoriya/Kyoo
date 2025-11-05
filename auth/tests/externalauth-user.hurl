POST {{host}}/users
{
    "username": "user-1",
    "password": "password-user-1",
    "email": "user-1@zoriya.dev"
}
HTTP 201
[Captures]
token: jsonpath "$.token"

# Check external auth with token

POST {{host}}/jwt/api/movies
Authorization: Bearer {{token}}
HTTP 200
[Captures]
auth_header_token: header "Authorization"

# Check if the auth header is working
GET {{host}}/users/me
Authorization: {{auth_header_token}}
HTTP 200

# Check external auth with cookie

DELETE {{host}}/jwt/toto
Cookie: X-Bearer={{token}}
HTTP 200
[Captures]
auth_header_cookie: header "Authorization"

# Check if the auth header is working
GET {{host}}/users/me
Authorization: {{auth_header_cookie}}
HTTP 200

# Clean user

DELETE {{host}}/users/me
Authorization: Bearer {{token}}
HTTP 200
