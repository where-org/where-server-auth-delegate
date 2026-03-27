# where-server-auth-delegate
where-server-auth-delegate. Delegates authentication and authorization to an app module.

## Installation
```sh
npm i @where-org/where-server-auth-delegate
```

## Configuration

Add the following to `config/server-app.yaml`:

- `[...]` - placeholder, replace with your value
- `${VAR:-default}` - environment variable with default value

```yaml
[APP_NAME]:
  auth:
    module: '@where-org/where-server-auth-delegate'

    meta:
      credential: [CREDENTIAL_NAME]
      secret    : ${SECRET}
      expiresIn : ${EXPIRATION_DATE} # example: 10m

    [CREDENTIAL_NAME]:
      appScope    : ${APP_SOCPE}
      userKey     : ${USER_KEY}
      passwordKey : ${PASSWORD_KEY}
      subjectKey  : ${SUBJECT_KEY}
      userScopeKey: ${USER_SCOPE_KEY}
      hash        : ${HASH_ALGORITHM} # example: sha1
```
