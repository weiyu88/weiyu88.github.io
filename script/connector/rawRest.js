var connectorRawRest = (function(){

    /**
     * List of allowed http methods
     */
    var methods = ['get','post','put','patch','head','delete','options'];
    
    /**
     * Http methods are for data 
     */
    var dataMethods = ['post','put','patch'];
    
    /**
     * Process the files if there's any
     * 
     * @param {object|Blob|ArrayBuffer} files
     * @param {object} data
     * @returns {cordova.plugin.http.ponyfills.FormData}
     */
    function processFiles(files, data) {
        if (files instanceof Blob) {
            // ignore the data just send the file
            cordova.plugin.http.setDataSerializer('raw');
            // returns a Promise object or the Blob if ArrayBuffer is not available
            return typeof files.arrayBuffer !== 'undefined' ? files.arrayBuffer() : files;
        } else if ((files instanceof ArrayBuffer) || (files instanceof Uint8Array)) {
            // ignore the data just send the file
            cordova.plugin.http.setDataSerializer('raw');
            // returns the arraybuffer 
            return files;
        } else {
            // Check if there's file
            if (Object.keys(files).length > 0) {
                var formData = new cordova.plugin.http.ponyfills.FormData();

                // Go through all the files
                for (var i in files) {
                    // Check if the current file contains filename and data
                    if (files[i].filename && files[i].data) {
                        formData.append(i, files[i].data, files[i].filename);
                        continue;
                    }
                    // Normal file without filename
                    formData.append(i, files[i]);
                }

                // add the data
                for (var i in data) {
                    formData.append(i, data[i]);
                }

                // set the data serializer to multipart
                cordova.plugin.http.setDataSerializer('multipart');
                return formData;
            } else {
                return data;
            }
        }
    }

    /**
     * Send the official request to the web service 
     * This is using a cordova plugin (https://github.com/silkimen/cordova-plugin-advanced-http)
     * 
     * @param url string - the api url
     * @param parameters object - contains all the data passed from eMOBIQ
     * @param data string - the body to be send in the request
     * @param callback function - callback to be triggered after sending the request
     */
    function sendAPIRequest(url, parameters, data, callback, errorCallback) {
        // Get the Headers
        var headers = {
            "Accept-Encoding": "*"
        };
        if (parameters.header) {
             for (var key in parameters.header) {
                if (parameters.header[key]) {
                    var header = parameters.header[key].split(':', 2);
                    headers[header[0]] = header[1].trim();
                }
            }
        }
        
        // Get the method
        var method = 'get';
        if (parameters.method && methods.includes(parameters.method.toLowerCase())) {
            method = parameters.method.toLowerCase();
        }
        
        // Check if not an instance of FormData and ArrayBuffer
        if (!(data instanceof cordova.plugin.http.ponyfills.FormData) && !(data instanceof ArrayBuffer) && !(data instanceof Uint8Array)) {
            // if post,put,patch
            if (dataMethods.includes(method)) {
                var contentType = headers['Content-Type'] || headers['content-type'];
                if (contentType && contentType.match(/application\/json/)) {
                    data = JSON.stringify(data);
                } else if (contentType && contentType.match(/multipart\/mixed/)) {
                    // nothing to do
                } else {
                    data = utility.httpBuildQuery(data);
                }
            } else {
                url += (url.indexOf('?') === -1 ? '?' : '&') + utility.httpBuildQuery(data);
                data = undefined;
            }
        }

        // decode URI first, just in case this is already encoded
        url = encodeURI(decodeURI(url));
        
        // Get the parameter options
        var paramOptions = parameters.options || {};

        // Clear cookies first 
        // only allow user to use cookies function without it no cookies
        cordova.plugin.http.clearCookies();
        
        // Set cookies
        if (paramOptions.setCookies) {
            // Split the cookies by semicolon
            var cookies = paramOptions.cookies.split(";");

            // Add all the cookies
            for (var i in cookies) {
                // Trim the cookie
                var cookie = cookies[i].trim();

                var cookieParams = cookie.split('=');

                // Check if "expires" param
                if (cookieParams[0] == 'expires') {
                    cordova.plugin.http.setCookie(url, cookie, {});
                } else {
                    // Split by comma
                    cookieParams = cookie.split(',');

                    for (var j in cookieParams) {
                        // Split by =
                        var cookieParam = cookieParams[j].trim().split('=');

                        // Ignore the cookie params that has no value
                        if (cookieParam.length > 1) {
                            // Get the first element as the name
                            // and encode the value
                            var cookieItem = cookieParam.shift() + "=" + encodeURIComponent(cookieParam.join("="))

                            cordova.plugin.http.setCookie(url, cookieItem, {});
                        }
                    }
                }
            }
        }
        
        // Include auth
        if (paramOptions.setAuth) {
            headers.Authorization = 'Basic ' + btoa(paramOptions.setAuthValue);
        }
        
        // Get the timeout
        var timeout = parseInt(parameters.timeout);
        if (isNaN(timeout)) {
            // The default timeout
            timeout = 5000;
        }

        // Prepare the request information
        var options = {
            method: method,
            data: data,
            headers: headers,
            timeout: timeout
        };
        
        if (!(data instanceof cordova.plugin.http.ponyfills.FormData) && !(data instanceof ArrayBuffer) && !(data instanceof Uint8Array)) {
            options.serializer = 'utf8';
        }

        // Send the request
        cordova.plugin.http.sendRequest(
            url,
            options, 
            function(response) {
                // Returns the result
                callback(response);
            }, 
            function(response) {
                // Make sure it's not processing error
                if (response.status === -7) {
                    return;
                }

                var result = utility.formatResult(false, parameters.api, parameters.a, {global: utility.jsonDecode(response.error)});
                errorCallback(result);
            }
        );
    }

    /**
     * 
     * @param {object} parameters
     * @param {function} callback
     */
    function serviceData(parameters, callback) {
        var url = parameters.url + '/' + parameters.path;
        var data = parameters.data || [];

        switch(parameters.a) {
            case 'get':
                if (!utility.validateParameters(['data'], parameters, callback)) {
                    return;
                }
                
                sendAPIRequest(url, parameters, data, function(resp){
                    var result = utility.formatResult(true, parameters.api, parameters.a, utility.jsonDecode(resp.data));
                    callback(result);
                }, callback);
                break;
            case 'call':
                var options = parameters.options || {};
                
                // Get the method
                if (!parameters.method) {
                    parameters.method = 'post';
                }
                
                // Process file
                if (parameters.file) {
                    // Raw query
                    if (options.rawQuery || options.raw_query) {
                        sendAPIRequestAndFormat(url, parameters, data, options, callback);
                    } else {
                        // process the files
                        data = processFiles(parameters.file, data);
                        if (data instanceof Promise) {
                            data.then(function(arrBuffer){
                                sendAPIRequestAndFormat(url, parameters, arrBuffer, options, callback);
                            });
                        } else {
                            sendAPIRequestAndFormat(url, parameters, data, options, callback);
                        }
                    }
                } else {
                    sendAPIRequestAndFormat(url, parameters, data, options, callback);
                }
                
                break;
        }
    }
    
    /**
     * Send the request and then format the result base from the options
     * 
     * @param {string} url
     * @param {object} parameters
     * @param {object} data
     * @param {object} options
     * @param {function} callback
     */
    function sendAPIRequestAndFormat(url, parameters, data, options, callback) {
        sendAPIRequest(url, parameters, data, function(response){
            var result;
            switch(options.result) {
                case 'raw':
                    result = utility.formatResult(true, parameters.api, parameters.a, { data: response.data });
                    break;
                case 'json':
                    result = utility.formatResult(true, parameters.api, parameters.a, { data: utility.jsonDecode(response.data) });
                    break;
                case 'image':
                    result = utility.formatResult(true, parameters.api, parameters.a, { data: btoa(response.data) });
                    break;
                default:
                    result = utility.formatResult(true, parameters.api, parameters.a, utility.jsonDecode(response.data));
            }
            
            if (options.info) {
                // Check if not object
                if (typeof result.dt !== 'object') {
                    result.dt = { data: result.dt };
                }

                if (typeof response.status !== 'undefined') {
                    response.http_code = response.status;
                }
                
                result.dt.info = response;
            }
            
            if (options.getCookies) {
                // Check if not object
                if (typeof result.dt !== 'object') {
                    result.dt = { data: result.dt };
                }

                result.dt.cookies = typeof response.headers['set-cookie'] !== 'undefined' ? response.headers['set-cookie'] : undefined;
            }
            
            callback(result);
        }, callback);
    }
    
    /**
     * Sends the request
     * 
     * @param {object} parameters
     * @param {function} callback
     */
    function sendRequest(parameters, callback) {
        // Default values
        parameters.api = parameters.api || 'data';
        parameters.a = parameters.a || 'call';
        
        // Standard validation
        if (!utility.validateParameters(['url','path'], parameters, callback)) {
            return;
        }
        
        switch(parameters.api) {
            case 'data':
                serviceData(parameters, callback);
                break;
        }
    }

    /**
     * Setup the configuation necessary
     * 
     * @param {object} parameters
     * @param {function} callback
     */
    function setUpConfiguration(parameters, callback) {
        // Set the trust mode to "nocheck"
        // except browsers as it is not supported
        if (device.platform != "browser") {
            cordova.plugin.http.setServerTrustMode('nocheck', function() {
                sendRequest(parameters, callback);
            }, function(){
                var result = utility.formatResult(false, parameters.api, parameters.a, {global: 'Unable to set up server trust mode'});
                callback(result);
            });
        } else { // other platforms
            sendRequest(parameters, callback);
        }
    }
    
    return {
        sendRequest: function() {
            return setUpConfiguration.apply(this, arguments);
        }
    };
    
})();