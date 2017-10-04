(function(){
  var cssSelector = new CssSelectorGenerator();

  document.body.addEventListener('contextmenu', contextMenuHandler);
  chrome.runtime.onMessage.addListener(messageHandler);

  // handle message
  function messageHandler(request, sender, sendResponse) {
    console.log('web page received a message', request);

    // popup -> webpage
    if (request.type === 'options-changed') {
      if (request.data.enabled) {
        document.body.addEventListener('contextmenu', contextMenuHandler);
      } else {
        document.body.removeEventListener('contextmenu', contextMenuHandler);
      }
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
    try {
      chrome.runtime.sendMessage(message);
    } catch(e) {
      if (
        e.message.match(/Invocation of form runtime\.connect/) && 
        e.message.match(/doesn't match definition runtime\.connect/)
      ) {
        console.error('Chrome extension, Actson has been reloaded. Please refersh the page'); 
      } else {
        throw(e);
      }
    }
    console.log('webpage sent a messagse', message);
  }

})();