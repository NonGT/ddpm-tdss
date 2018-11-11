import defaults from 'superagent-defaults';

export default class BaseModel {
  constructor(server) {
    const upstreamUsername = process.env.UPSTREAM_USERNAME || '';
    const upstreamPassword = process.env.UPSTREAM_PASSWORD || '';

    this.server = server;
    this.upstream = process.env.UPSTREAM_URL || 'http://localhost:3000';

    this.request = defaults();
    this.request.auth(upstreamUsername, upstreamPassword);
  }
}
