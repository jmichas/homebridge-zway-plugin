var qunit = require("qunit");
homebridge = require("../../node_modules/homebridge/lib/api.js");

//QUnit.config.autostart = false;

var tests = [
      'switchBinary.js',
      'issue-48.js',
      'issue-69.js',
      'issue-72.js',
      'issue-70.js',
      'update-without-change.js',
      'issue-1_probeType-power_switch_binary-should-map-to-switch.js'
    ].map(function (v) { return './tests/js/' + v; });

//tests.forEach(function(v){require(v);});

//qunit.module('./tests/js/issue-1_probeType-power_switch_binary-should-map-to-switch.js');
//qunit.start());
//QUnit './tests/js/issue-1_probeType-power_switch_binary-should-map-to-switch.js';
qunit.load();


//qunit.options.coverage = { dir: "/tmp/" };

// qunit({
//   code : "index.js",
//   tests : [
//     'switchBinary',
//     'issue-48.js',
//     'issue-69.js',
//     'issue-72.js',
//     'issue-70.js',
//     'update-without-change.js',
//     'issue-1_probeType-power_switch_binary-should-map-to-switch.js'
//   ].map(function (v) { return './tests/js/' + v; })
// });
