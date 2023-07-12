import { ZWayServerPlatform, ZwayRequestOptions } from '../src/platform';
import { HomebridgeAPI } from 'homebridge/lib/api';
import { config } from './test-config';

const log = console;
const api = new HomebridgeAPI();

describe('Testing Discovery', ()=>{
  test('discovery should set accessories', async ()=>{

    const platform = new ZWayServerPlatform(log, config, api);

    let zwayDeviceCount = 0;
    const request = new ZwayRequestOptions('GET', 'ZAutomation/api/v1/devices');
    const promise = platform.zwayRequest(request);
    //await promise;
    await promise.then((result)=>{
      const devices = (result as any).data.devices;
      zwayDeviceCount = devices.length;
    });

    await platform.discoverDevices();
    const storage = platform.hap.HAPStorage.storage();
    expect(storage).toBe(zwayDeviceCount);
  });
});