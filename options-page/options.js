function log(msg) {
  let el = document.querySelector('#log');
  el.innerHTML = el.innerHTML + msg+"\n";
}

chrome.storage.sync.get('options', function(result) {
  var options = result.options;
  // TODO update UI
});

function updateOption(options) {
  chrome.storage.sync.set({options: options});
};