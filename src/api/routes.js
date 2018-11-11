import TdssModel from '../models/tdss-model';

export default function registerRoutes(server) {
  // Get oauth2 token (login).
  server.post('/api/v1/user/login', server.oauth.token());

  // Get current login user.
  server.get('/api/v1/user/whoami', server.oauth.authenticate(), async (req, res, next) => {
    const { model } = server.oauth.server.options;
    const { user } = await model.getAccessToken(req.authorization.credentials) || {};

    if (!user) {
      res.status(404);
      return;
    }

    // Don't expose password and salt.
    delete user.password;
    delete user.salt;
    res.send(user);

    next();
  });

  server.post('/api/v1/user/logout', server.oauth.authenticate(), async (req, res, next) => {
    const { model } = server.oauth.server.options;
    const { user } = await model.getAccessToken(req.authorization.credentials) || {};

    if (!user) {
      res.status(200);
      return;
    }

    await model.deleteStaleTokens(user.id);
    res.status(200);

    res.send();
    next();
  });

  server.get('/api/v1/bulletin/search', server.oauth.authenticate(), async (req, res, next) => {
    const tdssModel = new TdssModel(server);
    try {
      const response = await tdssModel.searchBulletin(req.query);
      res.send(response);
    } catch (e) {
      next(e);
      return;
    }

    next();
  });
}
