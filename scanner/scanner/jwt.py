import os
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer, SecurityScopes
from jwt import PyJWKClient

jwks_client = PyJWKClient(
	os.environ.get("JWKS_URL", "http://auth:4568/.well-known/jwks.json")
)

security = HTTPBearer(scheme_name="Bearer")


def validate_bearer(
	token: Annotated[HTTPAuthorizationCredentials, Depends(security)],
	perms: SecurityScopes,
):
	try:
		payload = jwt.decode(
			token.credentials,
			jwks_client.get_signing_key_from_jwt(token.credentials).key,
			issuer=os.environ.get("JWT_ISSUER"),
		)
		for scope in perms.scopes:
			if scope not in payload["permissions"]:
				raise HTTPException(
					status_code=403,
					detail=f"Missing permissions {', '.join(perms.scopes)}",
					headers={
						"WWW-Authenticate": f'Bearer permissions="{",".join(perms.scopes)}"'
					},
				)
		return payload
	except Exception as e:
		raise HTTPException(
			status_code=403,
			detail="Could not validate credentials",
			headers={"WWW-Authenticate": "Bearer"},
		) from e
