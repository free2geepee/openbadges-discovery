const express = require('express');
const clientApp = require('../clientapp');
const api = require('./dummy-api');
const config = require('./lib/config');
const nunjucks = require('nunjucks');
const persona = require('express-persona');
const path = require('path');
const http = require('http');
const middleware = require('./middleware');
const DataStore = require('nedb');
const User = new DataStore();

const DEV_MODE = config('DEV', false);
const PORT = config('PORT', 3000);
const PERSONA_AUDIENCE = config('URL', 'http://localhost:' + PORT);

var app = express();

require('express-monkey-patch')(app);

var staticDir = path.join(__dirname, '../static');
var staticRoot = '/static';

app.use(function (req, res, next) {
  res.locals.static = function static (staticPath) {
    return path.join(app.mountPoint, staticRoot, staticPath);
  };
  next();
});

app.use(express.compress());
app.use(express.bodyParser());
app.use(middleware.session());
app.use(middleware.csrf({ whitelist: ['/api/.*'] }));

app.use(staticRoot, express.static(staticDir, {maxAge: DEV_MODE ? 0 : 86400000}));
app.use('/font-awesome', express.static(path.join(__dirname, '../bower_components/font-awesome')));

var generator;
if (config('GOOGLE_KEY', false)) {
  generator = require('./google-data');
}
else {
  generator = require('./fake-data');
}
app.use('/api', api.createServer({dataGenerator: generator}));

persona(app, {
  audience: PERSONA_AUDIENCE,
  verifyResponse: function (err, req, res, email) {
    if (err) return res.json({
      status: 'failure',
      reason: err
    });

    User.findOne({email: email}, function (err, user) {
      if (err) {
        console.log(err.message);
        return res.json({
          status: 'failure',
          reason: 'Problem encountered getting user ' + email
        });
      }

      function finish(user) {
        req.session.user = user;
        return res.json({
          status: 'okay',
          user: user
        });
      }

      if (!user) {
        User.insert({email: email}, function (err, user) {
          if (err) {
            return res.json({
              status: 'failure',
              reason: 'Problem encountered creating user ' + email
            });
          }
          return finish(user);
        });
      }
      else return finish(user);
    });
  },
  logoutResponse: function (err, req, res) {
    req.session.user = null;
    return res.json({status: 'okay'});
  }
});

var cApp = clientApp(app, {
  developmentMode: config('DEV', false)
});
var clientConfig = middleware.clientConfig(function (req, res) {
  return {
    csrf: req.session._csrf,
    user: req.session.user
  };
});
app.get('*', clientConfig, cApp.html());

if (!module.parent) {
  app.listen(PORT, function(err) {
    if (err) {
      throw err;
    }

    console.log('Persona audience is ' + PERSONA_AUDIENCE + '.');
    console.log('Listening on port ' + PORT + '.');
  });
} else {
  module.exports = http.createServer(app);
}
