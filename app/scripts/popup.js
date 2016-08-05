/*
 * Copyright 2016 Robert Hönig
 * contact : indielievs010 <at> gmail.com
 * 
 * This file is part of The Great Grouper.
 *
 *   The Great Grouper is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU Lesser General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *   (at your option) any later version.
 *
 *   The Great Grouper is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU Lesser General Public License for more details.
 *
 *   You should have received a copy of the GNU Lesser General Public License
 *   along with The Great Grouper.  If not, see <http://www.gnu.org/licenses/>.
 */
(function() {

function detectExtension(extensionId, callback) {
	chrome.management.get (extensionId, function (result) {
		if (result && result.enabled) {
			callback (true);
		} else {
			callback (false);
		}
	});
}

function processable(url) {
	return ( url.indexOf("https://chrome.google.com") != 0) && (url.indexOf("http://") == 0 || url.indexOf("https://") == 0 || url.indexOf("www.") == 0);
}

function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function openContextMenu (idx) {
	var context_container = document.createElement("div");
	var group_button = document.getElementById ("group"+idx);
	context_container.id = "context_container"+idx;
	context_container.style.width = "24em";
	insertAfter (context_container, group_button);
 	var container = document.getElementById("context_container"+idx);
  	var prototype = document.getElementById("group");
  	chrome.storage.local.get('groups', function(groups) {
		var selected_group = groups.groups[idx];
		Array.from(selected_group.tabs).forEach (function(tab, idxTab) {
			var new_tab = prototype.cloneNode(true);
			var url = tab.url;
			var name = tab.title;
			var img = document.createElement ("img");
			var open_button = new_tab.getElementsByTagName("button")[0];
			var remove_button = new_tab.getElementsByTagName("button")[1];
			var open_button_text = open_button.childNodes[0];

			img.src = "chrome://favicon/"+tab.url;
			img.className = "icon horizontal";
			open_button_text.className = "select-button-text";
			open_button.insertBefore (img, open_button_text);
			new_tab.style.display = '';
			new_tab.id = "opentab"+idx+","+idxTab;
			open_button.getElementsByTagName("div")[0].innerHTML = name;
			open_button.onclick = function () {restoreTab(url); };
			remove_button.id = "removetab"+idx;
			remove_button.onclick = function () { removeTab(idx, idxTab); };
			container.appendChild (new_tab);
		});
	});
}

function removeContextMenu (idx) {
	var container = document.getElementById ("context_container"+idx);
	container.parentNode.removeChild(container);
	//container.outerHTML = "";
}

function removeTab (idxGroup, idxTab) {
	 chrome.storage.local.get('groups', function(groups) {
	  var group_array = groups.groups;
	  var tab_array = group_array[idxGroup].tabs;
	  chrome.bookmarks.remove (String(tab_array[idxTab].bookmark_id));
	  if (tab_array != null) {
	    tab_array.splice(idxTab, 1);
	  } else {
	    throw "remove on empty group array";
	  }
   	  chrome.storage.local.set({'groups': group_array}, function() {
	  });
  	});
	var tab = document.getElementById("opentab"+idxGroup+","+idxTab);
	tab.parentNode.removeChild(tab);
}

function b64toBlob(b64Data, contentType, sliceSize) {
  contentType = contentType || '';
  sliceSize = sliceSize || 512;

  var byteCharacters = atob(b64Data);
  var byteArrays = [];

  for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    var slice = byteCharacters.slice(offset, offset + sliceSize);

    var byteNumbers = new Array(slice.length);
    for (var i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    var byteArray = new Uint8Array(byteNumbers);

    byteArrays.push(byteArray);
  }

  var blob = new Blob(byteArrays, {type: contentType});
  return blob;
}

function removeGroup (idx) {
  chrome.storage.local.get('groups', function(groups) {
	  var group_array = groups.groups;
	  if (group_array != null) {
	  	chrome.bookmarks.removeTree(String(group_array[idx].bookmark_id));
	    group_array.splice(idx, 1);
	  } else {
	    throw "remove on empty group array";
	  }
          chrome.storage.local.set({'groups': group_array}, function() {
	    updateGroups();
	  });
  });
}

function updateGroups() {
  var container = document.getElementById("groups_container");
  var prototype = document.getElementById("group");
  chrome.storage.local.get('groups', function(groups) {
	groups = groups.groups;
	 while (container.firstChild) {
	   container.removeChild(container.firstChild);
	 }
	 if (groups != null) {
	   Array.from(groups).forEach (function(group, idx) {
	     var new_group = prototype.cloneNode(true);
	     var name = group.name;
	     new_group.id = "group"+idx;
			 new_group.style.display = '';
	     var conserve_button = new_group.getElementsByTagName("button")[0];
	     var remove_button = new_group.getElementsByTagName("button")[1];
	     var expand_button = remove_button.cloneNode(true);

	     expand_button.getElementsByTagName("img")[0].src = "images/expand.png";
	     $(expand_button).removeClass("w3-hover-red w3-grey");
	     $(expand_button).addClass("w3-hover-white w3-light-grey");
	     expand_button.style = "width: "+(80/5)+"% !important;";
	     conserve_button.style = "width: "+(80-(80/5))+"% !important;"
	     expand_button.addEventListener("click",
	     	function (e) {
				if (document.getElementById("context_container"+idx) == null) {
					openContextMenu(idx);
				} else {
					removeContextMenu(idx);						
				}
	     	}
	     );
		 insertAfter(expand_button, conserve_button);
	     
	     conserve_button.getElementsByTagName("div")[0].innerHTML = name;
	     conserve_button.id = "conserve"+idx;
	     conserve_button.addEventListener("click", 
			 function (e) {			
				restoreTabs(e, idx); 
			});

	     remove_button.id = "remove"+idx;
	     remove_button.onclick = function () { removeGroup(idx); };
		 remove_button.title = chrome.i18n.getMessage("popupRemoveGroupButton");
	
	     container.appendChild (new_group);
	  });
	 }
	});
}

function restoreTab (URL) {
	chrome.tabs.create ({url: URL});
}

function openTabs (urls, windowId, openCached) {
	urls.forEach (function (url) {
		if (openCached == true) {
			chrome.storage.local.get(String(url), function (blop) {
				if (chrome.runtime.lastError) {
					console.error("get error!");
				}
				if (blop[url] == null) {
					chrome.tabs.create ({"url" : url, active: false, windowId : windowId});
				} 
				else {
					var newBlob = b64toBlob (blop[url].substr(blop[url].indexOf(',')+1), "text/html");
					contentUrl = URL.createObjectURL (newBlob);
					chrome.tabs.create ({"url" : contentUrl, active: false, windowId : windowId});
				}
			});
		} 
		else {
			chrome.tabs.create ({"url" : url, active: false, windowId : windowId});
		}
	});
}

function restoreTabs (e, idx, options = {default : true}) {
  chrome.storage.local.get('groups', function(groups) {
	var tabs = groups.groups[idx].tabs;
	var urls = [];
	tabs.forEach (function (tab) {
	urls.push(tab.url);
	});
	chrome.storage.local.get ({openCached : true, openNew : true}, function (result) {

		if (e.shiftKey || (options.default == true && result.openNew == false)) {
			chrome.windows.getCurrent (function (window) {
				openTabs (urls, window.id, result.openCached);
			});
		} else {
			chrome.windows.create(function(window) {
				chrome.windows.update(window.id, { focused: true });
				openTabs (urls, window.id, result.openCached);
				setTimeout(function () {chrome.tabs.remove (window.tabs[0].id);}, 100);
			});
		}

	});
  });
}

//store urls of tabs in a group in local storage
function conserveTabs (event, options = {default : true}) {
  var name = document.getElementById ("group_name").value;
  chrome.windows.getCurrent(function(win)
  {
    chrome.tabs.getAllInWindow(win.id, function(tabs)
    {
		chrome.storage.local.get('groups', function(groups) {
			var group_array = groups.groups;
			var missingcoreCreated = false;
			tabs_included = [];
			//get all tabs selected in tab list
			tabs.forEach (function (tab, idx) {
				if (document.getElementById("statebutton"+idx).is_activated) {
					
					chrome.storage.local.get ({ cacheTabs: false,
    											closeTabs: false}, function (result) {
						
						if (result.cacheTabs) {
							var dev = false;
							var isChrome = true;
							var SINGLE_FILE_CORE_EXT_ID = dev ? "onlinihoegnbbcmeeocfeplgbkmoidla" : isChrome ? "jemlklgaibiijojffihnhieihhagocma" : "ejmpikefailopkdnglnenfhpepfoghnn";
							detectExtension(SINGLE_FILE_CORE_EXT_ID, function(detected) {
								if (detected) {
									var closeTab = false;
									if( (event.shiftKey || (options.default == true && result.closeTabs == true)) ) {
										closeTab = true;
									}
									if (processable(tab.url)) {
										chrome.runtime.sendMessage({
											saveTab : true,
											tab : tab,
											closeTab : closeTab
										});
									} else {
										if (closeTab) {
											chrome.tabs.remove (tab.id);
										}
									}
								} else {
									if (missingcoreCreated == false) {
										chrome.tabs.create({
											url : "scripts/ui/pages/missingcore.html"
										});
										missingcoreCreated = true;
									}
								}
							});

						}
						tabs_included.push (tab);
					});
				}
			});

			tabs = tabs_included;

			var bookmark_id = '';
			chrome.bookmarks.create ({parentId: localStorage["bookmark_parent"], title : name}, function (result) {
				
				bookmark_id = result.id;
				
				var numAllCallbacks = tabs.length;
				var numCallbacks = 0;
				tabs.forEach (function (tab) {
					
					chrome.bookmarks.create ({parentId : bookmark_id, title : tab.title, url : tab.url}, function (result) {
						
						tab.bookmark_id = result.id;

						++numCallbacks;
						if (numCallbacks == numAllCallbacks) {
							//push selected tabs to group list
							if (group_array != null) {
								group_array.push({name, tabs, bookmark_id});
							}
							else {
								group_array = [{name, tabs, bookmark_id}];
							}
							chrome.storage.local.set({'groups': group_array}, function() {
								//show the new group in group list
								updateGroups();
							});
						}
					});
				});
			});
		});
    });
  });
}

chrome.runtime.onMessage.addListener(function(message, sender) {
	if (message.finishedStoring) {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', message.blobUrl, true);
		xhr.responseType = 'blob';
		xhr.onload = function(e) {
		  if (this.status == 200) {
		    var myBlob = this.response;
		    var contentUrl = message.tab.url;
		    var reader = new window.FileReader();
 			reader.readAsDataURL(myBlob); 
 			reader.onloadend = function() {
                var base64data = reader.result;                
                var contentObject = {};
			    contentObject[contentUrl] = base64data;
		    	chrome.storage.local.set(contentObject);
  			}
  			if (message.closeTab == true) {
  				chrome.tabs.remove (message.tab.id);
  			}
		  }
		};

		xhr.send();
	}
});

//display current open tabs for user, to select which ones to conserve
function initializeTabsSelection () {
	chrome.windows.getCurrent(function(win)
  {
    chrome.tabs.getAllInWindow(win.id, function(tabs)
    {
			var placeholder = document.getElementById("placeholder_img"); //contains list of tabs
			var input = document.getElementById("input_container");
			var padding = input.offsetHeight*0.1;
			var container = document.getElementById("tab_selection_container");
			var prototype = document.getElementById("group"); //element displaying one tab
			
			placeholder.height = input.offsetHeight;
			placeholder.style.marginBottom = "0px";
			placeholder.style.padding = padding+"px 0px "+padding+"px 0px";
			
		  Array.from(tabs).forEach (function(tab, idx) {
				var new_tab = prototype.cloneNode(true);
				var name = tab.title;
				var img = document.createElement ("img");
				var select_button = new_tab.getElementsByTagName("button")[0];
				var state_button = new_tab.getElementsByTagName("button")[1];
				var select_button_text = select_button.childNodes[0];

				//new item for displaying tab 
				new_tab.id = "selectiontab"+idx;
				new_tab.style.display = '';
				
				//tab icon
				img.src = "chrome://favicon/"+tab.url;
				img.className = "icon horizontal";
				
				//displaying tab title and icon
				select_button_text.className = "select-button-text";
				select_button.insertBefore (img, select_button_text);
				select_button.getElementsByTagName("div")[0].innerHTML = name;
				select_button.id = "selectbutton"+idx;
				select_button.disabled = true;
				select_button.style = "cursor:auto !important; opacity:1 !important;";
				select_button.title = tab.url;

				//Select tab to include it in group
				state_button.id = "statebutton"+idx;
				state_button.getElementsByTagName("img")[0].src = "images/check64.png";
				state_button.onclick = function () {};
				state_button.is_activated = true;
				state_button.title = chrome.i18n.getMessage("hovertextIncludeTab");
				state_button.onclick = function () {
					state_button.is_activated = !state_button.is_activated;
					if (state_button.is_activated) {
						state_button.style = "opacity: 1 !important";
					}
					else {
						state_button.style = "opacity: 0.3 !important";
					}
				};
				state_button.onmouseenter = function () {
				timeoutID = window.setTimeout (state_button.onclick, 0);
				};
				state_button.onmouseout = function () {
					if (timeoutID) {
						window.clearTimeout(timeoutID);
						timeoutID = null;
					}
				}
				container.appendChild (new_tab);
			});
    });
  });
}

function openOptions () {
	chrome.tabs.create({url : chrome.i18n.getMessage("optionsPage")});
}

function createContextMenu () {
chrome.contextMenus.create ({id:"context_options", title: chrome.i18n.getMessage("optionsContextMenu"), onclick : openOptions});
}

function initialize () {
	//set and autoselect input text for name of the new group
  var input = document.getElementById("group_name");
	chrome.windows.getCurrent(function(win)
  {
		//count number of tabs
		chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) { 
			chrome.tabs.getAllInWindow(win.id, function(tabsCnt){
				input.value = tabs[0].title+" - "+tabsCnt.length+" Tabs";
				input.focus()
				input.select();
			});
			//conserve tabs by pressing enter
			input.addEventListener("keyup", function(event) {
				event.preventDefault();
				if (event.keyCode == 13) {
					document.getElementById("conserve_tabs").click();
				}
			});
		});
	});
	
	//conserve tabs by pressing the button
 	document.getElementById("conserve_tabs").addEventListener ("click", conserveTabs);
	
	initializeTabsSelection();

	createContextMenu();

}

//load popup
window.onload = function() {
  localizeHtmlPage();
  initialize();
  updateGroups();
};

})();
