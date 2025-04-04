# Bad Account (login fails if user does not exist)
POST {{host}}/sessions
{
    "login": "i-don-t-exist",
    "password": "pass"
}
HTTP 404

# Invalid password
POST {{host}}/sessions
{
    "login": "invalid-password-user",
    "password": "pass"
}
HTTP 403

# Me cant be accessed without an account
GET {{host}}/users/me
HTTP 401
