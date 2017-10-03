var extensionEnabled = true; // TODO, this has to be from storage!!!!

// send message to tab
document.querySelector('#send-message-to-active-tab').addEventListener('click', function(event) {
  let message = {type: 'perform-action', data: {}};
  sendMessageToActiveTab(message);
});

// receive a message
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
  log('popup received a message' + JSON.stringify(request));
});

// read from storage
document.querySelector('#read-from-storage').addEventListener('click', function(event) {
  chrome.storage.sync.get('test', function(data) {
    log('get data from storage' + JSON.stringify(data));
  });
});

// write to storage
document.querySelector('#write-to-storage').addEventListener('click', function(event) {
  let num=0; data = {test: num++};
  chrome.storage.sync.set(data, function() {  
    log('saved data to storage' + JSON.stringify(data));
  });
});

// enable / disable
document.querySelector('#enable-disable').addEventListener('click', function(event) {
  extensionEnabled = !extensionEnabled;
  event.target.innerHTML = extensionEnabled ? 'Disable' : 'Enable';
  let message = {type: 'enable-extension', data: extensionEnabled};
  sendMessageToActiveTab(message);
  chrome.runtime.sendMessage(message);
});

function log(msg) {
  let el = document.querySelector('#log');
  el.innerHTML = el.innerHTML + msg+"\n";
}

// send message to tab
function sendMessageToActiveTab(message) {
  chrome.tabs.query({ active: true, currentWindow: true}, function(tabs) {
    let tabId = tabs[0].id;
    chrome.tabs.sendMessage(tabId, message);
    log('popup is sending message' + JSON.stringify(message) + 'to active tab, ' + tabId);
  });
}
