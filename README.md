# where-server-auth-delegate
where-server-auth-delegate. Delegates authentication and authorization to an app module.

## Installation
```sh
npm i @where-org/where-server-auth-delegate
```

## Authentication

This module provides `login`, `refresh`, and `verify`.

- **JWT** - `login` issues a short-lived access token and a longer-lived
  refresh token; `refresh` renews them; `verify` validates the access token.
- **API Key** - verify-only. No `login` or `refresh`.

`verify` dispatches by request header, so a single credential can serve either
method, or both:

| Request header                 | Verified as |
| ------------------------------ | ----------- |
| `Authorization: Bearer <token>`| JWT         |
| `X-API-Key: <key>`             | API Key     |

## Configuration

Add the following to `config/server-app.yaml`.

- `[...]` - placeholder, replace with your value
- `${VAR:-default}` - environment variable with default value

### Secret

Generate a secret with the [`where-helper`](https://github.com/where-org/where-helper) CLI.
Pass the JWT algorithm to generate a secret of the matching length
(default: `HS256`). The secret length must match the configured `jwtAlgorithm`.

```sh
# HS256 (default)
npx where-helper gen secret

# HS512 (longer secret)
npx where-helper gen secret HS512

# see all supported algorithms
npx where-helper gen secret -h
```

Set the generated value as an environment variable (e.g. in `.env`).
Do **not** write the secret directly in `server-app.yaml`.

```sh
# .env
SECRET=<paste-your-generated-secret-here>
```

### Access Token / Refresh Token (JWT)

On `login`, the password is verified against the app table using
`passwordHashAlgorithm`, then a JWT is signed with `jwtAlgorithm`.
`verify` validates the `Authorization: Bearer <token>` header.

```yaml
[APP_NAME]:
  # delegate (jwt)
  auth:
    module: '@where-org/where-server-auth-delegate'
    credential:
      issuer               : ${ISSUER}
      audience             : ${AUDIENCE}
      secret               : ${SECRET}
      expiresIn            : ${EXPIRES_IN:-1s}
      refreshExpiresIn     : ${REFRESH_EXPIRES_IN:-5s}
      jwtAlgorithm         : ${JWT_ALGORITHM:-HS256} # HS256 | HS512
      passwordHashAlgorithm: ${PASSWORD_HASH_ALGORITHM:-argon2} # argon2 (default) | bcrypt
      table                : ${TABLE}
      subject              : ${SUBJECT_KEY}
      user                 : ${USER_KEY}
      password             : ${PASSWORD_KEY}
      scope                : ${SCOPE_KEY}
```

### API Key

Verify-only. `verify` validates the `X-API-Key: <key>` header against the
hashed value stored in the app table using `apiKeyHashAlgorithm`.
No JWT-related fields are required.

```yaml
[APP_NAME]:
  # delegate (apiKey)
  auth:
    module: '@where-org/where-server-auth-delegate'
    credential:
      apiKeyHashAlgorithm: ${APIKEY_HASH_ALGORITHM:-sha256}
      table              : ${TABLE}
      subject            : ${SUBJECT_KEY}
      scope              : ${SCOPE_KEY}
      apiKey             : ${APIKEY_KEY}
```

### JWT + API Key (combined)

Configure both methods in a single credential. `verify` then accepts either an
`Authorization: Bearer` token or an `X-API-Key`, while `login` / `refresh`
remain available for the JWT flow.

```yaml
[APP_NAME]:
  # delegate (jwt + apiKey)
  auth:
    module: '@where-org/where-server-auth-delegate'
    credential:
      issuer               : ${ISSUER}
      audience             : ${AUDIENCE}
      secret               : ${SECRET}
      expiresIn            : ${EXPIRES_IN:-1s}
      refreshExpiresIn     : ${REFRESH_EXPIRES_IN:-5s}
      jwtAlgorithm         : ${JWT_ALGORITHM:-HS256} # HS256 | HS512
      passwordHashAlgorithm: ${PASSWORD_HASH_ALGORITHM:-argon2} # argon2 (default) | bcrypt
      table                : ${TABLE}
      subject              : ${SUBJECT_KEY}
      user                 : ${USER_KEY}
      password             : ${PASSWORD_KEY}
      scope                : ${SCOPE_KEY}
      apiKeyHashAlgorithm  : ${APIKEY_HASH_ALGORITHM:-sha256}
      apiKey               : ${APIKEY_KEY}
```
