window.onload = init;
var options; // options from storage
var actions; // actions from storage

function init() {
  var enDisableEl = document.querySelector('#enable-disable');

  chrome.storage.sync.get(['options', 'actions'], function(result) {
    options = result.options;
    actions = result.actions;

    enDisableEl.innerHTML = options.enabled ? 'Disable' : 'Enable';
    buildActionsTable(actions);

    let sortable = new Sortable(
      document.querySelector('#actions-table section .actions'),
      {
        handle: '.command',
        onEnd: function(event) { saveActions() }
      }
    );
  });

  // when enable/disable clicked, save to storate and apply on this page
  enDisableEl.addEventListener('click', enableExtension);

  // remove all actions
  document.querySelector('#clear-actions').addEventListener('click', clearActions);

  // close this popup
  document.querySelector('#close').addEventListener('click', _ => close());

  // export button
  document.querySelector('#export-as-json').addEventListener('click', _ => exportAsJson());
}

function enableExtension(event) {
  options.enabled = !options.enabled;
  chrome.runtime.sendMessage({type: 'update-options', data: {enabled: options.enabled}});
  close();
}

function clearActions(event) {
  chrome.runtime.sendMessage({type: 'update-actions', data: []});
  buildActionsTable([]);
}

function buildActionsTable(actions) {
  let actionsSectionEl = document.querySelector('#actions-table section');
  let actionsEl = document.createElement('div');
  actionsEl.className = "actions";

  if (!actions.length) {
    actionsSectionEl.innerHTML = '<div class="empty">No actions found</div>';
  } else {
    actions.forEach(function(action) {
      let html = `<div class="action">
        <div class="command">${action.command}</div>
        <div class="target" contenteditable>${action.target}</div>
        <div class="value" contenteditable>${action.value || ''}</div>
      </div>`;
      actionsEl.insertAdjacentHTML('beforeend', html);
    });
  }

  // all editeable item contents will be saved when blur
  Array.from(actionsEl.querySelectorAll('[contenteditable]')).forEach(function(el) {
    el.addEventListener('blur', function(event) { saveActions()});
  });

  actionsSectionEl.appendChild(actionsEl);
}

function saveActions() {
  let parentEl = document.querySelector('#actions-table section .actions');
  let actions = [];

  Array.from(parentEl.querySelectorAll('.action')).forEach(actionDiv => {
    let command = actionDiv.querySelector('.command').innerHTML;
    let target = actionDiv.querySelector('.target').innerHTML;
    let value = actionDiv.querySelector('.value').innerHTML;
    actions.push({command, target, value});
  })
  chrome.runtime.sendMessage({type: 'update-actions', data: actions});
}

function exportAsJson() {
  let linkEl = document.querySelector('a#hidden-link-for-export');
  chrome.storage.sync.get('actions', function(result) {
    linkEl.setAttribute('href',
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result.actions))
    );
    linkEl.click(); 
  });
}