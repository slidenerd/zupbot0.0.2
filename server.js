/**
 * Module dependencies.
 */
const express = require('express');
const compression = require('compression');
const session = require('express-session');
const bodyParser = require('body-parser');
const logger = require('morgan');
const chalk = require('chalk');
const errorHandler = require('errorhandler');
const lusca = require('lusca');
const dotenv = require('dotenv');
const MongoStore = require('connect-mongo')(session);
const flash = require('express-flash');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const expressValidator = require('express-validator');
const sass = require('node-sass-middleware');
const multer = require('multer');
const upload = multer({ dest: path.join(__dirname, 'uploads') });
const mail = require('./features/mail');
/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.load({ path: '.env.example' });

/**
 * Controllers (route handlers).
 */
const homeController = require('./controllers/home');
const userController = require('./controllers/user');
const apiController = require('./controllers/api');
const contactController = require('./controllers/contact');
const platforms = require('./utils/platforms');

const builder = require('./core/');
const messageutils = require('./utils/messageutils')
const replies = require('./utils/replies')
const ola = require('./features/ola')
const uber = require('./features/uber')

brain = require('./rive/rive');
brain.load(() => {
  console.log("Brain Loaded");
  // connectToMongo();
  configureExpress();
}, () => {
  console.log("Brain Load error");
})

/**
 * API keys and Passport configuration.
 */
const passportConfig = require('./config/passport');
/**
 * Create Express server.
 */
const app = express();

/**
 * Connect to MongoDB.
 */

function connectToMongo() {
  mongoose.connect(process.env.MONGODB_URI);
  mongoose.connection.on('connected', () => {
    console.log('%s MongoDB connection established!', chalk.green('✓'));
  });
  mongoose.connection.on('error', (error) => {
    console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'), error);
  });
  // If the Node process ends, close the Mongoose connection
  process.on('SIGINT', exitDatabase).on('SIGTERM', exitDatabase);
}


function exitDatabase() {
  mongoose.connection.close(function () {
    console.log('mongoose disconnected because of SIGINT or SIGTERM');
    process.exit(0);
  });
}

/**
 * Express configuration.
 */
function configureExpress() {
  app.set('port', process.env.PORT || 3000);
  app.set('views', path.join(__dirname, 'views'));
  // app.set('view engine', 'pug');
  app.use(compression());
  app.use(sass({
    src: path.join(__dirname, 'public'),
    dest: path.join(__dirname, 'public')
  }));
  app.use(logger('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(expressValidator());
  app.set('view engine', 'ejs');
  app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET,
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(flash());
  app.use((req, res, next) => {
    if (req.path === '/api/upload' || req.path === '/api/messages' || req.path === '/api/subscribe' || req.path === '/api/sendMail') {
      next();
    } else {
      lusca.csrf()(req, res, next);
    }
  });
  app.use(lusca.xframe('SAMEORIGIN'));
  app.use(lusca.xssProtection(true));
  app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
  });
  app.use(function (req, res, next) {
    // After successful login, redirect back to the intended page
    if (!req.user &&
      req.path !== '/login' &&
      req.path !== '/signup' &&
      !req.path.match(/^\/auth/) &&
      !req.path.match(/\./)) {
      req.session.returnTo = req.path;
    }
    next();
  });
  app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));

  /**
   * Primary app routes.
   */
  app.get('/', homeController.index);
  app.get('/login', userController.getLogin);
  app.post('/login', userController.postLogin);
  app.get('/logout', userController.logout);
  app.get('/forgot', userController.getForgot);
  app.post('/forgot', userController.postForgot);
  app.get('/reset/:token', userController.getReset);
  app.post('/reset/:token', userController.postReset);
  app.get('/signup', userController.getSignup);
  app.post('/signup', userController.postSignup);
  app.get('/contact', contactController.getContact);
  app.post('/contact', contactController.postContact);
  app.get('/account', passportConfig.isAuthenticated, userController.getAccount);
  app.post('/account/profile', passportConfig.isAuthenticated, userController.postUpdateProfile);
  app.post('/account/password', passportConfig.isAuthenticated, userController.postUpdatePassword);
  app.post('/account/delete', passportConfig.isAuthenticated, userController.postDeleteAccount);
  app.get('/account/unlink/:provider', passportConfig.isAuthenticated, userController.getOauthUnlink);

  /**
   * API examples routes.
   */
  app.get('/api', apiController.getApi);
  app.get('/api/lastfm', apiController.getLastfm);
  app.get('/api/nyt', apiController.getNewYorkTimes);
  app.get('/api/aviary', apiController.getAviary);
  app.get('/api/steam', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getSteam);
  app.get('/api/stripe', apiController.getStripe);
  app.post('/api/stripe', apiController.postStripe);
  app.get('/api/scraping', apiController.getScraping);
  app.get('/api/twilio', apiController.getTwilio);
  app.post('/api/twilio', apiController.postTwilio);
  app.get('/api/clockwork', apiController.getClockwork);
  app.post('/api/clockwork', apiController.postClockwork);
  app.get('/api/foursquare', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getFoursquare);
  app.get('/api/tumblr', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getTumblr);
  app.get('/api/facebook', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getFacebook);
  app.get('/api/github', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getGithub);
  app.get('/api/twitter', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getTwitter);
  app.post('/api/twitter', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.postTwitter);
  app.get('/api/linkedin', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getLinkedin);
  app.get('/api/instagram', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getInstagram);
  app.get('/api/paypal', apiController.getPayPal);
  app.get('/api/paypal/success', apiController.getPayPalSuccess);
  app.get('/api/paypal/cancel', apiController.getPayPalCancel);
  app.get('/api/lob', apiController.getLob);
  app.get('/api/upload', apiController.getFileUpload);
  app.post('/api/upload', upload.single('myFile'), apiController.postFileUpload);
  app.get('/api/pinterest', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getPinterest);
  app.post('/api/pinterest', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.postPinterest);
  app.get('/api/google-maps', apiController.getGoogleMaps);

  /**
   * OAuth authentication routes. (Sign in)
   */
  app.get('/auth/instagram', passport.authenticate('instagram'));
  app.get('/auth/instagram/callback', passport.authenticate('instagram', { failureRedirect: '/login' }), (req, res) => {
    res.redirect(req.session.returnTo || '/');
  });
  app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'user_location'] }));
  app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), (req, res) => {
    res.redirect(req.session.returnTo || '/');
  });
  app.get('/auth/github', passport.authenticate('github'));
  app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), (req, res) => {
    res.redirect(req.session.returnTo || '/');
  });
  app.get('/auth/google', passport.authenticate('google', { scope: 'profile email' }));
  app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    res.redirect(req.session.returnTo || '/');
  });
  app.get('/auth/twitter', passport.authenticate('twitter'));
  app.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/login' }), (req, res) => {
    res.redirect(req.session.returnTo || '/');
  });
  app.get('/auth/linkedin', passport.authenticate('linkedin', { state: 'SOME STATE' }));
  app.get('/auth/linkedin/callback', passport.authenticate('linkedin', { failureRedirect: '/login' }), (req, res) => {
    res.redirect(req.session.returnTo || '/');
  });

  /**
   * OAuth authorization routes. (API examples)
   */
  app.get('/auth/foursquare', passport.authorize('foursquare'));
  app.get('/auth/foursquare/callback', passport.authorize('foursquare', { failureRedirect: '/api' }), (req, res) => {
    res.redirect('/api/foursquare');
  });
  app.get('/auth/tumblr', passport.authorize('tumblr'));
  app.get('/auth/tumblr/callback', passport.authorize('tumblr', { failureRedirect: '/api' }), (req, res) => {
    res.redirect('/api/tumblr');
  });
  app.get('/auth/steam', passport.authorize('openid', { state: 'SOME STATE' }));
  app.get('/auth/steam/callback', passport.authorize('openid', { failureRedirect: '/login' }), (req, res) => {
    res.redirect(req.session.returnTo || '/');
  });
  app.get('/auth/pinterest', passport.authorize('pinterest', { scope: 'read_public write_public' }));
  app.get('/auth/pinterest/callback', passport.authorize('pinterest', { failureRedirect: '/login' }), (req, res) => {
    res.redirect('/api/pinterest');
  });

  app.get('/api/ride', function(req, res) {
    var data = {};
    var callback = function(data) {
        res.render('map/index', data);
    }
    ola.getRideEstimate('124, 4th cross, viswapriya layout, begur, bangalore 58', 
        '785, 100 feet outer rind road, jp nagar 6th phase, bangalore-78', 
        (resObj) => {
            data.ola = resObj;
            if(data.hasOwnProperty("uber")) {
                callback(data);
            }
        }
    );

    uber.getRideEstimate('124, 4th cross, viswapriya layout, begur, bangalore 58', 
        '785, 100 feet outer rind road, jp nagar 6th phase, bangalore-78', 
        (resObj) => {
            data.uber = resObj;
            if(data.hasOwnProperty("ola")) {
                callback(data);
            }
        }
    );
  });

  app.post('/api/subscribe', function (req, res) {
    if (!req.body) {
      var responseBody = new Object();
      responseBody.success = false;
      responseBody.message = "Invalid request";
      res.end(JSON.stringify(responseBody));
      return;
    }
    var email = req.body.email;
    mail.createRecepient(email, res);
  });
  app.post('/api/sendMail', function (req, res) {
    if (!req.body) {
      var responseBody = new Object();
      responseBody.success = false;
      responseBody.message = "Invalid request";
      res.end(JSON.stringify(responseBody));
      return;
    }
    mail.sendMail(req, res);
  });

  /**
   * Error Handler.
   */
  app.use(errorHandler());

  /**
   * Start Express server.
   */
  app.listen(app.get('port'), () => {
    console.log('%s Express server listening on port %d in %s mode.', chalk.green('✓'), app.get('port'), app.get('env'));
  });

  // Create chat bot
  const connector = new builder.ChatConnector({
    appId: process.env.APP_ID,
    appPassword: process.env.APP_PASSWORD
  });
  const bot = new builder.UniversalBot(connector);
  app.post('/api/messages', connector.listen());

  //=========================================================
  // Bots Middleware
  //=========================================================

  // Anytime the major version is incremented any existing conversations will be restarted.

  var dialogVersionOptions = {
    version: 1.0,
    resetCommand: /^reset/i
  };
  bot.use(builder.Middleware.dialogVersion(dialogVersionOptions));

  //=========================================================
  // Bots Dialogs
  //=========================================================

  //Run this dialog the very first time for a particular user
  bot.use(builder.Middleware.firstRun({
    version: 1.0,
    dialogId: '/firstRun'
  }));

  bot.dialog('/firstRun', [firstRun]);
  bot.dialog('/', onMessage);
  /**
   * Dialog that handles displaying a carousel on Flipkart
   */
  bot.dialog('/carousel', (session, args) => {
    messageutils.sendFlipkartCarousel(session, args.data, args.filters)
    session.endDialog();
  })
}
/**
 * When the brains are loading, ideally the reply should be sent first and 
 * then the brain should be loaded. This can be achieved with a setTimeout method 
 * session.send has a delay option of 250ms after which all messages are queued and sent
 * Refer https://github.com/Microsoft/BotBuilder/blob/master/Node/core/src/Session.ts for delay
 */
function firstRun(session) {
  platforms.greet(session);
  //If the user wasnt added before, add the user
  userController.addBotUser(session);
  handleWithBrains(session)
  console.log('first run')
  session.endDialog()
}

function onMessage(session) {
  //If the user wasnt added before, add the user
  userController.addBotUser(session);
  console.log('subsequent run')
  handleWithBrains(session)
}

function handleWithBrains(session) {
  if (!brain.isLoaded()) {
    //Send the user ID to track variables for each user

    brain.load(session.message.user.id, () => {
      //Reply once the brain has been loaded
      reply(session)
    }, () => {

      //Notify the user of any errors that may occur if the brain loading fails
      const error = replies.getBrainLoadingFailed()
      session.send(error)
    })
  }
  else {
    //Reply if the brains were loaded previously
    reply(session)
  }
}

/**
 * Generate a reply from the brain
 */
function reply(session) {
  brain.reply(session.message.user.id, session.message.text)
    .then((response) => {
      session.send(response);
    })
    .catch((response) => {

      //Handle special cases here such as carousel, we rejected them from all.js as rive doesnt handle custom objects resolved through its Promise
      if (response && response.type === 'carousel') {
        messageutils.sendFlipkartCarousel(session, brain.riveScript, response.data, response.filters)
      }
      else {
        session.send(response);
      }
    })
}
module.exports = app;
