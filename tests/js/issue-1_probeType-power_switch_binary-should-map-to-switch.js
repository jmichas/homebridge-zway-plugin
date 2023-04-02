var _initializer = require('../../index.js')._initializer;
var platform = require('../../index.js').platform;
var accessory = require('../../index.js').accessory;
var qunit = require('qunit');
var homebridge = require("../../node_modules/homebridge/lib/api.js");

var api = new homebridge.HomebridgeAPI();
_initializer(api);
var testPlatform = new platform(console.log, {});
var Service = api.hap.Service;
var Characteristic = api.hap.Characteristic;
var ZWayServerPlatform = platform;

qunit.test("Issue 1 published devices", function(assert) {
    var devicesJson = require('../data/issue-1.json');
    var foundAccessories = testPlatform.buildAccessoriesFromJson(devicesJson);
    assert.equal(foundAccessories.length, 1, "buildAccessoriesFromJson must find 1 accessory.");
    
    var acc = new accessory(foundAccessories[0].name, foundAccessories[0].devDesc, testPlatform);
    var services = acc.getServices();
    assert.equal(services.length, 2, "getServices must return 2 services.");
    
    //console.log(JSON.stringify(services, null, 5));
  
    var fsvcs, cxs;
  
    fsvcs = services.filter(function(service){ 
        console.debug(service.UUID + '==' + Service.Switch.UUID);
        return service.UUID === Service.Switch.UUID; 
    });
    assert.equal(fsvcs.length, 1, "getServices must return exactly one Switch service");
    
    var cxs = fsvcs[0].characteristics.filter(function(cx){ return cx.UUID === Characteristic.On.UUID; });
    assert.equal(cxs.length, 1, "The Switch service must have exactly one On Characteristic");
});
qunit.log(details => {if(!details.result) {console.log(details.message);}});
qunit.load();