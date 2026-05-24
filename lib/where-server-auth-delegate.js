/* auth */
const auth = async (config, where, app) => {

  const { security } = where.common,
        { jwt } = where.auth;

  const credential = await config.requestStaticCredential(),
        { secret, jwtAlgorithm: algorithm, issuer, audience, expiresIn, refreshExpiresIn, ...c } = credential;

  const option = { issuer, audience, expiresIn, refreshExpiresIn };

  const algorithms = algorithm ? [algorithm] : [];

  const accessKey = secret ? await jwt.deriveKey(secret, 'access', algorithm) : undefined,
        refreshKey = secret ? await jwt.deriveKey(secret, 'refresh', algorithm) : undefined;

  const auth  = {

    login: async (ref, user, password) => {

      const hasher = security.hash.create(c.passwordHashAlgorithm);

      const [res] = await app.get(ref, c.table, {

        select: [c.subject, c.user, c.password, c.scope], 
        where: { [c.user]: user },

      }).catch(err => {

        ;;; where.log({ error: err.message });
        return [];

      });

      const authenticatedUser = res &&
        await hasher.verify(res[c.password], password) ? res : false;

      if (!authenticatedUser) {
        return false;
      }

      const sub = authenticatedUser[c.subject],
            scp = authenticatedUser[c.scope];

      const payload = jwt.payload(sub, scp);

      return await jwt.sign(payload, { accessKey, refreshKey }, { ...option, algorithm });

    },

    refresh: async (ref, refreshToken) => {

      const verified = await jwt.verify(refreshToken, refreshKey, { ...option, algorithms}).catch(err => {

        ;;; where.log({ error: err.message });
        return false;

      });

      if (!verified) {
        return false;
      }

      const { sub, exp } = verified;

      const [authenticatedUser] = await app.get(null, c.table, {

        select: [c.subject, c.scope], 
        where: { [c.subject]: sub },

      }).catch(err => {

        ;;; where.log({ error: err.message });
        return [];

      });

      if (!authenticatedUser) {
        return false;
      }

      const payload = jwt.payload(sub, authenticatedUser[c.scope]);

      return await jwt.sign(
        payload, { accessKey, refreshKey }, { ...option, refreshExpiresIn: exp, algorithm },
      );

    },

    verify: async (ref, token) => {

      const { bearer, apiKey } = token;

      if (!(bearer || apiKey)) {
        return false;
      }

      /* bearer */
      if (bearer) {

        const verified = await jwt.verify(bearer, accessKey, {...option, algorithms }).catch(err => {

          ;;; where.log({ error: err.message });
          return false;

        });

        const user = verified
          ? { sub: verified.sub, scp: verified.scp }
          : false;

        return user;
      }

      /* apiKey */

      // bearer only
      if (!c.apiKeyHashAlgorithm && !c.apiKey) {
        ;;; where.log({ error: 'X-API-Key received, but this scope does not accept API keys' });
        return false;
      }

      // hasher
      const hasher = security.hash.create(c.apiKeyHashAlgorithm);

      if (!hasher) {
        throw new where.ConfigurationException(
          `API key auth misconfigured: unsupported or missing apiKeyHashAlgorithm "${c.apiKeyHashAlgorithm}"`
        );
      }

      const [res] = await app.get(null, c.table, {

        select: [c.subject, c.scope, c.apiKey], 

        where: {
          [c.apiKey]: await hasher.hash(apiKey),
        },

      });

      const user = res && await hasher.verify(res[c.apiKey], apiKey)
        ? { sub: res[c.subject], scp: res[c.scope] }
        : false;

      return user;

    },

    //logout: async (ref) => {
    //},

  };

  return auth;

}

export { auth };
