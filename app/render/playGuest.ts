  import WebViewElement = Electron.WebViewElement;
  import EventEmitter = Electron.EventEmitter;
  import {Station} from '../domain/station';
  import {Utils} from './utils';
  import {Guest} from './guest';
  import {Subscriber} from './subscriber';

  const safeIPC:EventEmitter = require('electron-safe-ipc/host-webview');

  export class PlayGuest extends Guest{
    private station:Station;

    constructor(webview:Electron.WebViewElement, station:Station, subscriber:Subscriber) {
      super(webview, subscriber);
      this.station = station;
    }

    private onButtonStylesFetched = (playBtnStyle:CSSStyleDeclaration, pauseBtnStyles:CSSStyleDeclaration):void => {
      this.logger.log('onButtonStylesFetched', !!playBtnStyle, !!pauseBtnStyles);
      safeIPC.removeAllListeners('buttonStylesFetched');

      switch (Utils.getGuestState(playBtnStyle, pauseBtnStyles)) {
        case 'playing':
          this.webview.executeJavaScript(Utils.click(this.station.buttons.pause));
          break;
        case 'paused':
        default:
          this.webview.executeJavaScript(Utils.click(this.station.buttons.play))
      }
    };

    playPause():void {
      safeIPC.on('buttonStylesFetched', this.onButtonStylesFetched);
      if (this.station && this.station.buttons.play !== this.station.buttons.pause) {
        let fetchButtons = 'electronSafeIpc.send("buttonStylesFetched", ' + Utils.getComputedStyle(this.station.buttons.play) + ',' + Utils.getComputedStyle(this.station.buttons.pause) + ')';
        this.logger.log('onPlayPause', fetchButtons);
        this.webview.executeJavaScript(fetchButtons); //TODO use promise like AddGuest
      }
      else {
        this.webview.executeJavaScript(Utils.click(this.station.buttons.play))
      }
    }
  }
