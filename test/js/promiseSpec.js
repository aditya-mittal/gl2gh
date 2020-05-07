const assert = require('assert');

function asyncMethod() {
  return new Promise(function(resolve, reject) {
      resolve();
    })
}

describe('Async test', () => {
  it('Should not pass', async function() {
    await asyncMethod();
    assert.equal(true, true);
  })
})