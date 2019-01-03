// Copyright (c) 2015-2016 Yuya Ochiai
// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import fs from 'fs';
import path from 'path';

import env from '../modules/environment';
import PermissionManager from '../../src/main/PermissionManager';

const permissionFile = path.join(env.userDataDir, 'permission.json');

describe('PermissionManager', function() {
  beforeEach(function(done) {
    fs.unlink(permissionFile, () => {
      done();
    });
  });

  it('should grant a permission for an origin', function() {
    const ORIGIN = 'origin';
    const PERMISSION = 'permission';
    const manager = new PermissionManager(permissionFile);

    manager.isGranted(ORIGIN, PERMISSION).should.be.false;
    manager.isDenied(ORIGIN, PERMISSION).should.be.false;

    manager.grant(ORIGIN, PERMISSION);

    manager.isGranted(ORIGIN, PERMISSION).should.be.true;
    manager.isDenied(ORIGIN, PERMISSION).should.be.false;

    manager.isGranted(ORIGIN + '_another', PERMISSION).should.be.false;
    manager.isGranted(ORIGIN, PERMISSION + '_another').should.be.false;
  });

  it('should deny a permission for an origin', function() {
    const ORIGIN = 'origin';
    const PERMISSION = 'permission';
    const manager = new PermissionManager(permissionFile);

    manager.isGranted(ORIGIN, PERMISSION).should.be.false;
    manager.isDenied(ORIGIN, PERMISSION).should.be.false;

    manager.deny(ORIGIN, PERMISSION);

    manager.isGranted(ORIGIN, PERMISSION).should.be.false;
    manager.isDenied(ORIGIN, PERMISSION).should.be.true;

    manager.isDenied(ORIGIN + '_another', PERMISSION).should.be.false;
    manager.isDenied(ORIGIN, PERMISSION + '_another').should.be.false;
  });

  it('should save permissions to the file', function() {
    const ORIGIN = 'origin';
    const PERMISSION = 'permission';
    const manager = new PermissionManager(permissionFile);
    manager.deny(ORIGIN, PERMISSION);
    manager.grant(ORIGIN + '_another', PERMISSION + '_another');
    JSON.parse(fs.readFileSync(permissionFile)).should.deep.equal({
      origin: {
        permission: 'denied',
      },
      origin_another: {
        permission_another: 'granted',
      },
    });
  });

  it('should restore permissions from the file', function() {
    fs.writeFileSync(permissionFile, JSON.stringify({
      origin: {
        permission: 'denied',
      },
      origin_another: {
        permission_another: 'granted',
      },
    }));
    const manager = new PermissionManager(permissionFile);
    manager.isDenied('origin', 'permission').should.be.true;
    manager.isGranted('origin_another', 'permission_another').should.be.true;
  });

  it('should allow permissions for trusted URLs', function() {
    fs.writeFileSync(permissionFile, JSON.stringify({}));
    const manager = new PermissionManager(permissionFile, ['https://example.com', 'https://example2.com/2']);
    manager.isGranted('https://example.com', 'notifications').should.be.true;
    manager.isGranted('https://example2.com', 'test').should.be.true;
  });
});
