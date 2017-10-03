function log(msg) {
  let el = document.querySelector('#log');
  el.innerHTML = el.innerHTML + msg+"\n";
}

// get from storage
document.querySelector('#get-from-storage').addEventListener('click', function(event) {
  chrome.storage.sync.get('test',function(data){
    log('options page received from storage. ' + JSON.stringify(data));
  });
});

// save to storage
document.querySelector('#save-to-storage').addEventListener('click', function(event) {
  let data = {test: 2};
  chrome.storage.sync.set(data);
  log('options page saving to storage ' + JSON.stringify(data));
});

