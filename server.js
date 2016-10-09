'use strict'

/**
 * Module dependencies.
 */
const
  express = require('express'),
  compression = require('compression'),
  session = require('express-session'),
  bodyParser = require('body-parser'),
  logger = require('morgan'),
  chalk = require('chalk'),
  errorHandler = require('errorhandler'),
  lusca = require('lusca'),
  dotenv = require('dotenv'),
  MongoStore = require('connect-mongo')(session),
  flash = require('express-flash'),
  path = require('path'),
  mongoose = require('mongoose'),
  passport = require('passport'),
  expressValidator = require('express-validator'),
  sass = require('node-sass-middleware'),
  multer = require('multer'),
  upload = multer({ dest: path.join(__dirname, 'uploads') }),
  mail = require('./features/mail');
/**
 * Load environment letiables from .env file, where API keys and passwords are configured.
 */
dotenv.load({ path: '.env.example' });
/**
 * Controllers (route handlers).
 */
const
  apiController = require('./controllers/api'),
  builder = require('./core/'),
  contactController = require('./controllers/contact'),
  homeController = require('./controllers/home'),
  carousel = require('./utils/carousel'),
  passportConfig = require('./config/passport'),
  payloads = require('./config/payloads'),
  platforms = require('./utils/platforms'),
  replies = require('./utils/replies'),
  userController = require('./controllers/user');

let
  brain = require('./rive/rive'),
  timeout;

brain.load(() => {
  console.log('%s Brain Loaded!', chalk.green('✓'));
  connectToMongo();
  configureExpress();
}, (error) => {
  console.log('%s Brain Loaded Failed', chalk.red('✓'), error);
})

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
  app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET,
    store: new MongoStore({
      url: process.env.MONGODB_URI,
      autoReconnect: true
    })
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(flash());
  app.use((req, res, next) => {
    if (req.path === '/api/upload'
      || req.path === '/api/messages'
      || req.path === '/api/subscribe'
      || req.path === '/api/sendMail') {
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

  // app.get('/api/list', function(req, res) {
  //   mail.getAllLists("631957", res)
  // });

  app.post('/api/subscribe', function (req, res) {
    if (!req.body) {
      let responseBody = new Object();
      responseBody.success = false;
      responseBody.message = "Invalid request";
      res.end(JSON.stringify(responseBody));
      return;
    }
    let email = req.body.email;
    mail.createRecepient(email, res);
  });
  app.post('/api/sendMail', function (req, res) {
    if (!req.body) {
      let responseBody = new Object();
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

  let dialogVersionOptions = {
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

  bot.dialog('/firstRun', firstRun);
  bot.dialog('/', onMessage);
}

/**
 * Send a greeting message for each specific platform
 * Add the user to the mongodb database if the user does not exist
 */
function firstRun(session) {
  console.log('This user is running our bot the first time')
  platforms.greet(session);
  userController.addBotUser(session);
  reply(session)
  session.endDialog()
}

/**
 * Add the user to the mongodb database if the user does not exist
 */
function onMessage(session) {
  console.log('This user is running our bot the subsequent time')
  userController.addBotUser(session);
  reply(session)
}

/**
 * Generate a reply from the brain
 * We also handle incoming PAYLOADS that are generated as a result of clicking quick replies on facebook
 * PAYLOAD_FACEBOOK_GET_STARTED => Triggered when the user hits the get started button on facebook
 * PAYLOAD_FACEBOOK_PERSISTENT_MENU_HELP => Triggered when the user hits the persistent menu help button 
 * PAYLOAD_FACEBOOK_FLIPKART_SHOW_MORE => Triggered when the user hits the show more quick reply button on flipkart offers
 * PAYLOAD_FACEBOOK_FLIPKART_CANCEL => Triggered when the user hits the no quick reply button on flipkart offers
 * Handle special cases inside the catch block such as carousel, since we rejected them from all.js.
 * If the results generated by any feature is not a string in all.js we reject the Object as brain.rive does not let you resolve custom objects
 */
function reply(session) {
  const userId = session.message.user.id
  let text;

  switch (session.message.text) {
    case payloads.FACEBOOK_GET_STARTED:
      text = 'get started'
      break;

    case payloads.FACEBOOK_PERSISTENT_MENU_HELP:
      text = 'help'
      break;

    case payloads.FACEBOOK_FLIPKART_SHOW_MORE:
      text = 'show more'
      break;

    case payloads.FACEBOOK_FLIPKART_CANCEL:
      text = 'no'
      break;

    default:
      text = session.message.text;
  }
  brain.reply(userId, text)
    .then((response) => {
      session.send(response);
    })
    .catch((response) => {
      if (response && response.type === 'carousel') {
        carousel.sendFlipkartCarousel(session, brain, response.data, response.filters)

        //update the last active time when the user viewed flipkart results
        session.userData.flipkart.lastActive = new Date().getTime();

        //if we havent set a timeout previously, we set one
        if (!timeout) {
          timeout = setInterval(() => {
            let currentTime = new Date().getTime();
            if (currentTime - session.userData.flipkart.lastActive > 30000) {

              //send the quick reply asking the user if they would like to see more results
              platforms.sendQuickReply(session, require('./json/quick_reply_flipkart_show_more.json'))
              clearInterval(timeout)

              //unset the timeout variable so that the person can see the quick reply once again after the next request to view flipkart carousel
              timeout = null;
            }
          }, 30000)
        }
      }
      else {
        session.send(response);
      }
    })
}

module.exports = app;
