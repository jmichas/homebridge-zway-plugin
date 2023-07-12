import { Console } from 'console';
import { ZWayServerPlatform, ZwayRequestOptions } from '../src/platform';
import { HomebridgeAPI } from 'homebridge/lib/api';
import axios, { AxiosError } from 'axios';
import { config } from './test-config';

const log = console;
const api = new HomebridgeAPI();

describe('Testing ZwayRequest', ()=>{

  test('discovery request should return devices from Zway', async ()=>{

    const platform = new ZWayServerPlatform(log, config, api);
    delete platform.axios.defaults.headers['Cookie'];

    const request = new ZwayRequestOptions('GET', 'ZAutomation/api/v1/devices');
    const promise = platform.zwayRequest(request);

    await promise.then((result)=>{
      const devices = (result as any).data.devices;
      expect(devices.length).toBeGreaterThan(0);
    });

  });

  test('multiple request should only authenticate user once', async ()=>{

    const logSpy = jest.spyOn(console, 'info').mockImplementation();
    logSpy.mockClear();

    const platform = new ZWayServerPlatform(console, config, api);
    delete platform.axios.defaults.headers['Cookie'];

    const request = new ZwayRequestOptions('GET', 'ZAutomation/api/v1/devices');

    const promise = platform.zwayRequest(request);
    await promise.then((result)=>{
      const devices = (result as any).data.devices;
      expect(devices.length).toBeGreaterThan(0);
      expect(logSpy).toHaveBeenCalledWith('Authenticating user...');
      logSpy.mockClear();
    });

    const promise2 = platform.zwayRequest(request);
    await promise2.then((result)=>{
      const devices = (result as any).data.devices;
      expect(devices.length).toBeGreaterThan(0);
      expect(logSpy).not.toHaveBeenCalledWith('Authenticating user...');
      logSpy.mockRestore();
    });

  });
});

describe('Testing user login/auth', ()=>{

  test('login should succeed for valid credentials', async ()=>{
    const platform = new ZWayServerPlatform(log, config, api);
    delete platform.axios.defaults.headers['Cookie'];

    await platform.loginUser();
    expect(platform.sessionId).not.toBe('');
    expect(platform.axios).not.toBe(null);
    expect(platform.axios.defaults.headers['Cookie']?.toString()).toContain(platform.sessionId);
  });

  test('login should fail for invalid credentials', async ()=>{
    const failConfig = config;
    failConfig.login = 'xasxas';
    const platform = new ZWayServerPlatform(log, config, api);
    delete platform.axios.defaults.headers['Cookie'];

    // expect(async ()=> {
    //   await platform.loginUser();
    // }).toThrow(AxiosError);

    //expect(platform.sessionId).toBe('');

    await platform.loginUser()
      .catch((error)=>{
        expect(error.response.status).toBe(401);
        expect(platform.sessionId).toBe('');
      });
  });

  test('login should fail for no credentials', async ()=>{
    const failConfig = config;
    failConfig.login = '';
    failConfig.password = '';
    const platform = new ZWayServerPlatform(log, config, api);
    delete platform.axios.defaults.headers['Cookie'];

    await platform.loginUser()
      .catch((error)=>{
        expect(error.response.status).toBe(401);
        expect(platform.sessionId).toBe('');
      });
  });
});

