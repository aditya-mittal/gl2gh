const mocha = require('mocha');
process.env.NODE_CONFIG_ENV = 'test';
mocha.reporters.Base.symbols.ok = '[PASS]';
mocha.reporters.Base.symbols.err = '[FAIL]';