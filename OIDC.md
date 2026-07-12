# OpenID Connect

Kyoo supports OpenID Connect (OIDC) for authentication. This allows you to use your existing identity provider to authenticate users in Kyoo.

## Configuration

To enable OIDC, you need to fill the following environment variables in your `.env` file:

```env
PUBLIC_URL=https://your-kyoo-instance.com
OIDC_<name>_NAME=<name>
OIDC_<name>_LOGO=https://url-of-your-logo.com
OIDC_<name>_CLIENTID=
OIDC_<name>_SECRET=
OIDC_<name>_AUTHORIZATION=https://url-of-the-authorization-endpoint-of-the-oidc-service.com/auth
OIDC_<name>_TOKEN=https://url-of-the-token-endpoint-of-the-oidc-service.com/token
OIDC_<name>_PROFILE=https://url-of-the-profile-endpoint-of-the-oidc-service.com/userinfo
OIDC_<name>_SCOPE="email openid profile"
OIDC_<name>_AUTHMETHOD=ClientSecretBasic
```

- `PUBLIC_URL` is the URL of your Kyoo instance. This is required for OIDC to work.
- `<name>` is the name of the OIDC provider. It can be anything you want. This will be the display name of the OIDC provider on the login page.
- `OIDC_<name>_LOGO` is the URL of the logo of the OIDC provider. It will be displayed on the login page.
- `OIDC_<name>_CLIENTID` is the client ID of the OIDC provider.
- `OIDC_<name>_SECRET` is the client secret of the OIDC provider.
- `OIDC_<name>_AUTHORIZATION` is the URL of the authorization endpoint of the OIDC provider.
- `OIDC_<name>_TOKEN` is the URL of the token endpoint of the OIDC provider.
- `OIDC_<name>_PROFILE` is the URL of the profile endpoint of the OIDC provider.
- `OIDC_<name>_SCOPE` is the scope of the OIDC provider. This is a space-separated list of scopes.
- `OIDC_<name>_AUTHMETHOD` is the authentication method of the OIDC provider. This can be `ClientSecretBasic` or `ClientSecretPost`.

## Third-party clients (redirect allowlist)

After a successful OIDC login, Kyoo redirects the browser back to a client with a
one-use login token appended to the URL. To prevent that token from being handed
to an attacker-controlled destination, Kyoo only redirects to registered targets.

The following targets are always allowed, with no configuration:

- The official web app — your `PUBLIC_URL` origin.
- The official mobile app — the `kyoo://` scheme.
- Loopback addresses (`http://127.0.0.1`, `http://localhost`, `http://[::1]`) on
  any port, for native/CLI apps that bind an ephemeral local port (RFC 8252).

To let any other third-party client complete OIDC login, register its redirect
target(s) with `EXTRA_OIDC_REDIRECT_URLS` (comma separated):

```env
EXTRA_OIDC_REDIRECT_URLS=https://app.example.com,myapp
```

Each entry is one of:

- **A web origin** (`https://app.example.com`) — matched exactly by scheme, host,
  and port. Include the port if the client uses a non-default one.
- **A bare custom scheme** (`myapp`) — matched by scheme only, for native apps
  that own a URL scheme (e.g. `myapp://oidc-callback`).

Any redirect target not covered by these rules is rejected with `400`.

## Example

### Google OIDC

To enable Google OIDC, please follow the instructions from the [Google Developers](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid) to create a new project and get the client ID and secret.

When creating the Oauth 2.0 Client ID, make sure to add the following redirect URI: `https://your-kyoo-instance.com/api/auth/logged/google`.

For the authorized JavaScript origins, add `https://your-kyoo-instance.com`.

Then, fill the following environment variables in your `.env` file:

```env
PUBLIC_URL=https://your-kyoo-instance.com
OIDC_GOOGLE_NAME=Google
OIDC_GOOGLE_LOGO=https://www.gstatic.com/marketing-cms/assets/images/d5/dc/cfe9ce8b4425b410b49b7f2dd3f3/g.webp=s200
OIDC_GOOGLE_CLIENTID=<client-id> # the client ID you got from Google
OIDC_GOOGLE_SECRET=<client-secret> # the client secret you got from Google
OIDC_GOOGLE_AUTHORIZATION=https://accounts.google.com/o/oauth2/auth
OIDC_GOOGLE_TOKEN=https://oauth2.googleapis.com/token
OIDC_GOOGLE_PROFILE=https://www.googleapis.com/oauth2/v2/userinfo
OIDC_GOOGLE_SCOPE="email openid profile"
OIDC_GOOGLE_AUTHMETHOD=ClientSecretPost
```

### Another OIDC providers

To enable another OIDC provider, just fill the environment variables with the information you got from the provider.

Remember that when `<name>` is `XYZ`, the environment variables should start with `OIDC_XYZ_`.

In that case, the callback URL will be `https://your-kyoo-instance.com/api/auth/logged/xyz`.
