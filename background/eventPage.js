/**
 * A common need for apps and extensions is to have a single long-running
 * script to manage some task or state. Event pages to the rescue. Event
 * pages are loaded only when they are needed. When the event page is not
 * actively doing something, it is unloaded, freeing memory and resources.
 * e.g. when contextMenu is clicked, a storage item is updated 
 */
var elementClicked;

var contextMenus = [
  { id: 'click', title: 'click <element>', contexts: ['page', 'editable'] },
  { id: 'wait-for', title: 'wait for <element>', contexts: ['page', 'editable']  },
  { id: 'mouse-down', title: 'mouse down <element>', contexts: ['page', 'editable']  },
  { id: 'mouse-up', title: 'mouse up <element>', contexts: ['page', 'editable']  },
  { id: 'set-value', title: 'set value <element> <value>', contexts: ['page', 'editable']  },
  { id: 'verify-disabled', title: 'verify disabled <element>', contexts: ['page', 'editable']  },
  { id: 'verify-enabled',  title: 'verify enabled <element>', contexts: ['page', 'editable']  },
  { id: 'verify-present', title: 'verify present <element>', contexts: ['page', 'editable']  },
  { id: 'verify-not-present', title: 'verify not present <element>', contexts: ['page', 'editable']  },
  { id: 'verify-visible', title: 'verify visible <element>', contexts: ['page', 'editable']  },
  { id: 'verify-not-visible', title: 'verify not visible <element>', contexts: ['page', 'editable']  },
  { id: 'verify-selected', title: 'verify selected <element>', contexts: ['page', 'editable']  },
  { id: 'enter-text', title: 'enter text <element> <value>', contexts: ['editable']},
  { id: 'verity-text', title: 'verify text %s', contexts: ['selection']},
  { id: 'verity-no-text', title: 'verify no text %s', contexts: ['selection']},
  { id: 'switch-to', title: 'switch to <iframe>', contexts: ['frame']}
];

chrome.runtime.onMessage.addListener(messageHandler);            // when message received

contextMenus.forEach(ctxMenu => chrome.contextMenus.create(ctxMenu) );
chrome.contextMenus.onClicked.addListener(menuItemClickHandler); // when contextmenu clicked
chrome.storage.onChanged.addListener(storageChangedHandler);    // wnen storage changed


function messageHandler(request, sender, sendResponse){
  console.log('background page received a message', request);
  if (request.type === 'webpage-contextmenu') {     // webpage contextmenu clicked
    elementClicked = request.data;
  } else if (request.type === 'enable-extension') { // enable/disable command from popup
    if (request.data === true) { // enable
      contextMenus.forEach(ctxMenu => chrome.contextMenus.create(ctxMenu) );
    } else { // disable
      chrome.contextMenus.removeAll();
    }
  }
}

function storageChangedHandler(changes, storageName){
  console.log('background page notified that the storage data is changed', changes);
  //chrome.browserAction.setBadgeText({"text": changes.total.newValue.toString()});
}

function menuItemClickHandler(clickData) {
  // do something for tag input, textarea, select, button with type and value
  console.log('menuItem is clicked', clickData.menuItemId, elementClicked, ' and sending message');
  chrome.runtime.sendMessage({type: 'menuitem-clicked', data: clickData});
}