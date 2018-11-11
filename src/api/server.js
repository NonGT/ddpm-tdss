import restify from 'restify';
import RestifyOAuthServer from 'restify-oauth-server';
import corsMiddleware from 'restify-cors-middleware';
import dotenv from 'dotenv';

import logger from '../services/logger';
import AuthModel from '../models/auth-model';
import registerRoutes from './routes';

if (dotenv) {
  dotenv.config();
}

const SERVER_PORT = Number(process.env.SERVER_PORT || 5000);
const TOKEN_LIFE_TIME = Number(process.env.TOKEN_LIFE_TIME || '86400');

const cors = corsMiddleware({
  preflightMaxAge: 5,
  origins: ['*'],
  allowHeaders: ['Authorization'],
});

const server = restify.createServer({
  name: 'rest-api',
  version: '0.0.1',
});

server.oauth = new RestifyOAuthServer({
  model: new AuthModel(server),
  grants: ['password'],
  accessTokenLifetime: TOKEN_LIFE_TIME,
});

server.pre(cors.preflight);

server.use(cors.actual);
server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());
server.use(restify.plugins.authorizationParser());

// Node Oauth2 Server expects the token request to be
// x-www-url-formencoded according to the Oauth2 spec
// Restify's body parser puts formencoded params in req.params,
// so we'll need a quick little bit of middleware to copy them over to the body
server.use((req, res, next) => {
  if (req.headers['content-type'] === 'application/x-www-url-formencoded') {
    req.body = req.params;
  }
  return next();
});

registerRoutes(server);

server.listen(SERVER_PORT, () => {
  logger.log({
    level: 'info',
    message: `${server.name} is listening at ${server.url}`,
  });
});

server.on('restifyError', (req, _, err, cb) => {
  if (!err.handled) {
    req.log.error(err);
    logger.log({
      level: 'error',
      message: err.stack,
    });
  }
  return cb();
});

const cleanUp = (err) => {
  if (err && !['SIGINT', 'SIGUSR1', 'SIGUSR2'].includes(err)) {
    logger.log({
      level: 'error',
      message: err.stack,
    });
  }

  logger.log({
    level: 'info',
    message: `${server.name} is closed`,
  });

  process.exit();
};

// catches ctrl+c event
process.on('SIGINT', cleanUp.bind(null));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', cleanUp.bind(null));
process.on('SIGUSR2', cleanUp.bind(null));
process.on('uncaughtException', cleanUp.bind(null));

export default server;
