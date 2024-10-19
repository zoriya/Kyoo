*** Settings ***
Documentation       Tests of the /sessions route.

Resource            ./auth.resource


*** Test Cases ***
Bad Account
  [Documentation]  Login fails if user does not exist
  POST  /sessions  {"login": "i-don-t-exist", "password": "pass"}
  Output
  Integer  response status  404

Invalid password
  [Documentation]  Login fails if password is invalid
  Register  invalid-password-user
  POST  /sessions  {"login": "invalid-password-user", "password": "pass"}
  Output
  Integer  response status  403
  [Teardown]  DELETE  /users/me

Login
  [Documentation]  Create a new user and login in it
  Register  login-user
  ${res}=  GET  /users/me
  Output
  Integer  response status  200
  String  response body username  login-user
  Logout
  Login  login-user
  ${me}=  Get  /users/me
  Output
  Output  ${me}
  Should Be Equal As Strings  ${res["body"]}  ${me["body"]}

  [Teardown]  DELETE  /users/me
