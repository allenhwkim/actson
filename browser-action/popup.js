var enableExtEl = document.querySelector('#enable-disable');
var options; // updated from storage

var log = function(msg) {
  let el = document.querySelector('#log');
  el.innerHTML = el.innerHTML + msg+"\n";
};

window.onload = init;

// when enable/disable clicked, save to storate and apply on this page
enableExtEl.addEventListener('click', function(event) {
  options.enabled = !options.enabled;
  chrome.storage.sync.set({options: options});
  applyOptions();
  close();
});


function init() {
  chrome.storage.sync.get('options', function(result) {
    options = result.options;
    applyOptions(options);
  });
}

function applyOptions() {
  enableExtEl.innerHTML = options.enabled ? 'Disable' : 'Enable';
}
