"use strict";
import {Station} from "../domain/station";
import {Guest} from "../domain/guest";
import IpcRenderer = Electron.IpcRenderer;
import IpcRendererEvent = Electron.IpcRendererEvent;
import WebViewElement = Electron.WebViewElement;

import {Logger as iLogger} from "../domain_/Logger";
const Logger = require('./app/domain_/Logger');

import {Subscriber as iSubscriber} from "./subscriber";
const Subscriber = require('./app/render/subscriber');

class Render {
  private Guest = require('./app/render/guest');
  private AddGuest = require('./app/render/addGuest');
  private db = require('./app/render/db');

  guest:Guest;
  subscriber:iSubscriber;
  logger:iLogger;

  constructor() {
    const MAIN:IpcRenderer = require('electron').ipcRenderer;
    let that = this;

    this.subscriber = new Subscriber();
    this.logger = new Logger('Render', 'pink');

    MAIN.on('playpause', (event:IpcRendererEvent) => {
      this.logger.log('playpause', event);
      that.guest.onPlayPause();
      that.subscriber.publish('playpause', event);
    });
  }

  getStations = this.db.getAll;
  getStation = this.db.get;
  addStation = this.db.add;
  removeStation = this.db.remove;

  setStation = (station:Station, webview:WebViewElement) => {
    this.logger.log('setStation', station);
    this.guest = new this.Guest(webview, station);
  };

  setAddStation = (webview:WebViewElement):Promise<any[]> => {
    this.logger.log('setAddStation');
    return new Promise<any>((resolve, reject) => {
      this.guest = new this.AddGuest(webview, this.subscriber);

      //TODO use promise
      this.subscriber.on('onButtonCandidatesFetched', (buttons:any[]) => {
        this.logger.log('onButtonCandidatesFetched', buttons);
        resolve(buttons);
      })
    })
  };

  on = (topic:string, listener:any) =>{
    return this.subscriber.on(topic, listener);
  }
}
