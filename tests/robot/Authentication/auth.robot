*** Settings ***
Documentation   Tests of the /auth route.
...             Ensures that the user can authenticate on kyoo.
Resource        ../rest.resource


*** Test Cases ***
BadAccount
	[Documentation]  Login fails if user does not exist
	POST             /auth/login               {"username": "toto", "password": "tata"}
	Output
	Integer          response status           403

Register
	[Documentation]  Create a new user and login in it
	POST             /auth/register            {"username": "toto", "password": "tata", "email": "mail@kyoo.moe"}
	Output
	Integer          response status           403
