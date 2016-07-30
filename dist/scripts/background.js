chrome.runtime.onInstalled.addListener(function (object) {
    chrome.tabs.create({url: chrome.extension.getURL('welcome.html')}, function (tab) {
    });
});