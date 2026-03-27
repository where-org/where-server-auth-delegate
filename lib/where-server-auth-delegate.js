import crypto from 'crypto';

const auth = async (config, where, app) => {

  const { defaultScope, credential } = config,
        { appScope, userKey, passwordKey, subjectKey, userScopeKey, hash, extraPayload = {} } = credential;

  const auth = {

    authenticate: async (ref, user, password) => {

      const hashedPassword = hash ? crypto.createHash(hash).update(password, 'utf8').digest('hex') : password;

      const condition = {
        where: {
          [userKey]: user
        }
      };

      const users = await app.get(ref, appScope, condition),
            [userData] = users.filter(v => v[passwordKey] && v[passwordKey] === hashedPassword);

      if (!userData) {
        return false;
      }

      // subject required
      return { subject: userData[subjectKey], ...userData };

    },

    authorize: async (subject, userData) => {

      const { [userScopeKey]: scope } = userData;

      const optionalUserData = Object.entries(extraPayload).reduce(
        (o, [k1, k2]) => (userData[k2] ? { ...o, [k1]: userData[k2] } : o), {}
      );

      // scope required
      return { scope: scope ? scope.split(',') : defaultScope, ...optionalUserData };

    },

  };

  return auth;

}

export { auth };


      //const result = authenticatedUserData ? true : false;
      // subject to scope ha hissu

      //const { [subjectColumn]: subject, [scopeColumn]: scope } = authenticatedUserData,
            //userData = expandedData || { ...authenticatedUserData, subject, [scopeColumn]: scope ? scope.split(',') : defaultScope };

      //return expandedData
        //: { subject: expandedData[subjectColumn] , ...(expandedData) }
        //? { subject: userData[subjectColumn] , ...(userData) };

      /*
      return fasle;

      return {
        subject: required,

        optional data

      };
      */


    //authorize: async (subject, userData) => {
    //authorize: async (userData) => {


      // subject to scope ha hissu
      // return claim

      /*
      return fasle;

      return {
        scope: required,

        optional data

      };
      */

    //},

  //};

