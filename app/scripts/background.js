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
chrome.runtime.onInstalled.addListener(function (object) {
    chrome.tabs.create({url: chrome.extension.getURL(chrome.i18n.getMessage("welcomePage"))});
    chrome.bookmarks.create ({title : chrome.i18n.getMessage("bookmarkTitle")}, function (result) {
		localStorage["bookmark_parent"] = result.id;
    });
    chrome.storage.local.set({
	    cacheTabs: false,
	    closeTabs: false,
	    openCached: true,
	    openNew: true
 	});
});
