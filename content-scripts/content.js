(function(){
  var cssSelector = new CssSelectorGenerator();

  document.body.addEventListener('contextmenu', contextMenuHandler);
  chrome.runtime.onMessage.removeListener(messageHandler);

  // handle message
  function messageHandler(request, sender, sendResponse) {
    console.log('web page received a message', request);

    // popup -> webpage
    if (request.type === 'enable-extension') {
      if (request.data) {
        document.body.addEventListener('contextmenu', contextMenuHandler);
      } else {
        document.body.removeEventListener('contextmenu', contextMenuHandler);
      }
    }
    
    if (changes.options.newValue) {
      // TODO 
    }
  }

  // when right-click, send clicked element property to extension
  function contextMenuHandler(event) {
    let selector = cssSelector.getSelector(event.target);
    let message = {
      type: 'webpage-contextmenu',
      data: {
        selector: selector,
        tagName: event.target.tagName, // input, textarea, select, button
        type: event.target.type,
        value: event.target.value
      }
    };
    chrome.runtime.sendMessage(message);
    console.log('webpage sent a messagse', message);
  }

})();