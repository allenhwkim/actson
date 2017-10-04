/**
 *
 * README!!
 *
 * A common need for apps and extensions is to have a single long-running
 * script to manage some task or state. Event pages to the rescue. Event
 * pages are loaded only when they are needed. When the event page is not
 * actively doing something, it is unloaded, freeing memory and resources.
 * e.g. when contextMenu is clicked, a storage item is updated 
 * 
 * this page is the command center. All settings will ONLY be done here for simplicity.
 * other pages. popup, webpage will send a message for further actions. e.g.,
 *  . update actions
 *  . change options
 *
 * which means, other pages will do read-only on chrome extension related actions. For example
 *  . storage will be set only on this page
 *  . badge will ge set only on this page
 *  . etc
 * 
 */

// context menu items. the key will be used as id.
var defaultContexts = ["link", "image", "video", "audio", 'editable', 'page', 'selection', 'frame'];
var contextMenus = {
  'click': { title: 'click <element>', contexts: defaultContexts },
  'wait-for': { title: 'wait for <element>', contexts: defaultContexts  },
  'mouse-down': { title: 'mouse down <element>', contexts: defaultContexts  },
  'mouse-up': { title: 'mouse up <element>', contexts: defaultContexts  },
  'set-value': { title: 'set value <element> <value>', contexts: defaultContexts  },
  'verify-disabled': { title: 'verify disabled <element>', contexts: defaultContexts  },
  'verify-enabled': { title: 'verify enabled <element>', contexts: defaultContexts  },
  'verify-present': { title: 'verify present <element>', contexts: defaultContexts  },
  'verify-not-present': { title: 'verify not present <element>', contexts: defaultContexts  },
  'verify-visible': { title: 'verify visible <element>', contexts: defaultContexts  },
  'verify-not-visible': { title: 'verify not visible <element>', contexts: defaultContexts  },
  'verify-selected': { title: 'verify selected <element>', contexts: defaultContexts  },
  'enter-text': { title: 'enter text <element> <value>', contexts: ['editable'] },
  'verity-text': { title: 'verify text \'%s\'', contexts: ['selection'] },
  'verity-no-text': { title: 'verify no text \'%s\'', contexts: ['selection'] },
  'switch-to': { title: 'switch to <iframe>', contexts: ['frame'] }
};

// info. of element that is last clicked
var elementClicked;

// number of context menus that are currently registered. Used when creating contextmenus
var numContextMenus;

// default valule of options
var defaultOptions = {
  enabled: true        // enable/disable this extesion on context menu, popup, and webpage
};

/**
 * initial actions
 */
chrome.runtime.onMessage.addListener(messageHandler);            // when message received
chrome.contextMenus.onClicked.addListener(menuItemClickHandler); // when contextmenu clicked
chrome.tabs.onActivated.addListener(broadcastOptions);           // when browser tabs are changed
chrome.storage.onChanged.addListener(storageChangedHandler);     // when storage is updated
init();

/**
 * init
 */
function init() {
  // read options from storage then spread news, so that web page, and extension use it.
  broadcastOptions(); 
}

/**
 * when message is received
 */
function messageHandler(request, sender, sendResponse){
  console.log('background page : received a message', request);

  // webpage -> background / when contextmenu item is clicked
  if (request.type === 'webpage-contextmenu') {
    elementClicked = request.data;
  } 

  // popup -> background
  if (request.type === 'update-options') {
    chrome.storage.sync.get(['options'], function(result) {
      let oldOptions = result.options;
      let options = Object.assign({}, oldOptions, request.data);
      console.log('oldOptions', oldOptions, 'newOptions', options);
      chrome.storage.sync.set({options: options});
    });
  }

  // popup -> background
  if (request.type === 'update-actions') {
    chrome.storage.sync.set({actions: request.data});
  }
}

/**
 * when contextmenu item is clicked
 */
function menuItemClickHandler(clickData) {
  // do something for tag input, textarea, select, button with type and value
  var title = contextMenus[clickData.menuItemId].title;
  var command = title.replace(/<element>/,'').replace(/<value>/g,'').replace(/'%s'/,'');
  var target = elementClicked.selector, value;
  if (clickData.selectionText && title.match(/'%s'/)) {
    value = clickData.selectionText;
  } else if (elementClicked.value && title.match(/<value>/)) {
    value = elementClicked.value;
  }
  _addAction({command, target, value}, clickData);
}

/**
 * when tab is changed
 * check if extension is enabled or not, then send message to webpage
 */
function broadcastOptions(obj) {
  console.log('background:  detected tab change', obj);
  chrome.storage.sync.get(['options', 'actions'], function(result) {
    var options = result.options;
    var actions = result.actions;

    if (!options) {
      options = defaultOptions;
      chrome.storage.sync.set({options: options});
    }

    _buildContextMenus(options);
    _updateBadge(options);
    let message = {type: 'storage-options-changed', data: options};
    chrome.runtime.sendMessage(message);
    obj && chrome.tabs.sendMessage(obj.tabId, message);

    if (actions) {
      chrome.browserAction.setBadgeText({"text": '' + actions.length});
    }
  });
}

/**
 * when storage options value is changed
 *  1. add or remove contextmenus by checking enabled flag
 *  2. send message to active webpage, so that the page remove/append event listeners
 *
 * When storage actions value is changed
 *  1. update the number(badge) of extension icon
 */
function storageChangedHandler(changes, storageName){
  console.log('background page : noticed that the storage data is changed', changes);

  if (changes.options && changes.options.newValue) {
    let options = changes.options.newValue;
    if (options.enabled !== changes.options.oldValue.enabled) {
      _buildContextMenus(options);
      _updateBadge(options);
    }

    let message = {type: 'storage-options-changed', data: options};
    chrome.runtime.sendMessage(message);
    chrome.tabs.query({ active: true, currentWindow: true}, function(tabs) { // send message to active tab
      chrome.tabs.sendMessage(tabs[0].id, message);
    });
  }

  if (changes.actions && changes.actions.newValue) {
    chrome.browserAction.setBadgeText({"text": ''+changes.actions.newValue.length});
  }
}

/**
 * rebuild context menus depending on enabled flag of options
 */
function _buildContextMenus(options) {
  if (!numContextMenus && options.enabled) {
    for (var id in contextMenus) {
      var contextMenu = Object.assign({id: id}, contextMenus[id]);
      chrome.contextMenus.create(contextMenu);
    }
    numContextMenus = Object.keys(contextMenus).length;
  } else if (numContextMenus && !options.enabled) {
    chrome.contextMenus.removeAll();
    numContextMenus = 0;
  }
}

function _updateBadge(options) {
  if (options.enabled) {
    chrome.browserAction.setIcon({path: "images/icon16.png"})
    chrome.browserAction.setBadgeBackgroundColor({color: '#f00'});
  } else {
    chrome.browserAction.setIcon({path: "images/icon-disabled.png"})
    chrome.browserAction.setBadgeBackgroundColor({color: '#ccc'});
  }
}

/**
 * append an action to actions in storage
 * clickData: 
 *   . menuItemId
 *   . mediaType (image, video, or audio)
 *   . linkUrl / srcUrl / pageUrl  
 *   . frameId / frameUrl
 *   . selectionText
 *   . wasChecked / checked
 */
function _addAction(action, clickData) {
  chrome.storage.sync.get('actions', function(result) {
    var actions = result.actions || [];
    if (actions.length === 0) { // wait page action for the first one.
      actions.push({
        command: 'wait page load',
        target: '',
        value: clickData.pageUrl
      })
    }
    actions.push(action);
    chrome.storage.sync.set({actions: actions}, function() {
      console.log("Saved a new action to storage");
    });
  }); 
}