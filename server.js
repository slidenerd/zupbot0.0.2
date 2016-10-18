'use strict'

/**
 * Module dependencies.
 */
const
  bodyParser = require('body-parser'),
  chalk = require('chalk'),
  compression = require('compression'),
  dotenv = require('dotenv'),
  errorHandler = require('errorhandler'),
  express = require('express'),
  expressValidator = require('express-validator'),
  flash = require('express-flash'),
  logger = require('morgan'),
  lusca = require('lusca'),
  mail = require('./features/mail'),
  mongoose = require('mongoose'),
  multer = require('multer'),
  passport = require('passport'),
  path = require('path'),
  sass = require('node-sass-middleware'),
  session = require('express-session'),
  MongoStore = require('connect-mongo')(session),
  upload = multer({ dest: path.join(__dirname, 'uploads') });

/**
 * Load environment letiables from .env file, where API keys and passwords are configured.
 */
dotenv.load({ path: '.env.example' });
/**
 * Controllers (route handlers).
 */
const
  all = require('./features/all'),
  analytics = require('./utils/analytics'),
  apiController = require('./controllers/api'),
  brain = require('./bot/rive'),
  builder = require('./core/'),
  carousel = require('./utils/carousel'),
  contactController = require('./controllers/contact'),
  flipkart = require('./features/flipkart'),
  homeController = require('./controllers/home'),
  ola = require('./features/ola'),
  passportConfig = require('./config/passport'),
  payloads = require('./config/payloads'),
  platforms = require('./utils/platforms'),
  replies = require('./utils/replies'),
  ride = require('./features/ride'),
  userController = require('./controllers/user');

console.log('%s App Initiated!', chalk.green('✓'));

/**
 * Create Express server.
 */
const app = express();

/**
 * Connect to MongoDB.
 */


mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on('connected', () => {
  console.log('%s MongoDB connection established!', chalk.green('✓'));
});
mongoose.connection.on('error', (error) => {
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'), error);
});
// If the Node process ends, close the Mongoose connection
process.on('SIGINT', exitDatabase).on('SIGTERM', exitDatabase);



function exitDatabase() {
  mongoose.connection.close(function () {
    console.log('mongoose disconnected because of SIGINT or SIGTERM');
    process.exit(0);
  });
}

/**
 * Express configuration.
 */
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
    || req.path === '/api/sendMail'
    || req.path === '/hooks/ola'
    || req.path === '/api/ride'
    || req.path === '/api/ride/book'
    || req.path === '/api/ride/price'
    || req.path === '/api/ride/status'
    || req.path === '/api/ride/receipt'
    || req.path === '/auth/ola/callback'
    || req.path === '/auth/uber/callback') {
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
/**
 * Webhooks
 */
app.post('/hooks/ola', ola.webhook)
app.get('/api/ride', ride.ride);
app.get('/api/ride/status', ride.status);
app.get('/api/ride/receipt', ride.receipt);
app.get('/api/ride/price', ride.price);
app.get('/api/ride/book', ride.bookRide);
app.get('/auth/ola/callback', ride.ola.authorization);
app.get('/auth/uber/callback', function (req, res) {
  ride.authorize('uber', req, res);
});

app.get('/api/airfare', function (req, res) {
  skyscanner.fetchFlightDetails(req, res);
});

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

brain.load(() => {
  runCron();
  app.listen(app.get('port'), () => {
    console.log('%s Express server listening on port %d in %s mode after brain load ', chalk.green('✓'), app.get('port'), app.get('env'));
  });
}, (error) => {
  console.log('%s Brain Loaded Failed', chalk.red('✓'), error);
})

// Create chat bot
const connector = new builder.ChatConnector({
  appId: process.env.APP_ID,
  appPassword: process.env.APP_PASSWORD
});
const bot = new builder.UniversalBot(connector);

//=========================================================
// Bots Middleware
//=========================================================

// Anytime the major version is incremented any existing conversations will be restarted.

app.post('/api/messages', connector.listen());
let dialogVersionOptions = {
  version: 4,
  resetCommand: /^reset/i
};
bot.use(builder.Middleware.dialogVersion(dialogVersionOptions));

//=========================================================
// Bots Dialogs
//=========================================================

//Run this dialog the very first time for a particular user
bot.use(builder.Middleware.firstRun({
  version: 4,
  dialogId: '/firstRun',
  upgradeDialogId: '/onUpgrade',
  upgradeDialogArgs: 'My brain size increased by another gram :) Now I can get you an uber cab or awesome offers from flipkart. All you gotta do is type \'help\''
}));

bot.dialog('/firstRun', firstRun);
bot.dialog('/', onMessage);

/**
 * Send a greeting message for each specific platform
 * Add the user to the mongodb database if the user does not exist
 */
function firstRun(session) {
  console.log('This user is running our bot the first time')
  createUser(session)
  platforms.firstRun(session);
  userController.addBotUser(session);
  reply(session)
  session.endDialog()
}

/**
 * Add the user to the mongodb database if the user does not exist
 */
function onMessage(session) {
  console.log('This user is running our bot the subsequent time')
  reply(session)
}

function reply(session) {
  const userId = session.message.user.id
  const text = all.preprocessReplies(session, brain);
  analytics.trackIncoming(session.message.user.id, text, session.message.address.channelId);
  brain.reply(userId, text)
    .then((response) => {
      all.handleSpecialRepliesOnResolve(session, brain, response)
    })
    .catch((response) => {
      all.handleSpecialRepliesOnReject(session, brain, response)
    })
}

function onUpgrade(session, args) {
  session.send(args)
}

function runCron() {
  console.log('%s Init Cron Jobs', chalk.green('✓'));
  // all.runCron();
  // setTimeout(runCron, 200000)
}

function createUser(session) {
  //Add a dummy email address since we dont have one for bot users
  session.userData.user = {
    _id: session.message.user.id,
    //Replace all the - symbols in UUID to generate a plain string
    email: session.message.user.id + session.message.address.channelId + '@zup.chat',
    address: {
      id: session.message.address.id,
      channelId: session.message.address.channelId,
      user: {
        id: session.message.address.user.id,
        name: session.message.address.user.name
      },
      conversation: {
        isGroup: session.message.address.conversation.isGroup,
        id: session.message.address.conversation.id,
        name: session.message.address.conversation.name
      },
      bot: {
        id: session.message.address.bot.id,
        name: session.message.address.bot.name
      },
      serviceUrl: session.message.address.serviceUrl,
      useAuth: session.message.address.useAuth
    },
    flipkart: {
      page: {
        start: 0
      },
      filters: {

      }
    },
    profile: {
      firstName: session.message.user.name
    }
  }
}

module.exports = app;
