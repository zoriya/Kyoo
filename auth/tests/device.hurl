# Setup user
POST {{host}}/users
{
    "username": "device-user",
    "password": "password-device-user",
    "email": "device-user@zoriya.dev"
}
HTTP 201
[Captures]
token: jsonpath "$.token"

GET {{host}}/jwt
Authorization: Bearer {{token}}
HTTP 200
[Captures]
jwt: jsonpath "$.token"

# Start a device login
POST {{host}}/device?device=Android%20TV
HTTP 201
[Captures]
deviceCode: jsonpath "$.deviceCode"
userCode: jsonpath "$.userCode"
[Asserts]
jsonpath "$.userCode" matches /^[A-Z]{8}$/

# Not yet approved
DELETE {{host}}/device
{
    "deviceCode": "{{deviceCode}}"
}
HTTP 428

# Invalid device code
DELETE {{host}}/device
{
    "deviceCode": "invalid"
}
HTTP 410

# Approving requires an account
PATCH {{host}}/device
{
    "code": "{{userCode}}"
}
HTTP 401

# Invalid user code
PATCH {{host}}/device
Authorization: Bearer {{jwt}}
{
    "code": "AAAAAAAA"
}
HTTP 404

# Approve
PATCH {{host}}/device
Authorization: Bearer {{jwt}}
{
    "code": "{{userCode}}"
}
HTTP 200
[Asserts]
jsonpath "$.device" startsWith "Android TV"

# Can't approve twice
PATCH {{host}}/device
Authorization: Bearer {{jwt}}
{
    "code": "{{userCode}}"
}
HTTP 404

# Device gets its session
DELETE {{host}}/device
{
    "deviceCode": "{{deviceCode}}"
}
HTTP 201
[Captures]
deviceToken: jsonpath "$.token"

GET {{host}}/jwt
Authorization: Bearer {{deviceToken}}
HTTP 200
[Captures]
deviceJwt: jsonpath "$.token"

GET {{host}}/users/me
Authorization: Bearer {{deviceJwt}}
HTTP 200
[Asserts]
jsonpath "$.username" == "device-user"

# Session can only be retrieved once
DELETE {{host}}/device
{
    "deviceCode": "{{deviceCode}}"
}
HTTP 410

# Cleanup
DELETE {{host}}/users/me
Authorization: Bearer {{jwt}}
HTTP 200
