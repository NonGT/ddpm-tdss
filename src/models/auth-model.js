// Base on this doc: https://oauth2-server.readthedocs.io/en/latest/model/spec.html#model-specification

import bcrypt from 'bcrypt';
import moment from 'moment';
import requestHelper from '../services/request-helper';
import BaseModel from './base-model';
import logger from '../services/logger';

export default class AuthModel extends BaseModel {
  constructor(server) {
    super(server);

    this.logger = logger;
    this.getAccessToken = this.getAccessToken.bind(this);
    this.getClient = this.getClient.bind(this);
    this.saveToken = this.saveToken.bind(this);
    this.getUser = this.getUser.bind(this);
  }

  async getAccessToken(bearerToken) {
    this.logger.warn(`TODO: Using mock data for bearerToken: ${bearerToken}`);
    const response = {
      body: [{
        accessToken: bearerToken,
        accessTokenExpiresAt: moment(new Date()).add(1, 'day').toDate(),
        client: {
          id: 'dss',
          grants: ['read'],
          accessTokenLifetime: 86400,
          refreshTokenLifetime: 86400,
        },
        user: {
          id: 1,
          email: 'dss@disaster.go.th',
          username: 'dss',
          password: 'password',
          salt: 'salt',
        },
      }],
    };

    const userTokens = requestHelper.parseResponse(response);
    if (!userTokens || !userTokens.length) {
      return null;
    }

    const userToken = userTokens[0];
    if (userToken.accessTokenExpiresAt <= new Date()) {
      return null;
    }

    return userToken;
  }

  async saveToken(token, client, user) {
    const storeToken = {
      ...token,
      ...{ client, user },
    };

    const json = JSON.stringify(storeToken);

    const userToken = {
      user_id: user.id,
      bearer_token: token.accessToken,
      access_token: json,
      expire: token.accessTokenExpiresAt,
    };

    this.bearerToken = userToken;
    this.logger.warn('TODO: Stores userToken', userToken);

    return storeToken;
  }

  async deleteStaleTokens(userId) {
    delete this.bearerToken;
    this.logger.warn('TODO: Delete userToken by userId', userId);
  }

  async getClient(clientId, clientSecret) {
    this.logger.warn(`TODO: Using mock data for clientId: ${clientId} and clientSecret: ${clientSecret}`);
    const response = {
      body: [{
        id: clientId,
        active: true,
      }],
    };

    const clients = requestHelper.parseResponse(response);
    if (!clients || !clients.length) {
      return null;
    }

    const client = clients[0];
    return {
      ...client,
      ...{ grants: ['password'] },
    };
  }

  async getUser(username, password) {
    this.logger.warn(`TODO: Using mock data for username: ${username} and password: ${password}`);
    const response = {
      body: [{
        email: 'dss@disaster.go.th',
        username: 'dss',
        password: 'password',
        salt: 'salt',
        user_type: 'user',
        active: true,
      }],
    };

    const users = requestHelper.parseResponse(response);
    if (!users || !users.length) {
      return null;
    }

    const user = users[0];
    const hashed = await bcrypt.hash(password, user.salt);
    if (user.password !== hashed) {
      return null;
    }

    return user;
  }
}
