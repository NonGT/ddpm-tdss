import puppeteer from 'puppeteer';
import moment from 'moment';
import queryString from 'query-string';
import BaseModel from './base-model';
import logger from '../services/logger';

export default class TdssModel extends BaseModel {
  constructor(server) {
    super(server);

    this.logger = logger;
    this.searchBulletin = this.searchBulletin.bind(this);
  }

  async searchBulletin(query) {
    this.logger.info('Searching bulletine for query', query);

    this.logger.info('Launching browser...');
    const browser = await puppeteer.launch();

    this.logger.info('Start new page...');
    const page = await browser.newPage();

    this.logger.info('Navigating to TDSS website...');
    await page.goto('http://app.facgure.com/login.php');

    try {
      this.logger.info('Attempting to login...');

      this.logger.info('Enter username...');
      await page.type('input[name=username]', this.upstreamUsername);

      this.logger.info('Enter password...');
      await page.type('input[name=password', this.upstreamPassword);

      this.logger.info('Click submit button...');
      await page.click('input[type=submit');
    } catch (e) {
      this.logger.error(e);
    }

    this.logger.info('Waiting for login to be completed...');
    await page.waitForNavigation({
      waitUntil: 'networkidle0',
    });

    this.logger.info('Entering bulletin screen with query...');
    const dateString = query.date || null;
    const dateTime = moment(dateString || new Date());
    const date = dateTime.format('YYYY-MM-DD');
    const time = dateTime.format('HH:mm:ss');
    const latitude = query.latitude || 0;
    const longitude = query.longitude || 0;
    const magnitude = query.magnitude || 0;
    const depth = query.depth || 0;

    const qs = queryString.stringify({
      date,
      time,
      lat: latitude,
      long: longitude,
      magnitude,
      depth,
    });

    await page.goto(`http://app.facgure.com/user-menu/tasks/search.php?${qs}`);

    let hasBulletin = false;

    try {
      this.logger.info('Click first create bulletin button...');
      page.click('#adv_box a[href]');
      hasBulletin = true;
    } catch (e) {
      this.logger.error(e);
    }

    let bulletinItems = null;
    if (hasBulletin) {
      this.logger.info('Waiting for bulletin to be loaded...');
      await page.waitForNavigation({
        waitUntil: 'networkidle0',
      });

      bulletinItems = await page.$eval('#tbl01',
        (element) => {
          const fieldNames = [
            'name',
            'latitude',
            'longitude',
            'elapseTime',
            'amplitude',
          ];

          // Many of ES6 ways are not working here...
          const assign = (obj, fieldName, value) => {
            const final = obj;
            const parts = value.split(' ');
            final[fieldName] = parts[parts.length - 1];
            return final;
          };

          return [].slice.call(element.querySelectorAll('tr'))
            .filter((_, index) => index > 0)
            .map(tr => [].slice.call(tr.querySelectorAll('td'))
              .reduce((item, td, index) => assign(
                item, fieldNames[index], td.innerText.trim(),
              ),
              {}));
        });
    }

    this.logger.info('Logging out...');
    await page.goto('http://app.facgure.com/library/logout.php');

    await page.close();
    await browser.close();

    return bulletinItems;
  }
}
