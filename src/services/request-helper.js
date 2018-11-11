export default class RequestHelper {
  static parseResponse(response) {
    if (!response || !response.body) {
      return null;
    }

    return response.body;
  }
}
