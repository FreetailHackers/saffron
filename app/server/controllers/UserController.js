var _ = require('underscore');
var User = require('../models/User');
var Mailer = require('../services/email');

var validator = require('validator');
var moment = require('moment');

var UserController = {};

var maxTeamSize = process.env.TEAM_MAX_SIZE || 4;


// Tests a string if it ends with target s
function endsWith(s, test){
  return test.indexOf(s, test.length - s.length) !== -1;
}

/**
 * Determine whether or not a user can register.
 * @param  {String}   email    Email of the user
 * @param  {Function} callback args(err, true, false)
 * @return {[type]}            [description]
 */
function canRegister(email, password, callback){

  if (!password || password.length < 6){
    return callback({ message: "Password must be 6 or more characters."}, false);
  }
  else {
    return callback(null, true);
  }


}

/**
 * Login a user given a token
 * @param  {String}   token    auth token
 * @param  {Function} callback args(err, token, user)
 */
UserController.loginWithToken = function(token, callback){
  User.getByToken(token, function(err, user){
    return callback(err, token, user);
  });
};

/**
 * Login a user given an email and password.
 * @param  {String}   email    Email address
 * @param  {String}   password Password
 * @param  {Function} callback args(err, token, user)
 */
UserController.loginWithPassword = function(email, password, callback){

  if (!password || password.length === 0){
    return callback({
      message: 'Please enter a password'
    });
  }

  if (!validator.isEmail(email)){
    return callback({
      message: 'Invalid email'
    });
  }

  User
    .findOneByEmail(email)
    .select('+password')
    .exec(function(err, user){
      if (err) {
        return callback(err);
      }
      if (!user) {
        return callback({
          message: "We couldn't find you!"
        });
      }
      if (!user.checkPassword(password)) {
        return callback({
          message: "That's not the right password."
        });
      }

      // yo dope nice login here's a token for your troubles
      var token = user.generateAuthToken();

      var u = user.toJSON();

      delete u.password;

      return callback(null, token, u);
  });
};

/**
 * Create a new user given an email and a password.
 * @param  {String}   email    User's email.
 * @param  {String}   password [description]
 * @param  {Function} callback args(err, user)
 */
UserController.createUser = function(email, password, callback) {

  if (typeof email !== "string"){
    return callback({
      message: "Email must be a string."
    });
  }

  email = email.toLowerCase();


  // Check that there isn't a user with this email already.
  canRegister(email, password, function(err, valid){

    if (err || !valid){
      return callback(err);
    }


    User
      .findOneByEmail(email)
      .exec(function(err, user){
        if (err) {
          return callback(err);
        }

        if (user) {
          return callback({
            message: 'An account for this email already exists.'
          });
        } else {

          // Make a new user
          var u = new User();
          u.email = email;
          u.password = User.generateHash(password);
          u.save(function(err){
            if (err){
              return callback(err);
            } else {
              // yay! success.
              var token = u.generateAuthToken();

              // Send over a verification email
              var verificationToken = u.generateEmailVerificationToken();
              Mailer.sendVerificationEmail(email, verificationToken);

              return callback(
                null,
                {
                  token: token,
                  user: u
                }
              );
            }

          });

        }

    });
  });
};

UserController.getByToken = function (token, callback) {
  User.getByToken(token, callback);
};

/**
 * Get all users.
 * It's going to be a lot of data, so make sure you want to do this.
 * @param  {Function} callback args(err, user)
 */
UserController.getAll = function (callback) {
  User.find({}, callback);
};

/**
 * Get a page of users.
 * @param  {[type]}   page     page number
 * @param  {[type]}   size     size of the page
 * @param  {Function} callback args(err, {users, page, totalPages})
 */
UserController.getPage = function(query, callback){
  var page = query.page;
  var size = parseInt(query.size);
  var searchText = query.text;

  var findQuery = {};
  if (searchText.length > 0){
    var queries = [];
    var re = new RegExp(searchText, 'i');
    queries.push({ email: re });
    queries.push({ 'profile.name': re });
    queries.push({ 'teamCode': re });

    findQuery.$or = queries;
  }

  User
    .find(findQuery)
    .sort({
      'profile.name': 'asc'
    })
    .skip(page * size)
    .limit(size)
    .exec(function (err, users){
      if (err || !users){
        return callback(err);
      }

      User.count(findQuery).exec(function(err, count){

        if (err){
          return callback(err);
        }

        return callback(null, {
          users: users,
          page: page,
          size: size,
          totalPages: Math.ceil(count / size)
        });
      });

    });
};

/**
 * Get a user by id.
 * @param  {String}   id       User id
 * @param  {Function} callback args(err, user)
 */
UserController.getById = function (id, callback){
  User.findById(id, callback);
};

/**
 * Update a user's profile object, given an id and a profile.
 *
 * @param  {String}   id       Id of the user
 * @param  {Object}   profile  Profile object
 * @param  {Function} callback Callback with args (err, user)
 */
UserController.updateProfileById = function (id, profile, callback){

  // Validate the user profile, and mark the user as profile completed
  // when successful.
  User.validateProfile(profile, function(err){

    if (err){
      return callback({message: 'invalid profile'});
    }

    User.findOneAndUpdate({
      _id: id,
      verified: true
    },
      {
        $set: {
          'lastUpdated': Date.now(),
          'profile': profile,
          'status.completedProfile': true
        }
      },
      {
        new: true
      },
      callback);

  });
};


/**
 * Verify a user's email based on an email verification token.
 * @param  {[type]}   token    token
 * @param  {Function} callback args(err, user)
 */
UserController.verifyByToken = function(token, callback){
  User.verifyEmailVerificationToken(token, function(err, email){
    User.findOneAndUpdate({
      email: new RegExp('^' + email + '$', 'i')
    },{
      $set: {
        'verified': true
      }
    }, {
      new: true
    },
    callback);
  });
};

/**
 * Resend an email verification email given a user id.
 */
UserController.sendVerificationEmailById = function(id, callback){
  User.findOne(
    {
      _id: id,
      verified: false
    },
    function(err, user){
      if (err || !user){
        return callback(err);
      }
      var token = user.generateEmailVerificationToken();
      Mailer.sendVerificationEmail(user.email, token);
      return callback(err, user);
  });
};

/**
 * Password reset email
 * @param  {[type]}   email    [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
UserController.sendPasswordResetEmail = function(email, callback){
  User
    .findOneByEmail(email)
    .exec(function(err, user){
      if (err || !user){
        return callback(err);
      }

      var token = user.generateTempAuthToken();
      Mailer.sendPasswordResetEmail(email, token, callback);
    });
};

/**
 * UNUSED
 *
 * Change a user's password, given their old password.
 * @param  {[type]}   id          User id
 * @param  {[type]}   oldPassword old password
 * @param  {[type]}   newPassword new password
 * @param  {Function} callback    args(err, user)
 */
UserController.changePassword = function(id, oldPassword, newPassword, callback){
  if (!id || !oldPassword || !newPassword){
    return callback({
      message: 'Bad arguments.'
    });
  }

  User
    .findById(id)
    .select('password')
    .exec(function(err, user){
      if (user.checkPassword(oldPassword)) {
        User.findOneAndUpdate({
          _id: id
        },{
          $set: {
            password: User.generateHash(newPassword)
          }
        }, {
          new: true
        },
        callback);
      } else {
        return callback({
          message: 'Incorrect password'
        });
      }
    });
};

/**
 * Reset a user's password to a given password, given a authentication token.
 * @param  {String}   token       Authentication token
 * @param  {String}   password    New Password
 * @param  {Function} callback    args(err, user)
 */
UserController.resetPassword = function(token, password, callback){
  if (!password || !token){
    return callback({
      message: 'Bad arguments'
    });
  }

  if (password.length < 6){
    return callback({
      message: 'Password must be 6 or more characters.'
    });
  }

  User.verifyTempAuthToken(token, function(err, id){

    if(err || !id){
      return callback(err);
    }

    User
      .findOneAndUpdate({
        _id: id
      },{
        $set: {
          password: User.generateHash(password)
        }
      }, function(err, user){
        if (err || !user){
          return callback(err);
        }

        Mailer.sendPasswordChangedEmail(user.email);
        return callback(null, {
          message: 'Password successfully reset!'
        });
      });
  });
};

/**
* Push a user's new submission, given an id and a submission.
*
* @param  {String}   id          Id of the user
* @param  {Object}   submission  submission object
* @param  {Function} callback    Callback with args (err, user)
*/
UserController.pushSubmissionById = function (id, submission, callback){
    console.log(submission.title);
    User.findOneAndUpdate({
      _id: id,
    },
    {
      $set: {
        'code': submission.code,
        'title': submission.title
      }
    },
    {
      new: true
    },
    callback);
};
module.exports = UserController;
