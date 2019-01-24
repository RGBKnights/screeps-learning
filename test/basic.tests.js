import assert from 'assert'
import fs from 'fs-extra-promise'
import path from 'path'
import _ from 'lodash'
import { ScreepsServer, stdHooks } from 'screeps-server-mockup'

// Dirty hack to prevent driver from flooding error messages
stdHooks.hookWrite();

describe('Basics tests', function () {
  this.timeout("10s");
  this.slow("5s");

  // Server variable used for the tests
  let server = null;

  it('Starting server and running a few ticks without error', async function () {
    server = new ScreepsServer();
    await server.start();
    for (let i = 0; i < 5; i += 1) {
        await server.tick();
    }
    server.stop();
  });

  afterEach(async function () {
    // Make sure that server is stopped in case something went wrong
    if (_.isFunction(server.stop)) {
        server.stop();
        server = null;
    }
    // Delete server files
    await fs.removeAsync(path.resolve('server')).catch(console.error);
    await fs.removeAsync(path.resolve('another_dir')).catch(console.error);
    await fs.removeAsync(path.resolve('another_logdir')).catch(console.error);
  });
});