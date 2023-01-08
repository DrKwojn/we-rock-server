
export default class Errors {
    static UNKNOWN               = { id:  0, code: 500, message: 'Unknown server error'                           };
    //Internal
    static DATABASE_FAILURE      = { id:  1, code: 500, message: 'Failed to connect to the database'              };
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
    //File upload
    static FILE_UPLOAD_MISSING   = { id: 41, code: 404, message: 'No file was uploaded'                           };
    static FILE_STORING_FAILED   = { id: 42, code: 500, message: 'Failed to store file'                           };
    static FILE_NO_PROFILE_IMAGE = { id: 43, code: 404, message: 'User has no profile image'                      };
    static FILE_NO_SOUND_CLIP    = { id: 44, code: 404, message: 'User has no sound clip'                         };
}
