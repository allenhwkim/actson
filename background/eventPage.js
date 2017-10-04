/**
 * A common need for apps and extensions is to have a single long-running
 * script to manage some task or state. Event pages to the rescue. Event
 * pages are loaded only when they are needed. When the event page is not
 * actively doing something, it is unloaded, freeing memory and resources.
 * e.g. when contextMenu is clicked, a storage item is updated 
 */
var contextMenus = {
  'click': { title: 'click <element>', contexts: ['page', 'editable', 'selection'] },
  'wait-for': { title: 'wait for <element>', contexts: ['page', 'editable', 'selection']  },
  'mouse-down': { title: 'mouse down <element>', contexts: ['page', 'editable', 'selection']  },
  'mouse-up': { title: 'mouse up <element>', contexts: ['page', 'editable', 'selection']  },
  'set-value': { title: 'set value <element> <value>', contexts: ['page', 'editable', 'selection']  },
  'verify-disabled': { title: 'verify disabled <element>', contexts: ['page', 'editable', 'selection']  },
  'verify-enabled': { title: 'verify enabled <element>', contexts: ['page', 'editable', 'selection']  },
  'verify-present': { title: 'verify present <element>', contexts: ['page', 'editable', 'selection']  },
  'verify-not-present': { title: 'verify not present <element>', contexts: ['page', 'editable', 'selection']  },
  'verify-visible': { title: 'verify visible <element>', contexts: ['page', 'editable', 'selection']  },
  'verify-not-visible': { title: 'verify not visible <element>', contexts: ['page', 'editable', 'selection']  },
  'verify-selected': { title: 'verify selected <element>', contexts: ['page', 'editable', 'selection']  },
  'enter-text': { title: 'enter text <element> <value>', contexts: ['editable'] },
  'verity-text': { title: 'verify text \'%s\'', contexts: ['selection'] },
  'verity-no-text': { title: 'verify no text \'%s\'', contexts: ['selection'] },
  'switch-to': { title: 'switch to <iframe>', contexts: ['frame'] }
};

var elementClicked;    // the element info, which is last clicked
var numContextMenus;

var defaultOptions = { // this will grow
  enabled: true        // enable/disable this extesion on context menu, popup, and webpage
};

chrome.runtime.onMessage.addListener(messageHandler);            // when message received
chrome.contextMenus.onClicked.addListener(menuItemClickHandler); // when contextmenu clicked
chrome.tabs.onActivated.addListener(broadcastOptions);
chrome.storage.onChanged.addListener(storageChangedHandler);

// when initiazlised, read options from storage
// then spread options to popup and webpage.
broadcastOptions(); 

function messageHandler(request, sender, sendResponse){
  console.log('background page : received a message', request);

  // webpage -> background
  if (request.type === 'webpage-contextmenu') {     // webpage contextmenu clicked
    elementClicked = request.data;
  } 

}

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
  addAction({command, target, value});
}

function addAction(action) {
  chrome.storage.sync.get('actions', function(result) {
    var actions = result.actions || [];
    actions.push(action);
    chrome.storage.sync.set({actions: actions}, function() {
      console.log("Saved a new action to storage");
    });
  }); 
}

// when tab is changed, chek if extension is enabled or not, and send message to the tab
function broadcastOptions(obj) {
  console.log('background:  detected tab change', obj);
  chrome.storage.sync.get(['options', 'actions'], function(result) {
    var options = result.options;
    var actions = result.actions;

    if (!options) {
      options = defaultOptions;
      chrome.storage.sync.set({options: options});
    }

    buildContextMenus(options);
    let message = {type: 'options-changed', data: options};
    chrome.runtime.sendMessage(message);
    obj && chrome.tabs.sendMessage(obj.tabId, message);

    if (actions) {
      chrome.browserAction.setBadgeText({"text": '' + actions.length});
    }
  });
}

// when storage is changed, send message to active tab
function storageChangedHandler(changes, storageName){
  console.log('background page : noticed that the storage data is changed', changes);

  if (changes.options && changes.options.newValue) {
    let options = changes.options.newValue;
    if (options.enabled !== changes.options.oldValue.enabled) {
      buildContextMenus(options);
    }

    let message = {type: 'options-changed', data: options};
    chrome.runtime.sendMessage(message);
    chrome.tabs.query({ active: true, currentWindow: true}, function(tabs) { // send message to active tab
      chrome.tabs.sendMessage(tabs[0].id, message);
    });
  }

  if (changes.actions && changes.actions.newValue) {
    chrome.browserAction.setBadgeText({"text": ''+changes.actions.newValue.length});
  }
}

function buildContextMenus(options) {
  if (!numContextMenus && options.enabled) {
    chrome.browserAction.setIcon({path: "images/icon16.png"})
    chrome.browserAction.setBadgeBackgroundColor({color: '#f00'});
    for (var id in contextMenus) {
      var contextMenu = Object.assign({id: id}, contextMenus[id]);
      chrome.contextMenus.create(contextMenu);
    }
    numContextMenus = Object.keys(contextMenus).length;
  } else if (numContextMenus && !options.enabled) {
    chrome.browserAction.setIcon({path: "images/icon-disabled.png"})
    chrome.browserAction.setBadgeBackgroundColor({color: '#ccc'});
    chrome.contextMenus.removeAll();
    numContextMenus = 0;
  }
}