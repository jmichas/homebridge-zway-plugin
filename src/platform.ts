import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic, HAP } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { ZWayServerAccessory } from './platformAccessory';
import axios, { Axios, AxiosRequestConfig, HttpStatusCode } from 'axios';
import tough from 'tough-cookie';
import Q from 'q';
import { request } from 'http';
import { debug } from 'console';
import { AnyRecord } from 'dns';
//import Q from 'Q'
//import { cookie }
/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class ZWayServerPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  public hap: HAP = this.api.hap;

  //zway properties
  public readonly url: string;
  public readonly login: string;
  public readonly password: string;
  public readonly opt_in: boolean;
  public readonly name_overrides: object;
  public readonly batteryLow: number;
  public readonly OIUWatts: number;
  public readonly blinkTime: number;
  public readonly pollInterval: number;
  public readonly splitServices: boolean;
  public readonly dimmerOffThreshold: number;
  public readonly lastUpdate: number;
  public readonly cxVDevMap: object;
  public readonly vDevStore: object;
  public sessionId: string;
  public cookie: tough.CookieJar;
  public readonly axios: Axios;
  public zwayDevices:any = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.name);

    this.url = config['url'];
    this.login = config['login'];
    this.password = config['password'];
    this.opt_in = config['opt_in'];
    this.name_overrides = config['name_overrides']; //appears to be unused in old coded
    this.batteryLow = config['battery_low_level'] || 15;
    this.OIUWatts = config['outlet_in_use_level'] || 2;
    this.blinkTime = (config['blink_time']*1000) || (0.5*1000);
    this.pollInterval = config['poll_interval'] || 2;
    this.splitServices= config['split_services'] === undefined ? true : config['split_services'];
    this.dimmerOffThreshold = config['dimmer_off_threshold'] === undefined ? 5 : config['dimmer_off_threshold'];
    this.lastUpdate = 0;
    this.cxVDevMap = {};
    this.vDevStore = {};
    this.sessionId = '';
    //this.jar = request.jar(new tough.CookieJar()); //jar appears to not be used in old code
    this.cookie = new tough.CookieJar();

    axios.defaults.withCredentials = true;
    axios.defaults.headers.common.Accept = 'application/json';
    axios.defaults.headers.common['Content-Type'] = 'application/json';

    this.axios = axios;
    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', async () => {
      log.debug('Executed didFinishLaunching callback');
      const storage = this.api.hap.HAPStorage.storage();
      log.debug(storage);
      // run the method to discover / register your devices as accessories
      await this.discoverDevices();
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  async discoverDevices() {

    const deviceRequest = new ZwayRequestOptions('GET', 'ZAutomation/api/v1/devices');
    await this.zwayRequest(deviceRequest)
      .then((result)=>{
        this.zwayDevices = (result as any).data.devices;
      });
    //this.log.info(JSON.stringify(this.zwayDevices));

    // loop over the discovered devices and register each one if it has not already been registered
    for (const device of this.zwayDevices) {

      // generate a unique id for the accessory this should be generated from
      // something globally unique, but constant, for example, the device serial
      // number or MAC address
      const uuid = this.api.hap.uuid.generate(device.id);

      // see if an accessory with the same uuid has already been registered and restored from
      // the cached devices we stored in the `configureAccessory` method above
      const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

      if (existingAccessory) {
        // the accessory already exists
        this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

        // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
        // existingAccessory.context.device = device;
        // this.api.updatePlatformAccessories([existingAccessory]);

        // create the accessory handler for the restored accessory
        // this is imported from `platformAccessory.ts`
        new ZWayServerAccessory(this, existingAccessory);

        // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
        // remove platform accessories when no longer present
        // this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
        // this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
      } else {
        // the accessory does not yet exist, so we need to create it
        const name = device.metrics && device.metrics.title ? device.metrics.title : device.id;
        this.log.info('Adding new accessory:', name);

        // create a new accessory
        const accessory = new this.api.platformAccessory(name, uuid);

        // store a copy of the device object in the `accessory.context`
        // the `context` property can be used to store any data about the accessory you may need
        accessory.context.device = device;

        // create the accessory handler for the newly create accessory
        // this is imported from `platformAccessory.ts`
        //todo switch accessory based on device type
        new ZWayServerAccessory(this, accessory);

        // link the accessory to your platform
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
        //this.accessories.push(accessory); //not sure if we should manually add to accessories
      }
    }
  }

  zwayRequest(opts:ZwayRequestOptions){
    this.log.info('zwayRequest ' + opts);
    const deferred = Q.defer();
    const requestConfig:AxiosRequestConfig = {
      method: opts.method.toLowerCase(),
      url: this.url + opts.url,
      params: opts.qs,
      data: opts.data,
    };
    axios.request(requestConfig)
      .then((response)=>{
        deferred.resolve(response.data);
      })
      .catch((error)=> {
        //handle error
        this.log.info(error.message);
        if(error.response.status === HttpStatusCode.Unauthorized){
          this.loginUser()
            .then((response)=>{
              //resend original request because we are logged in
              this.log.info('Authenticated. Resubmitting original request...');
              axios.request(requestConfig)
                .then((response)=>{
                  deferred.resolve(response.data);
                })
                .catch((error)=>{
                  //reject deferred because original request failed completely after auth
                  deferred.reject(error);
                });
            })
            .catch((error)=>{
              //reject deferred because login failed completely
              deferred.reject(error);
            });
        }
      });

    return deferred.promise;
  }

  loginUser(){
    const log = this.log;
    log.info('Authenticating user...');
    const deferred = Q.defer();
    //login user
    axios.post(
      this.url + 'ZAutomation/api/v1/login',
      {
        'form': true,
        'login': this.login,
        'password': this.password,
        'keepme': false,
        'default_ui': 1,
      },
    )
      .then((response)=>{
        log.info('User logged in successfully');
        this.sessionId = response.data.data.sid;
        axios.defaults.headers['Cookie'] = 'ZWAYSession=' + this.sessionId;
        deferred.resolve(response.data.data);
      })
      .catch((error)=>{
        log.info('Error logging in user');
        if(error.response.status === HttpStatusCode.Unauthorized){
          log.info('ERROR: Fatal! Authentication failed (error code 401)! Check the username and password in config.json!');
        }else{
          log.info('ERROR: Fatal! Authentication failed with unexpected HTTP response code ' + error.response.status + '!');
        }
        deferred.reject(error);
      });

    return deferred.promise;
  }
}

export class ZwayRequestOptions{
  constructor(
    public method:string,
    public url:string,
    public qs?:object,
    public data?:object,
  ){}
}