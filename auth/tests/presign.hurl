# Setup user
POST {{host}}/users
{
    "username": "presign-user",
    "password": "password-presign-user",
    "email": "presign-user@zoriya.dev"
}
HTTP 201
[Captures]
token: jsonpath "$.token"

GET {{host}}/jwt
Authorization: Bearer {{token}}
HTTP 200
[Captures]
jwt: jsonpath "$.token"

# Cannot presign without being authenticated
POST {{host}}/presign
{
    "for": [{ "prefix": "/videos/abc/", "verb": "GET" }],
    "duration": "1h"
}
HTTP 401

# `for` is required
POST {{host}}/presign
Authorization: Bearer {{jwt}}
{
    "duration": "1h"
}
HTTP 422

# `duration` is required
POST {{host}}/presign
Authorization: Bearer {{jwt}}
{
    "for": [{ "prefix": "/videos/abc/", "verb": "GET" }]
}
HTTP 422

# `verb` is required in a rule
POST {{host}}/presign
Authorization: Bearer {{jwt}}
{
    "for": [{ "prefix": "/videos/abc/" }],
    "duration": "1h"
}
HTTP 422

# Presign a url prefix and an exact url
POST {{host}}/presign
Authorization: Bearer {{jwt}}
{
    "for": [
        { "prefix": "/videos/abc/", "verb": "GET" },
        { "url": "/images/logo.png", "verb": "GET" }
    ],
    "duration": "1h"
}
HTTP 200
[Captures]
signature: jsonpath "$.signature"
[Asserts]
jsonpath "$.for[0].prefix" == "/videos/abc/"
jsonpath "$.for[1].url" == "/images/logo.png"
jsonpath "$.expireAt" exists

# The signature grants a jwt for a request allowed by the prefix rule (forwarded by traefik's forward-auth)
GET {{host}}/jwt?x-presign={{signature}}
X-Forwarded-Uri: /videos/abc/master.m3u8
X-Forwarded-Method: GET
HTTP 200
[Asserts]
jsonpath "$.token" exists

# The signature grants a jwt for the exact url rule
GET {{host}}/jwt?x-presign={{signature}}
X-Forwarded-Uri: /images/logo.png
X-Forwarded-Method: GET
HTTP 200
[Asserts]
jsonpath "$.token" exists

# The signature is rejected for a path outside every rule
GET {{host}}/jwt?x-presign={{signature}}
X-Forwarded-Uri: /videos/other/master.m3u8
X-Forwarded-Method: GET
HTTP 403

# The signature is rejected when the verb does not match
GET {{host}}/jwt?x-presign={{signature}}
X-Forwarded-Uri: /videos/abc/master.m3u8
X-Forwarded-Method: DELETE
HTTP 403

# The exact url rule does not match a longer path
GET {{host}}/jwt?x-presign={{signature}}
X-Forwarded-Uri: /images/logo.png/extra
X-Forwarded-Method: GET
HTTP 403

# A garbage signature is rejected
GET {{host}}/jwt?x-presign=not-a-real-signature
X-Forwarded-Uri: /videos/abc/master.m3u8
X-Forwarded-Method: GET
HTTP 403

# Presign the progress websocket: a `GET` rule authorizes opening it and a
# `wsRoutes` claim scopes which message the token may send (checked by the api).
POST {{host}}/presign
Authorization: Bearer {{jwt}}
{
    "for": [
        { "url": "/api/ws", "verb": "GET" }
    ],
    "claims": {
        "wsRoutes": ["watch/entry-abc"]
    },
    "duration": "1h"
}
HTTP 200
[Captures]
ws_signature: jsonpath "$.signature"
[Asserts]
jsonpath "$.for[0].url" == "/api/ws"
jsonpath "$.claims.wsRoutes[0]" == "watch/entry-abc"

# The signature grants a jwt for the websocket upgrade (a plain GET).
GET {{host}}/jwt?x-presign={{ws_signature}}
X-Forwarded-Uri: /api/ws
X-Forwarded-Method: GET
HTTP 200
[Asserts]
jsonpath "$.token" exists

# A presign request may not set a protected claim (would escalate the token).
POST {{host}}/presign
Authorization: Bearer {{jwt}}
{
    "for": [{ "url": "/api/ws", "verb": "GET" }],
    "claims": {
        "permissions": ["users.read"]
    },
    "duration": "1h"
}
HTTP 400

# Cleanup
DELETE {{host}}/users/me
Authorization: Bearer {{jwt}}
HTTP 200
