import assert from 'assert'
import fs from 'fs-extra-promise'
import path from 'path'
import _ from 'lodash'
import { ScreepsServer, stdHooks } from 'screeps-server-mockup'

// Dirty hack to prevent driver from flooding error messages
stdHooks.hookWrite();

const TIMEOUT = 30; // Seconds
const SLOW = 10;    // Seconds

suite('Basics tests', function () {
  this.timeout(TIMEOUT * 1000);
  this.slow(SLOW * 1000);
  // Server variable used for the tests
  let server = null;

  test('Starting server and running a few ticks without error', async function () {
    server = new ScreepsServer();
    await server.start();
    for (let i = 0; i < 5; i += 1) {
        await server.tick();
    }
    server.stop();
  });

  teardown(async function () {
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