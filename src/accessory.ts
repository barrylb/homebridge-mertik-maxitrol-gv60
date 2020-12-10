import {
  AccessoryConfig,
  AccessoryPlugin,
  API,
  CharacteristicEventTypes,
  CharacteristicGetCallback,
  CharacteristicSetCallback,
  CharacteristicValue,
  HAP,
  Logging,
  Service
} from "homebridge";

let hap: HAP;

/*
 * Initializer function called when the plugin is loaded.
 */
export = (api: API) => {
  hap = api.hap;
  api.registerAccessory("GasFire", GasFire);
};

class GasFire implements AccessoryPlugin {

  private readonly log: Logging;
  private readonly name: string;
  private switchOn = false;
  private fireServer: string;
  private readonly switchService: Service;

  constructor(log: Logging, config: AccessoryConfig, api: API) {
    this.log = log;
    this.name = config.name;
    this.fireServer = 'http://' + config.serverIP + ':' + config.serverPort;
    this.switchService = new hap.Service.Switch(this.name);
    this.switchService.getCharacteristic(hap.Characteristic.On)
      .on(CharacteristicEventTypes.GET, this.handleGet.bind(this))
      .on(CharacteristicEventTypes.SET, this.handleSet.bind(this));

    //log.info("GasFire finished initializing! Server=" + this.fireServer);
  }

  /*
   * This method is called directly after creation of this instance.
   * It should return all services which should be added to the accessory.
   */
  getServices(): Service[] {
    return [
      this.switchService,
    ];
  }

  handleGet(callback: CharacteristicGetCallback) {
    //this.log.info("GasFire switch state was returned: " + (this.switchOn? "ON": "OFF"));
    callback(undefined, this.switchOn);
  }

  handleSet(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    this.switchOn = value as boolean;
    var command = (this.switchOn ? "/on": "/off");

    const http = require('http');
    http.get(this.fireServer + command, (res: any) => {
        let data = '';

        // called when a data chunk is received.
        res.on('data', (chunk: any) => {
            data += chunk;
        });

        // called when the complete response is received.
        res.on('end', () => {
            this.log.info("GasFire server reply: " + data);
        });

    }).on("error", (err: any) => {
        this.log.info("Request error: ", err.message);
    });

    this.log.info("GasFire state was set to: " + (this.switchOn? "ON": "OFF"));
    callback();
  }
}
