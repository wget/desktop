// Copyright (c) 2015-2016 Yuya Ochiai
// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
'use strict';

const fs = require('fs');

const env = require('../modules/environment');

describe('application', function desc() {
  this.timeout(30000);

  beforeEach(() => {
    env.createTestUserDataDir();
    env.cleanTestConfig();
    this.app = env.getSpectronApp();
    return this.app.start();
  });

  afterEach(async () => {
    if (this.app && this.app.isRunning()) {
      await this.app.stop();
    }
  });

  it('should show a window', async () => {
    await this.app.client.waitUntilWindowLoaded();
    const count = await this.app.client.getWindowCount();
    count.should.equal(1);

    const opened = await this.app.browserWindow.isDevToolsOpened();
    opened.should.be.false;

    const visible = await this.app.browserWindow.isVisible();
    visible.should.be.true;
  });

  it.skip('should restore window bounds', async () => {
    // bounds seems to be incorrectly calculated in some environments
    // - Windows 10: OK
    // - CircleCI: NG
    const expectedBounds = {x: 100, y: 200, width: 300, height: 400};
    fs.writeFileSync(env.boundsInfoPath, JSON.stringify(expectedBounds));
    await this.app.restart();
    const bounds = await this.app.browserWindow.getBounds();
    bounds.should.deep.equal(expectedBounds);
  });

  it('should NOT restore window bounds if the origin is located on outside of viewarea', async () => {
    // bounds seems to be incorrectly calculated in some environments (e.g. CircleCI)
    // - Windows 10: OK
    // - CircleCI: NG
    fs.writeFileSync(env.boundsInfoPath, JSON.stringify({x: -100000, y: 200, width: 300, height: 400}));
    await this.app.restart();
    let bounds = await this.app.browserWindow.getBounds();
    bounds.x.should.satisfy((x) => (x > -10000));

    fs.writeFileSync(env.boundsInfoPath, JSON.stringify({x: 100, y: 200000, width: 300, height: 400}));
    await this.app.restart();
    bounds = await this.app.browserWindow.getBounds();
    bounds.y.should.satisfy((y) => (y < 10000));
  });

  it('should show settings.html when there is no config file', async () => {
    await this.app.client.waitUntilWindowLoaded();
    const url = await this.app.client.getUrl();
    url.should.match(/\/settings.html$/);

    const existing = await this.app.client.isExisting('#newServerModal');
    existing.should.equal(true);
  });

  it('should show index.html when there is config file', async () => {
    fs.writeFileSync(env.configFilePath, JSON.stringify({
      url: env.mattermostURL,
    }));
    await this.app.restart();

    const url = await this.app.client.getUrl();
    url.should.match(/\/index.html$/);
  });

  it('should upgrade v0 config file', async () => {
    const settings = require('../../src/common/settings').default;
    fs.writeFileSync(env.configFilePath, JSON.stringify({
      url: env.mattermostURL,
    }));
    await this.app.restart();

    const url = await this.app.client.getUrl();
    url.should.match(/\/index.html$/);

    const str = fs.readFileSync(env.configFilePath, 'utf8');
    const config = JSON.parse(str);
    config.version.should.equal(settings.version);
  });

  it.skip('should be stopped when the app instance already exists', (done) => {
    const secondApp = env.getSpectronApp();

    // In the correct case, 'start().then' is not called.
    // So need to use setTimeout in order to finish this test.
    const timer = setTimeout(() => {
      done();
    }, 3000);
    secondApp.start().then(() => {
      clearTimeout(timer);
      return secondApp.stop();
    }).then(() => {
      done(new Error('Second app instance exists'));
    });
  });
});
