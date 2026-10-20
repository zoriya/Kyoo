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

# `duration` is capped
POST {{host}}/presign
Authorization: Bearer {{jwt}}
{
    "for": [{ "prefix": "/videos/abc/", "verb": "GET" }],
    "duration": "100000h"
}
HTTP 400

POST {{host}}/presign
Authorization: Bearer {{jwt}}
{
    "for": [{ "prefix": "/videos/abc/", "verb": "GET" }],
    "duration": "-1h"
}
HTTP 400

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

# A prefix matches whole path segments, with or without a trailing slash
POST {{host}}/presign
Authorization: Bearer {{jwt}}
{
    "for": [{ "prefix": "/videos/abc", "verb": "GET" }],
    "duration": "1h"
}
HTTP 200
[Captures]
segment_signature: jsonpath "$.signature"

GET {{host}}/jwt?x-presign={{segment_signature}}
X-Forwarded-Uri: /videos/abc
X-Forwarded-Method: GET
HTTP 200

GET {{host}}/jwt?x-presign={{segment_signature}}
X-Forwarded-Uri: /videos/abc/master.m3u8
X-Forwarded-Method: GET
HTTP 200

GET {{host}}/jwt?x-presign={{segment_signature}}
X-Forwarded-Uri: /videos/abcd/master.m3u8
X-Forwarded-Method: GET
HTTP 403

GET {{host}}/jwt?x-presign={{signature}}
X-Forwarded-Uri: /videos/abcd/master.m3u8
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

# The prefix rule can't be escaped with a path traversal
GET {{host}}/jwt?x-presign={{signature}}
X-Forwarded-Uri: /videos/abc/../../users/me
X-Forwarded-Method: GET
HTTP 403

GET {{host}}/jwt?x-presign={{signature}}
X-Forwarded-Uri: /videos/abc/%2e%2e/other/master.m3u8
X-Forwarded-Method: GET
HTTP 403

GET {{host}}/jwt?x-presign={{signature}}
X-Forwarded-Uri: /videos/abc//master.m3u8
X-Forwarded-Method: GET
HTTP 403

# A garbage signature is rejected
GET {{host}}/jwt?x-presign=not-a-real-signature
X-Forwarded-Uri: /videos/abc/master.m3u8
X-Forwarded-Method: GET
HTTP 403

# The signature is not a bearer: it can't be refreshed into an unscoped jwt
GET {{host}}/jwt
Authorization: Bearer {{signature}}
HTTP 403

# nor be used on keibi's own routes
GET {{host}}/users/me
Authorization: Bearer {{signature}}
HTTP 403

POST {{host}}/presign
Authorization: Bearer {{signature}}
{
    "for": [{ "prefix": "/", "verb": "GET" }],
    "duration": "1h"
}
HTTP 403

# The jwt a signature is exchanged for is scoped the same way
GET {{host}}/jwt?x-presign={{signature}}
X-Forwarded-Uri: /videos/abc/master.m3u8
X-Forwarded-Method: GET
HTTP 200
[Captures]
presigned_jwt: jsonpath "$.token"

GET {{host}}/jwt
Authorization: Bearer {{presigned_jwt}}
HTTP 403

GET {{host}}/users/me
Authorization: Bearer {{presigned_jwt}}
HTTP 403

# and it can't be used as a presign signature (a presign can't create a presign)
GET {{host}}/jwt?x-presign={{presigned_jwt}}
X-Forwarded-Uri: /videos/abc/master.m3u8
X-Forwarded-Method: GET
HTTP 403

POST {{host}}/presign
Authorization: Bearer {{presigned_jwt}}
{
    "for": [{ "prefix": "/", "verb": "GET" }],
    "duration": "1h"
}
HTTP 403

# even when the signature's rules allow `POST /presign`
POST {{host}}/presign
Authorization: Bearer {{jwt}}
{
    "for": [{ "url": "/auth/presign", "verb": "POST" }],
    "duration": "1h"
}
HTTP 200
[Captures]
presign_signature: jsonpath "$.signature"

POST {{host}}/presign?x-presign={{presign_signature}}
{
    "for": [{ "prefix": "/", "verb": "GET" }],
    "duration": "1h"
}
HTTP 403
[Asserts]
body contains "Cannot presign from a presigned request"

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

# The jwt is built from the user's current claims, not the ones at the presign's creation
PATCH {{host}}/users/me
Authorization: Bearer {{jwt}}
{
    "claims": { "presignTest": "edited" }
}
HTTP 200

GET {{host}}/jwt?x-presign={{ws_signature}}
X-Forwarded-Uri: /api/ws
X-Forwarded-Method: GET
HTTP 200
[Asserts]
jsonpath "$.token" split "." nth 1 base64UrlSafeDecode charsetDecode "utf-8" jsonpath "$.presignTest" == "edited"
jsonpath "$.token" split "." nth 1 base64UrlSafeDecode charsetDecode "utf-8" jsonpath "$.wsRoutes[0]" == "watch/entry-abc"
jsonpath "$.token" split "." nth 1 base64UrlSafeDecode charsetDecode "utf-8" jsonpath "$.username" == "presign-user"

# and doesn't outlive the signature
POST {{host}}/presign
Authorization: Bearer {{jwt}}
{
    "for": [{ "prefix": "/videos/abc/", "verb": "GET" }],
    "duration": "10m"
}
HTTP 200
[Captures]
short_signature: jsonpath "$.signature"
short_expire: jsonpath "$.expireAt" toDate "%+" format "%s" toInt

GET {{host}}/jwt?x-presign={{short_signature}}
X-Forwarded-Uri: /videos/abc/master.m3u8
X-Forwarded-Method: GET
HTTP 200
[Asserts]
jsonpath "$.token" split "." nth 1 base64UrlSafeDecode charsetDecode "utf-8" jsonpath "$.exp" == {{short_expire}}

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

POST {{host}}/presign
Authorization: Bearer {{jwt}}
{
    "for": [{ "url": "/api/ws", "verb": "GET" }],
    "claims": {
        "presign": "[{\"prefix\":\"/\",\"verb\":\"GET\"}]"
    },
    "duration": "1h"
}
HTTP 400

# Api keys can presign (env keys, created from the gh workflow file's env var)
GET {{host}}/jwt
X-API-KEY: 1234apikey
HTTP 200
[Captures]
env_key_jwt: jsonpath "$.token"

POST {{host}}/presign
Authorization: Bearer {{env_key_jwt}}
{
    "for": [{ "prefix": "/videos/abc/", "verb": "GET" }],
    "duration": "1h"
}
HTTP 200
[Captures]
env_key_signature: jsonpath "$.signature"

GET {{host}}/jwt?x-presign={{env_key_signature}}
X-Forwarded-Uri: /videos/abc/master.m3u8
X-Forwarded-Method: GET
HTTP 200

# and db keys, until they get deleted
POST {{host}}/keys
X-API-KEY: 1234apikey
{
    "name": "presignkey",
    "claims": {}
}
HTTP 201
[Captures]
db_key_id: jsonpath "$.id"
db_key: jsonpath "$.token"

GET {{host}}/jwt
X-API-KEY: {{db_key}}
HTTP 200
[Captures]
db_key_jwt: jsonpath "$.token"

POST {{host}}/presign
Authorization: Bearer {{db_key_jwt}}
{
    "for": [{ "prefix": "/videos/abc/", "verb": "GET" }],
    "duration": "1h"
}
HTTP 200
[Captures]
db_key_signature: jsonpath "$.signature"

GET {{host}}/jwt?x-presign={{db_key_signature}}
X-Forwarded-Uri: /videos/abc/master.m3u8
X-Forwarded-Method: GET
HTTP 200

DELETE {{host}}/keys/{{db_key_id}}
X-API-KEY: 1234apikey
HTTP 200

GET {{host}}/jwt?x-presign={{db_key_signature}}
X-Forwarded-Uri: /videos/abc/master.m3u8
X-Forwarded-Method: GET
HTTP 403

# Presigns are revoked with their session
POST {{host}}/sessions
{
    "login": "presign-user",
    "password": "password-presign-user"
}
HTTP 201
[Captures]
other_session: jsonpath "$.token"

GET {{host}}/jwt
Authorization: Bearer {{other_session}}
HTTP 200
[Captures]
other_jwt: jsonpath "$.token"

POST {{host}}/presign
Authorization: Bearer {{other_jwt}}
{
    "for": [{ "prefix": "/videos/abc/", "verb": "GET" }],
    "duration": "1h"
}
HTTP 200
[Captures]
other_signature: jsonpath "$.signature"

DELETE {{host}}/sessions/current
Authorization: Bearer {{other_jwt}}
HTTP 200

GET {{host}}/jwt?x-presign={{other_signature}}
X-Forwarded-Uri: /videos/abc/master.m3u8
X-Forwarded-Method: GET
HTTP 403

# and can't be created after it (with a jwt that has yet to expire)
POST {{host}}/presign
Authorization: Bearer {{other_jwt}}
{
    "for": [{ "prefix": "/videos/abc/", "verb": "GET" }],
    "duration": "1h"
}
HTTP 403

# Cleanup
DELETE {{host}}/users/me
Authorization: Bearer {{jwt}}
HTTP 200

# and with their user
GET {{host}}/jwt?x-presign={{signature}}
X-Forwarded-Uri: /videos/abc/master.m3u8
X-Forwarded-Method: GET
HTTP 403
