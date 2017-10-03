var enableExtEl = document.querySelector('#enable-disable');
var options; // updated from storage

var log = function(msg) {
  let el = document.querySelector('#log');
  el.innerHTML = el.innerHTML + msg+"\n";
};

chrome.runtime.onMessage.addListener(messageHandler);
chrome.storage.onChanged.addListener(storageChangedHandler);
window.onload = init;

enableExtEl.addEventListener('click', function(event) {
  options.enabled = !options.enabled;
  console.log('>>>>>>>>>>> updating storage', options);
  chrome.storage.sync.set({options: options});
});


function init() {
  chrome.storage.sync.get('options', function(result) {
    options = result.options;
  });
}

// when storage data (enabled / actions) changed, update UI
function storageChangedHandler(changes, storageName){
  console.log('popup page : noticed that the storage data is changed', changes);

  if (changes.options.newValue) {
    options = changes.options.newValue;
    applyOptions();
  }

  if (changed.actions && changes.actions.newValue) {
    chrome.browserAction.setBadgeText({"text": changes.actions.newValue.length});
  }
}

function applyOptions() {
  enableExtEl.innerHTML = options.enabled ? 'Disable' : 'Enable';
}

function messageHandler(request, sender, sendResponse){
  log('popup received a message' + JSON.stringify(request));

  // nada for now
}