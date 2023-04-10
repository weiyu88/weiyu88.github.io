/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// Create the instances of some classes/objects
var socket;

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        // Push Notification Permission
        if (typeof FCMPlugin !== 'undefined') {
            FCMPlugin.requestPushPermissionIOS(
                function(wasPermissionGiven) {
                    console.info("FCM Permission was given: "+wasPermissionGiven);
                },
                function(error) {
                    console.error("FCM Permission Error: "+error);
                }
            );
        }

        if (typeof Socket !== 'undefined') {
            // Create the instances of some classes only if cordova
            socket = new Socket();
        }

        // Check if it's iphone then update it's viewport
        if (typeof device !== 'undefined') {
            if (device.model.indexOf('iPhone') !== -1) {
                var modelSplit = device.model.split(',');

                // Get the version number
                var version = parseInt(modelSplit[0].replace('iPhone', ''));

                // Check if it is a number
                if (!isNaN(version)) {
                    // Check if the version is greater than ten
                    // if (version >= 10) {
                        $('meta[name=viewport]').attr('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=1, height=device-height, viewport-fit=cover');

                        // Remove those spaces that are affecting the visuals
                        var style = [
                            'padding-top: env(safe-area-inset-top, constant(safe-area-inset-top, 0px))',
                            'height: calc(100% - env(safe-area-inset-top, constant(safe-area-inset-top, 0px)) - env(safe-area-inset-bottom, constant(safe-area-inset-bottom, 0px)))',
                            'min-height: calc(100% - env(safe-area-inset-top, constant(safe-area-inset-top, 0px)) - env(safe-area-inset-bottom, constant(safe-area-inset-bottom, 0px)))',
                            'padding-left: env(safe-area-inset-left, constant(safe-area-inset-left, 0px))',
                            'padding-right: env(safe-area-inset-right, constant(safe-area-inset-right, 0px))',
                            'width: calc(100% - env(safe-area-inset-left, constant(safe-area-inset-left, 0px)) - env(safe-area-inset-right, constant(safe-area-inset-right, 0px)))'
                        ];
                        $('body').attr('style', style.join(';'));
                    // }
                }
            }
        }

        if (typeof Keyboard !== 'undefined' && typeof Keyboard.hideFormAccessoryBar !== 'undefined') {
            // Hide the keyboard accessories
            Keyboard.hideFormAccessoryBar(false);
        }
        
        // Enable background mode if it's enabled
        if (typeof cordova.plugins !== 'undefined' && cordova.plugins.backgroundMode) {
            cordova.plugins.backgroundMode.enable();
        }

        /* 
            The following determines the 
            1. if the webview overlays the statusbar (e.g false = not overlap)
            2. backgroundColor of status bar (e.g black)
            3. color of status bar text (light = white color)
            These settings should be configured in cordova's config.xml but after adding all these, 
            the changes were not reflected (e.g. statusbar still overlaps with content),
            so adding the settings here instead overrides the config.xml settings.
            src: https://blog.kiprosh.com/setting-statusbar-manually-for-cordova-application-using-cordova-plugin-statusbar/
        */
        StatusBar.overlaysWebView(false);
        if (cordova.platformId == 'android') {
            // Setting statusbar to light text on black bg because StatusBar.styleDefault() is not working for Android
            StatusBar.backgroundColorByName("black");
            StatusBar.styleLightContent();
        } else {
            StatusBar.styleDefault();
        }

        // Load the main function to display the first page
        emobiqApp._appLoad();
    }
};
app.initialize();