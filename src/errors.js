
export default class Errors {
    static UNKNOWN               = { id:  0, code: 500, message: 'Unknown server error'                           };
    //Authenticate
    static AUTH_MISSING_HEADER   = { id: 10, code: 401, message: 'Missing authentication header'                  };
    static AUTH_MISSING_TOKEN    = { id: 11, code: 401, message: 'Missing authentication token'                   };
    static AUTH_UNVERIFIED_TOKEN = { id: 12, code: 403, message: 'Unverified token'                               };
    //Register
    static REG_MISSING           = { id: 20, code: 400, message: 'Missing username, password and/or email'        };
    static REG_USER_EXISTS       = { id: 21, code: 400, message: 'User with username and/or email already exists' };
    static REG_HASH_FAILED       = { id: 22, code: 500, message: 'Missing username, password and/or email'        };
    //Login
    static LOGIN_MISSING         = { id: 30, code: 400, message: 'Missing username and/or password'               };
    static LOGIN_WRONG           = { id: 31, code: 400, message: 'Wrong username and/or password'                 };
}
