*** Settings ***
Documentation       Tests of the /users route.
...                 Ensures that the user can authenticate on kyoo.

Resource            ./auth.resource


*** Test Cases ***
Me cant be accessed without an account
  Get  /users/me
  Output
  Integer  response status  401

Register
  [Documentation]  Create a new user and login in it
  Register  user-1
  [Teardown]  DELETE  /users/me

Register Duplicates
  [Documentation]  If two users tries to register with the same username, it fails
  Register  user-duplicate
  # We can't use the `Register` keyword because it assert for success
  POST  /auth/register  {"username": "user-duplicate", "password": "pass", "email": "mail@zoriya.dev"}
  Output
  Integer  response status  409
  [Teardown]  DELETE  /users/me

Delete Account
  [Documentation]  Check if a user can delete it's account
  Register  I-should-be-deleted
  DELETE  /users/me
  Output
  Integer  response status  200
