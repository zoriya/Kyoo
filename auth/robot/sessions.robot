*** Settings ***
Documentation       Tests of the /sessions route.

Resource            ./auth.resource


*** Test Cases ***
Bad Account
  [Documentation]  Login fails if user does not exist
  POST  /sessions  {"login": "i-don-t-exist", "password": "pass"}
  Output
  Integer  response status  403

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

  [Teardown]  DELETE  /auth/me
