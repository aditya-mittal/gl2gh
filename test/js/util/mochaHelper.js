const mocha = require("mocha");
mocha.reporters.Base.symbols.ok = "[PASS]";
mocha.reporters.Base.symbols.err = "[FAIL]";