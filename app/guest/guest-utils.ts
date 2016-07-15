import {PPWindow} from "../domain/window";
import {StationButtonPath} from "../domain/station";

(<PPWindow>window).PP_EP = (() => {
  const LOG = 'color: orange; font-weight: bold;';
  console.log('%c render on guest', LOG);

  function _buildElement(el:HTMLElement, parentId:string){
    const PP_MEDIA_ATTRIBUTES = [
      'id', 'className', 'title'
    ];
    const PREFERRED_PLAY_VALUES = [
      'stopped'
    ];
    const PREFERRED_PAUSE_VALUES = [
      'playing'
    ];
    const PREFERRED_GENERAL_VALUES = [
      'playcontrol'
    ];
    const IGNORED_VALUES = [
      'playlist', 'player', 'volume', 'open'
    ];
    const PP_SCORE = 1;

    let _el = {
      path: el.className && el.className.replace ? '.' + el.className.replace(/ /g,'.') : '',
      playButtonScore: 0,
      pauseButtonScore: 0,
      isPlayButton: false,
      isPauseButton: false,
      isOtherMediaControl: false,
      parentId: parentId || undefined
    };

    PP_MEDIA_ATTRIBUTES.forEach(attr => {
      if(el[attr] && el[attr].indexOf){
        const EL_ATTR = el[attr].toLowerCase();
        if (EL_ATTR.indexOf('play') > -1) {
          _el.playButtonScore += PP_SCORE
          _el.isPlayButton = true;

          PREFERRED_GENERAL_VALUES.forEach(val => {
            if(EL_ATTR.indexOf(val) > -1){
              _el.playButtonScore += PP_SCORE;
            }
          })
        }

        if (EL_ATTR.indexOf('stop') > -1 || EL_ATTR.indexOf('pause') > -1) {
          _el.pauseButtonScore += PP_SCORE
          _el.isPauseButton = true;
        }

        IGNORED_VALUES.forEach(val => {
          if(EL_ATTR.indexOf(val) > -1){
            _el.isOtherMediaControl = true;
          }
        })
      }

    });

    if (el.nodeName === 'BUTTON') {
      if(_el.isPlayButton){
        _el.playButtonScore += PP_SCORE
      }
      if(_el.isPauseButton){
        _el.pauseButtonScore += PP_SCORE
      }
    }

    return _el
  }

  function _getButtonCandidates(elements?:any, old?:Array<any>, parentId?:string){
    let _elements = elements || document.querySelectorAll('*')
    let _old = old || [];
    let _parentId = parentId || null;

    [].forEach.call(_elements, (el:any) => {
      if (el.nodeName === 'IFRAME'){
        try{
          if(el && el.contentDocument){
            _old = _getButtonCandidates(el.contentDocument.querySelectorAll('*'), _old, el.id)
          }
        }
        catch(e){
          console.info(e)
        }
      }

      else{
        _old.push(_buildElement(el, _parentId));
      }

    });

    return _old.filter((el) => el.isPlayButton || el.isPauseButton)
      .sort((a,b) => (b.playButtonScore + b.pauseButtonScore) - (a.playButtonScore + a.pauseButtonScore));
  }

  function _getElementQuery(path:StationButtonPath):HTMLElement{
    if(path.type === 'selector'){
      return document.querySelectorAll(path.value)[0]
    }
    if(path.type === 'iframe'){
      let _paths = path.value.split(',');
      return window.frames[_paths[0]].contentDocument.querySelectorAll(_paths[1])[0]
    }
  }

  return {
    getButtons: () => {
      console.log('%c render on guest.getButtons()', LOG);
      (<PPWindow>window).electronSafeIpc.send('buttonsFetched', [1,2,3]);
    },

    getButtonCandidates: () => {
      var buttonCandidates = _getButtonCandidates();
      (<PPWindow>window).electronSafeIpc.send('buttonCandidatesFetched', buttonCandidates);
    },

    getPlayerState: (playBtnObj:StationButtonPath, pauseBtnObj:StationButtonPath) => {
      (<PPWindow>window).electronSafeIpc.send("buttonStylesFetched", {
        playBtnStyle:window.getComputedStyle(_getElementQuery(playBtnObj)),
        pauseBtnStyle: window.getComputedStyle(_getElementQuery(pauseBtnObj))
      })
    },

    click: (buttonPath:StationButtonPath):void => {
      _getElementQuery(buttonPath).click()
    }
  }
})();
