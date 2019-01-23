import assert from 'assert'
import fs from 'fs-extra-promise'
import path from 'path'
import _ from 'lodash'
import { ScreepsServer, stdHooks } from 'screeps-server-mockup'

// Dirty hack to prevent driver from flooding error messages
stdHooks.hookWrite();

const TIMEOUT = 30; // Seconds
const SLOW = 10;    // Seconds

suite('Rooms tests', function () {
  this.timeout(TIMEOUT * 1000);
  this.slow(SLOW * 1000);
  // Server variable used for the tests
  let server = null;

  test('Getting and setting RoomObjetcs', async function () {
    // Server initialization
    server = new ScreepsServer();
    await server.world.reset();
    await server.world.addRoom('W0N1');
    // Add some objects in W0N1
    await server.world.addRoomObject('W0N1', 'source', 10, 40, { energy: 1000, energyCapacity: 1000, ticksToRegeneration: 300 });
    await server.world.addRoomObject('W0N1', 'mineral', 40, 40, { mineralType: 'H', density: 3, mineralAmount: 3000 });
    // Listing all RoobObjects in W0N1 and assert if they are correct
    const objects = await server.world.roomObjects('W0N1');
    const source = _.find(objects, { type: 'source' });
    const mineral = _.find(objects, { type: 'mineral' });
    assert.equal(objects.length, 2);
    assert.equal(source.x, 10);
    assert.equal(source.energy, 1000);
    assert.equal(mineral.density, 3);
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