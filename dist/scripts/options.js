/*
The save_options() and restore_options() functions are taken from Google: 
https://developer.chrome.com/extensions/options
Google developed those functions
*/
// Saves options to chrome.storage
function save_options() {
  var cache = document.getElementById('cache').checked;
  var close = document.getElementById('close').checked;
  var cached = document.getElementById('cached').checked;
  var newW = document.getElementById('new').checked;
  chrome.storage.local.set({
    cacheTabs: cache,
    closeTabs: close,
    openCached: cached,
    openNew: newW
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = chrome.i18n.getMessage("optionsPageSaved");
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  chrome.storage.local.get({
    cacheTabs: false,
    closeTabs: false,
    openCached: true,
    openNew: true
  }, function(items) {
    document.getElementById('cache').checked = items.cacheTabs;
    document.getElementById('close').checked = items.closeTabs;
    document.getElementById('cached').checked = items.openCached;
    document.getElementById('new').checked = items.openNew;
  });
}

localizeHtmlPage();
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);
