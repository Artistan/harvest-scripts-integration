// ==UserScript==
// @name         Harvest Gitlab Integration
// @namespace    https://artistan.org/
// @version      0.1
// @description  Harvest button integration with Git* pages
// @author       InfiniteRed
// @source       https://github.com/Artistan/harvest-scripts-integration//blob/master/harvest_git_integration.user.js
// @include      http://*git*/*
// @include      https://*git*/*
// @require      https://ajax.googleapis.com/ajax/libs/jquery/2.2.4/jquery.min.js
// @require      https://platform.harvestapp.com/assets/platform.js
// @grant        none
// ==/UserScript==



/**
https://github.com/Artistan/harvest-scripts-integration/issues/1
must override CSP for github or use their custom plugin for github.
*/

jQuery.noConflict();

var IV = {};

IV.pageState = {
    currentHash: '',
    UserGroup: '',
    Repo: '1',
    action: '1',
    itemId: '1',
    harvestIsReady: false
};

IV.selectors = {
    harvestInvisionTimer: ".harvest-timer",
    assignment: ".btn:contains('Comment'),.btn:contains('Commit'),.btn:contains('Close'),.btn:contains('New'),.btn:contains('Edit')",
    harvestMessaging: "#harvest-messaging"
};

IV.setStateFromHash = function () {
    IV.pageState.currentHash = window.location.pathname;
    var hashArray = window.location.pathname.split('/');
    IV.pageState.UserGroup = hashArray[1];
    IV.pageState.Repo = hashArray[2];
    IV.pageState.action = hashArray[3];
    IV.pageState.itemId = hashArray.pop();
};

IV.handlePageState = function () {
   IV.setStateFromHash();
   IV.injectPlaceholderButton();
};

IV.getPlatformConfig = function () {
    var hostLink = window.location.href;
    return {
        applicationName: "GitRepository",
        permalink: hostLink,
        skipStyling: true
    };
};

IV.initialize = function () {
    // inject Harvest platform config script
    var harvestPlatformConfigScript = 'window._harvestPlatformConfig = ' + JSON.stringify(IV.getPlatformConfig()) + ';';
    jQuery('<script>')
    .attr('type', 'text/javascript')
    .text(harvestPlatformConfigScript)
    .appendTo('head');

    jQuery('<style>')
    .attr('type', 'text/css')
    .text('.harvest-timer.styled { box-sizing: content-box;}')
    .appendTo('head');

   IV.handlePageState();
};

IV.onHashChange = function () {
   IV.handlePageState();
};

IV.buildTimer = function () {
   var timer = jQuery('<div/>', {
    "text": "Harvest",
    "class" : "hidden-xs hidden-sm btn btn-grouped btn-warning btn-inverted harvest-timer",
    "data-item": '{"id": ' + IV.pageState.itemId + ', "name": "' + '' + IV.pageState.UserGroup + '/' + IV.pageState.Repo + ' :: ' + IV.pageState.action + '"}',
    "data-account": '{"id": ' + IV.pageState.UserGroup + '}',
    "data-default": '{"proeject_name": ' + IV.pageState.UserGroup + '/' + IV.pageState.Repo + ' :: ' + IV.pageState.action + '}'
   });
   jQuery(IV.selectors.assignment).parent('div').append(timer);
   jQuery("div:not([class*=group]):not([class*=issuable-actions]) > div.harvest-timer").removeClass('btn-grouped');
   if (jQuery(IV.selectors.harvestInvisionTimer).length) {
       jQuery(IV.selectors.harvestInvisionTimer).each(function(){
           jQuery(IV.selectors.harvestMessaging).trigger({
               type: "harvest-event:timers:add",
               element: jQuery(this)
           });
       });
   } else {
       alert('Git* Harvest Integration: DOM injection of the new timer failed');
   }
};

IV.isReadyToInjectTimer = function () {
    console.log(
         'IV.selectors.assignment',jQuery(IV.selectors.assignment).parent('div').length,
         'HarvestPlatform.origin',typeof HarvestPlatform.origin === "string",
         'IV.selectors.harvestMessaging',jQuery(IV.selectors.harvestMessaging).length
    );
    return jQuery(IV.selectors.assignment).parent('div').length && typeof HarvestPlatform.origin === "string" && jQuery(IV.selectors.harvestMessaging).length;
};

IV.whenReadyForTimer = function(callback) {
    var poll;
    poll = (function(_this) {
        return function() {
            if (!IV.isReadyToInjectTimer()) {
                return;
            } else {
                window.clearInterval(_this.interval);
                callback();
            }
        };
    })(this);
    window.clearInterval(this.interval);
    this.interval = window.setInterval(poll, 200);
};

IV.injectPlaceholderButton = function () {
    IV.whenReadyForTimer(IV.buildTimer);
};

jQuery(document).ready(function (){
    'use strict';
    IV.initialize();

    function TrackHash() {
        if (IV.pageState.currentHash !== window.location.hash) {
            IV.onHashChange();
        }
        return false;
    }
    setInterval(TrackHash, 200);

    jQuery("body").on("harvest-event:ready", function () {
        IV.pageState.harvestIsReady = true;
    });
});

