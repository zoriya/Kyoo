*** Settings ***
Documentation       Common things to handle rest requests

Library             REST  http://localhost:8901/auth


*** Keywords ***
Login
  [Documentation]  Shortcut to login with the given username for future requests
  [Arguments]  ${username}
  &{res}=  POST  /sessions  {"username": "${username}", "password": "password-${username}"}
  Output
  Integer  response status  201
  String  response body access_token
  ConvertToJwt  ${res.body.token}

Register
  [Documentation]  Shortcut to register with the given username for future requests
  [Arguments]  ${username}
  &{res}=  POST
  ...  /users
  ...  {"username": "${username}", "password": "password-${username}", "email": "${username}@zoriya.dev"}
  Output
  Integer  response status  201
  String  response body token
  ConvertToJwt  ${res.body.token}

ConvertToJwt
  [Documentation]  Convert a session token to a jwt and set it in the header
  [Arguments]  ${token}
  Set Headers  {"Authorization": "Bearer ${token}"}
  ${res}=  GET  /jwt
  Output
  Integer  response status  200
  String  response body token
  Set Headers  {"Authorization": "Bearer ${res.token}"}

Logout
  [Documentation]  Logout the current user, only the local client is affected.
  ${res}=  DELETE  /sessions/current
  Output
  Integer  response status  200
  Set Headers  {"Authorization": ""}
