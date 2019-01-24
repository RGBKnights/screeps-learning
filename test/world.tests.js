import assert from 'assert'
import fs from 'fs-extra-promise'
import path from 'path'
import _ from 'lodash'
import { ScreepsServer, TerrainMatrix, stdHooks } from 'screeps-server-mockup'

// Dirty hack to prevent driver from flooding error messages
stdHooks.hookWrite();

describe('World tests', function () {
  this.timeout("10s");
  this.slow("5s");

  // Server variable used for the tests
  let server = null;
 
  it('Getting and setting room terrain', async function () {
    // Server initialization
    server = new ScreepsServer();
    await server.world.reset();
    await server.world.addRoom('W0N1');
    // Set room terrain
    await server.world.setTerrain('W0N1'); // default terrain
    let matrix = await server.world.getTerrain('W0N1');
    assert(matrix.get(0, 0), 'plain');
    assert(matrix.serialize(), Array(50 * 50).fill('0').join(''));
    // Reset room terrain
    matrix.set(0, 0, 'wall');
    matrix.set(25, 25, 'swamp');
    await server.world.setTerrain('W0N1', matrix);
    matrix = await server.world.getTerrain('W0N1');
    assert(matrix.get(0, 0), 'wall');
    assert(matrix.get(25, 25), 'swamp');
  });

  it('Defining a stub world', async function () {
    const samples = require('../assets/rooms.json');
    // Server initialization
    server = new ScreepsServer();
    const { db } = server.common.storage;
    await server.world.stubWorld();
    // Check that rooms were added
    const rooms = await db.rooms.find();
    assert.equal(rooms.length, _.size(samples));
    // Check that terrains were added
    const terrain = await db['rooms.terrain'].find();
    assert.equal(terrain.length, _.size(samples));
    _.each(samples, async (sourceData, roomName) => {
        const roomData = await db['rooms.terrain'].findOne({ room: roomName });
        assert.equal(roomData.terrain, sourceData.serial);
    });
    // Check that roomObject were added
    const nbObjects = _.sumBy(_.toArray(samples), room => _.size(room.objects));
    const objects = await db['rooms.objects'].find();
    assert.equal(objects.length, nbObjects);
  });

  
  it('Reading terrain in game', async function () {
    // Server initialization
    server = new ScreepsServer();
    await server.world.stubWorld();
    // Code declaration
    const modules = {
        main: `module.exports.loop = function() {
           console.log('W0N0 terrain: ' + Game.map.getTerrainAt(25, 25, 'W0N0'));
           console.log('W0N1 terrain: ' + Game.map.getTerrainAt(15, 48, 'W0N1'));
           console.log('W1N2 terrain: ' + Game.map.getTerrainAt(37, 0, 'W1N2'));
        }`,
    };
    // User / bot initialization
    let logs = [];
    const user = await server.world.addBot({ username: 'bot', room: 'W0N0', x: 25, y: 25, modules });
    user.on('console', (log, results, userid, username) => {
        logs = logs.concat(log);
    });
    // Run one tick, then stop server
    await server.start();
    await server.tick();
    server.stop();

    // let memory = await user.memory
    // console.log(memory);
    // console.log(logs);

    // Assert if terrain was correctly read
    assert.equal(logs.filter(line => line.match('terrain')).length, 3, 'invalid logs length');
    assert.ok(_.find(logs, line => line.match('W0N0 terrain: plain')), 'W0N0 terrain not found or incorrect');
    assert.ok(_.find(logs, line => line.match('W0N1 terrain: wall')), 'W0N1 terrain not found or incorrect');
    assert.ok(_.find(logs, line => line.match('W1N2 terrain: wall')), 'W1N2 terrain not found or incorrect');
  });

  it('Getting and setting RoomObjetcs', async function () {
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

  it('Getting basic user attributes and statistics', async function () {
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
    let notifications = await user.newNotifications;
    notifications.forEach(({ message }) => console.log('[notification]', message));
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

  afterEach(async function () {
    // Make sure that server is stopped in case something went wrong
    if (_.isFunction(server.stop)) {
        server.stop();
        server = null;
    }
    // Delete server files
    await fs.removeAsync(path.resolve('server')).catch(console.error);
    // await fs.removeAsync(path.resolve('another_dir')).catch(console.error);
    // await fs.removeAsync(path.resolve('another_logdir')).catch(console.error);
  });
});