const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  _id: { type: String, required: true, unique: true },
  email: { type: String, unique: true },

  address: {
    id: { type: String, required: true, unique: true },
    channelId: String,
    user: {
      id: String,
      name: String
    },
    conversation: {
      isGroup: Boolean,
      id: String,
      name: String
    },
    bot: {
      id: String,
      name: String
    },
    serviceUrl: String,
    useAuth: Boolean
  },
  password: String,
  passwordResetToken: String,
  passwordResetExpires: Date,

  facebook: String,
  twitter: String,
  google: String,
  github: String,
  instagram: String,
  linkedin: String,
  steam: String,
  tokens: Array,

  profile: {
    firstName: String,
    lastName: String,
    gender: String,
    location: { type: String },
    lat: { type: Number },
    lon: { type: Number },
    picture: String,
    timezone: {type: Number},
    website: String
  }
}, { timestamps: true });

/**
 * Password hash middleware.
 */
userSchema.pre('save', function (next) {
  const user = this;
  if (!user.isModified('password')) { return next(); }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) { return next(err); }
    bcrypt.hash(user.password, salt, null, (err, hash) => {
      if (err) { return next(err); }
      user.password = hash;
      next();
    });
  });
});

/**
 * Helper method for validating user's password.
 */
userSchema.methods.comparePassword = function (candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    cb(err, isMatch);
  });
};

/**
 * Helper method for getting user's gravatar.
 */
userSchema.methods.gravatar = function (size) {
  size = size || 200
  if (!this.email) {
    return `https://gravatar.com/avatar/?s=${size}&d=retro`;
  }
  const md5 = crypto.createHash('md5').update(this.email).digest('hex');
  return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
