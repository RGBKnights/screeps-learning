import assert from 'assert'
import { TerrainMatrix } from 'screeps-server-mockup'

const TerrainTypes = { Plain: 'plain', Wall: 'wall', Swamp: 'swamp' };

describe('TerrainMatrix tests', function () {
  this.timeout("10s");
  this.slow("5s");

  it('Setting and getting values', async function () {
    // 50 x 50
    const matrix = new TerrainMatrix();
    // Set it
    matrix.set(0, 1, TerrainTypes.Wall);
    matrix.set(0, 1, TerrainTypes.Swamp);
    matrix.set(0, 2, TerrainTypes.Wall);
    // Test it
    assert.equal(matrix.get(0, 0), TerrainTypes.Plain);
    assert.equal(matrix.get(0, 1), TerrainTypes.Swamp);
    assert.equal(matrix.get(0, 2), TerrainTypes.Wall);
    assert.equal(matrix.get(0, 3), TerrainTypes.Plain);

    //const data = matrix.serialize()
  });
});