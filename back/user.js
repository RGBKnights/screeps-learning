import assert from 'assert'
import fs from 'fs-extra-promise'
import path from 'path'
import _ from 'lodash'
import { ScreepsServer, stdHooks } from 'screeps-server-mockup'

// Dirty hack to prevent driver from flooding error messages
stdHooks.hookWrite();

const TIMEOUT = 30; // Seconds
const SLOW = 10;    // Seconds

suite('User tests', function () {
  this.timeout(TIMEOUT * 1000);
  this.slow(SLOW * 1000);
  // Server variable used for the tests
  let server = null;

  test('Getting basic user attributes and statistics', async function () {
    // Server initialization
    server = new ScreepsServer();
    await server.start();
    // User / bot initialization
    const modules = {
        main: `module.exports.loop = function() {
            Memory.foo = { bar: 'baz' }
        }`,
    };
    const user = await server.world.addBot({ username: 'bot', room: 'W0N0', x: 25, y: 25, modules });
    // Run one tick
    await server.tick();
    (await user.newNotifications).forEach(({ message }) => console.log('[notification]', message));
    // Assert if attributes are correct
    assert(_.isString(user.id) && user.id.length > 0, 'invalid user id');
    assert.equal(user.username, 'bot');
    assert.equal(await user.cpu, 100);
    assert.equal(await user.cpuAvailable, 10000);
    assert(_.isNumber(await user.lastUsedCpu), 'user.lastUsedCpu is not a number');
    assert.equal(await user.gcl, 1);
    assert.deepEqual(await user.rooms, ['W0N0']);
    // Assert if memory is correctly set and retrieved
    const memory = JSON.parse(await user.memory);
    const reference = { foo: { bar: 'baz' } };
    assert.deepEqual(memory, reference);
    // Stop server (don't stop it before we get all info)
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