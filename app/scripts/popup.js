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
			open_button_text.className = "select-button-text";
			img.src = "chrome://favicon/"+tab.url;
			img.className = "icon horizontal";
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

function restoreTab (URL) {
	chrome.tabs.create ({url: URL});
}

function removeTab (idxGroup, idxTab) {
	  chrome.storage.local.get('groups', function(groups) {
		var group_array = groups.groups;
	  var tab_array = group_array[idxGroup].tabs;
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

function restoreTabs (e, idx) {
  chrome.storage.local.get('groups', function(groups) {
	  var tabs = groups.groups[idx].tabs;
	  var urls = [];
	  tabs.forEach (function (tab) {
	    urls.push(tab.url);
	  });
		if (e.shiftKey) {
			urls.forEach (function (url) {
				chrome.tabs.create ({url});
		});
		} else {
			chrome.windows.create({ url: urls }, function(win) {
				chrome.windows.update(win.id, { focused: true });
				window.close();
			});
		}
  });
}

function removeGroup (idx) {
  chrome.storage.local.get('groups', function(groups) {
	  var group_array = groups.groups;
	  if (group_array != null) {
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
	     conserve_button.getElementsByTagName("div")[0].innerHTML = name;
	     conserve_button.id = "conserve"+idx;
	     conserve_button.addEventListener("click", 
			 function (e) {			
				restoreTabs(e, idx); 
			});
			 conserve_button.title="Right Click to Expand";
			 conserve_button.addEventListener ("contextmenu", function(e) {
				e.preventDefault();
			 }, false);
	     conserve_button.onmousedown = function (e) {
					if (e.which == 3) {
						if (document.getElementById("context_container"+idx) == null) {
							openContextMenu(idx);
						} else {
							removeContextMenu(idx);						
						}
					}
			 };
	     remove_button.id = "remove"+idx;
	     remove_button.onclick = function () { removeGroup(idx); };
			 remove_button.title = "Remove Group";
	     container.appendChild (new_group);
	  });
	 }
	});
}

//store urls of tabs in a group in local storage
function conserveTabs (event) {
  var name = document.getElementById ("group_name").value;
  chrome.windows.getCurrent(function(win)
  {
    chrome.tabs.getAllInWindow(win.id, function(tabs)
    {
			chrome.storage.local.get('groups', function(groups) {
				var group_array = groups.groups;
				tabs_included = [];
					//get all tabs selected in tab list
					tabs.forEach (function (tab, idx) {
						if (document.getElementById("statebutton"+idx).is_activated) {
							tabs_included.push (tab);
							if(event.shiftKey) {
								chrome.tabs.remove (tab.id);
							}
						}
				});
				tabs = tabs_included;
				
				//push selected tabs to group list
				if (group_array != null) {
					group_array.push({name, tabs});
				}
				else {
					group_array = [{name, tabs}];
				}
				chrome.storage.local.set({'groups': group_array}, function() {
					//show the new group in group list
					updateGroups();
				});
			});
    });
  });
}

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
				state_button.title = "Include in Group";
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

function initialize () {
	//set and autoselect input text for name of the new group
  var input = document.getElementById("group_name");
	chrome.windows.getCurrent(function(win)
  {
		//count number of tabs
		chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) { 
			chrome.tabs.getAllInWindow(win.id, function(tabsCnt){
				input.value = tabs[0].title+" - "+tabsCnt.length+" tabs";
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
}

//load popup
window.onload = function() {
  initialize();
  updateGroups();
};