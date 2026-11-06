// Node runner: loads assets/stk-sample.js and assets/stk-live.js exactly as the browser does and
// prints the canon as JSON. Compare with materials/compare-ladder.py against stk_reference.py.
const fs = require("fs"), path = require("path"), vm = require("vm");
const repo = process.argv[2] || path.join(__dirname, "..");
const ctx = { window: {} }; ctx.window.window = ctx.window;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(repo, "assets/stk-sample.js"), "utf8"), ctx);
const api = require(path.join(path.resolve(repo), "assets/stk-live.js"));
process.stdout.write(JSON.stringify(api.canon(ctx.window.STK_SAMPLE)));
