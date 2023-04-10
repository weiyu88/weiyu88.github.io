/** 
 * Navision/Dynamics365 BC Connector - Singleton Object
 */
var connectorDynamics365BC = (function () {

    /**
     * Generate part of the required soap body
     */
    function generateSOAPBody(location, options) {
        // Find the correct location and generate the data
        var data = '';
        switch (location) {
            // Header
            case 'header':
                data += '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:get="urn:microsoft-dynamics-schemas/' + options['namespace'] + '">';
                data += '<soap:Body>';
                break;
            // Footer
            case 'footer':
                data += '</soap:Body>';
                data += '</soap:Envelope>';
                break;
            // Start a grouping
            case 'start':
                data += '<get:' + options['name'] + '>';
                break;
            // End a grouping
            case 'end':
                data += '</get:' + options['name'] + '>';
                break;
            // Filter
            case 'filter':
                data += '<get:filter>';
                data += '<get:Field>' + utility.encodeXMLValue(options['field']) + '</get:Field>';
                data += '<get:Criteria>' + utility.encodeXMLValue(options['criteria']) + '</get:Criteria>';
                data += '</get:filter>';
                break;
            // Size
            case 'size':
                data += '<get:setSize>';
                data += utility.encodeXMLValue(options['size']);
                data += '</get:setSize>';
                break;
            // Bookmark
            case 'bookmark':
                data += '<get:bookmarkKey>';
                data += utility.encodeXMLValue(options['bookmark']);
                data += '</get:bookmarkKey>';
                break;
            // Data
            case 'data':
                // Process through the data
                data += processDataToSOAP(options['data'], null);
                break;
            // Not found
            default:
        }
        // Return the final result
        return data;
    }

    /**
     * Process the data into a soap body
     * 
     * @param data object/array - contains all the data to be translated into SOAP
     * @param parent string - parent tag to be used for arrays
     * 
     * @return string
     */
    function processDataToSOAP(data, parent) {
        var result = '';
        parent = parent || '';

        // If not an object or array just return
        if (typeof data !== 'object') {
            return utility.encodeXMLValue(data);
        }

        // Go through all the data of the object
        var useParent = Array.isArray(data);
        for (var key in data) {
            // If it's a null then don't include
            if (typeof data[key] === 'undefined') {
                continue;
            }

            // Don't include if the value is array
            var isArray = Array.isArray(data[key]);
            if (!isArray) {
                // Opening tag
                result += '<get:' + (useParent ? parent : key) + '>';
            }
            // Item
            result += processDataToSOAP(data[key], key);
            if (!isArray) {
                // Closing tag
                result += '</get:' + (useParent ? parent : key) + '>';
            }
        }

        return result;
    }

    /**
     * Services available for data
     */
    function serviceData(parameters, callback) {
        // Standard validation
        if (!utility.validateParameters(['company', 'ent'], parameters, callback)) {
            return;
        }

        // Find the correct action
        switch (parameters['a']) {
            // Data Listing
            case 'get':
                // Set default values
                parameters['subpath'] = parameters['subpath'] || 'Page';

                // Generate the proper url 
                var url = parameters['url'] + '/WS/' + parameters['company'] + '/' + parameters['subpath'] + '/' + parameters['ent'];
                url = encodeURI(url);

                // If there is a filter
                var filter = '';
                if (parameters['filter']) {
                    // Loop through all the filters to be added
                    var filters = parameters['filter'];
                    for (var index in filters) {
                        var field = filters[index]['f'] || filters[index]['field'] || '';
                        var operator = filters[index]['o'] || filters[index]['operator'] || '';
                        var value = filters[index]['v'] || filters[index]['value'] || ''
                        filter += generateSOAPBody('filter', { field: field, criteria: operator + value });
                    }
                }

                // If there is a limit
                var limit = '';
                var limitCount = 0;
                if (parameters['limit']) {
                    limit += generateSOAPBody('size', { size: parameters['limit'] });
                    limitCount = parameters['limit'];
                }

                // For pagination/bookmarking
                var bookmark = '';
                var bookmarkInclude = false;
                var skipRecordCount = 0;
                if (parameters['page']) {
                    // Check if there was a bookmark passed
                    bookmark = parameters['bookmark'] || '';

                    // Check if it requires to load some pages to get the bookmark
                    var page = parameters['page'];
                    if (!bookmark && page > 1) {
                        // Update the limit 
                        limit = limitCount * page;
                        limit += generateSOAPBody('size', { size: limit });
                        // Set the number of record to be skipped
                        skipRecordCount = limitCount * (page - 1);
                    } else {
                        bookmarkInclude = true;

                        // Generate the bookmark body 
                        bookmark = generateSOAPBody('bookmark', { bookmark: bookmark });
                    }
                }

                // Prepare the soap body
                var namespace = 'page/' + parameters['ent'].toLowerCase();
                var data = '';
                data += generateSOAPBody('header', { namespace: namespace });
                data += generateSOAPBody('start', { name: 'ReadMultiple' });
                data += filter;
                data += limit;
                data += (bookmarkInclude ? bookmark : '');
                data += generateSOAPBody('end', { name: 'ReadMultiple' });
                data += generateSOAPBody('footer', {});

                // Send the official request
                sendAPIRequest(url, parameters, data, function (data) {
                    // Get the valid data for this request 
                    if (data['ReadMultiple_Result']['ReadMultiple_Result']) {
                        data = data['ReadMultiple_Result']['ReadMultiple_Result'][parameters['ent']];

                        // Skip the records needed to be skipped
                        data = (Array.isArray(data) ? data : [data]);
                        data.splice(0, skipRecordCount);

                        // Convert the images to base64 src
                        // @todo: enhance this part, temporary to make it run
                        for (var index in data) {
                            for (var field in data[index]) {
                                if (field.includes('Picture') && typeof data[index][field] !== 'undefined') {
                                    data[index][field] = 'data:image/png;base64,' + data[index][field];
                                }
                            }
                        }

                        // Sort the data if needed
                        if (parameters['order']) {
                            data = utility.sortArrayObjects(data, parameters['order']);
                        }
                    } else {
                        // Set to undefined if no data
                        data = undefined;
                    }

                    // Prepare the result/return
                    data = { data: data, limit: limitCount, total: 0 };
                    var result = utility.formatResult(true, parameters['api'], parameters['a'],
                        data);
                    callback(result);
                }, callback);
                break;
            // Generic call
            case 'call':
                // Validation for this call
                if (!utility.validateParameters(['data'], parameters, callback)) {
                    return;
                }

                // Set default values
                parameters['function'] = parameters['function'] || 'Create';
                parameters['subpath'] = parameters['subpath'] || 'Page';

                // Generate the proper url 
                var url = parameters['url'] + '/WS/' + parameters['company'] + '/' + parameters['subpath'] + '/' + parameters['ent'];
                url = encodeURI(url);

                // Manipulate the data to be passed if needed
                if (parameters['subpath'] == 'Page') {
                    // Check if it's one of the function to be updated
                    var parametersData = {};
                    switch (parameters['function']) {
                        // Create + Update + Create Multiple + Update Multiple
                        case 'Create':
                        case 'Update':
                        case 'CreateMultiple':
                        case 'UpdateMultiple':
                            parametersData[parameters['ent']] = parameters['data'];
                            break;
                        // Default
                        default:
                            parametersData = parameters['data'];
                    }
                    // Replace the current data
                    parameters['data'] = parametersData;
                }

                // Check if have subfunction 
                if (parameters['subfunction']) {
                    // Make sure both are objects
                    if (typeof parameters['data'] === 'object' &&
                        typeof parameters['subfunction'] === 'object') {
                        Object.assign(parameters['data'], parameters['subfunction']);
                    }
                }

                // Prepare the soap body
                var subpath = parameters['subpath'].toLowerCase();
                var namespace = subpath + '/' + parameters['ent'];
                if (subpath === 'page') {
                    namespace = subpath + '/' + parameters['ent'].toLowerCase();
                }

                var data = '';
                data += generateSOAPBody('header', { namespace: namespace });
                data += generateSOAPBody('start', { name: parameters['function'] });
                data += generateSOAPBody('data', { data: parameters['data'] });
                data += generateSOAPBody('end', { name: parameters['function'] });
                data += generateSOAPBody('footer', {});

                // Send the official request
                sendAPIRequest(url, parameters, data, function (data) {
                    // Get the valid data for this request 
                    data = data[parameters['function'] + '_Result'];
                    // Prepare the result/return
                    var result = utility.formatResult(true, parameters['api'], parameters['a'],
                        data);
                    callback(result);
                }, callback);
                break;
            // Not found
            default:
                var result = utility.formatResult(false, parameters['api'], parameters['a'],
                    'Action requested is not existing.');
                callback(result);
        }
    }

    /**
     * Services available for company
     */
    function serviceCompany(parameters, callback) {
        // Find the correct action
        switch (parameters['a']) {
            // Data Listing
            case 'get':
                // Generate the proper url 
                var url = parameters['url'] + '/WS/' + 'SystemService';
                url = encodeURI(url);

                // Prepare the soap body
                var namespace = 'nav/system';
                var data = '';
                data += generateSOAPBody('header', { namespace: namespace });
                data += generateSOAPBody('start', { name: 'Companies' });
                data += generateSOAPBody('end', { name: 'Companies' });
                data += generateSOAPBody('footer', {});

                // Send the official request
                sendAPIRequest(url, parameters, data, function (data) {
                    // Get the valid data for this request 
                    data = data['Companies_Result']['return_value'];

                    // Prepare the result/return
                    var result = utility.formatResult(true, parameters['api'], parameters['a'],
                        data);
                    callback(result);
                }, callback);
                break;
            // Not found
            default:
                var result = utility.formatResult(false, parameters['api'], parameters['a'],
                    'Action requested is not existing.');
                callback(result);
        }
    }

    /**
     * Generate the token if necessary
     * This is using a cordova plugin (https://github.com/silkimen/cordova-plugin-advanced-http)
     * 
     * @param parameters object - contains all the data passed from eMOBIQ
     * @param callback function - callback to be triggered after sending the request
     * @param errorCallback function - errorCallback to be triggered after sending the request with failure
     */
    function generateAuthorizationToken(parameters, callback, errorCallback) {
        // Prepare the token
        var token = '';

        // Check if the authentication type is outh2 then generate the token
        if (parameters['authentication'] == 'oauth2') {
            // Send the oauth2 request
            cordova.plugin.http.sendRequest(
                _baseConfig.urlMicrosoftOAuth2 + '/' + parameters['tenantId'] + '/oauth2/v2.0/token',
                {
                    method: 'post',
                    data: {
                        'client_id': parameters['clientId'],
                        'client_secret': parameters['clientSecret'],
                        'grant_type': 'password',
                        'username': parameters['_user'],
                        'password': parameters['_password'],
                        'scope': _baseConfig.urlMicrosoftOAuth2ScopeDynamicsBC
                    },
                    timeout: parameters.timeout || 5000
                },
                function (response) {
                    // Returns the token
                    token = JSON.parse(response.data)?.access_token;
                    callback(data);
                },
                function (response) {
                     // Make sure it's not processing error
                     if (response['status'] === -7) {
                        callback(token);
                        return;
                    }

                    // If failed
                    errorCallback(JSON.parse(response.error)?.error_description);
                }
            );
            return;
        }

        // Callback without token
        callback(token);
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
        // Prepare the request information
        const options = {
            method: 'post',
            data: data,
            headers: {
                'Authorization': 'Basic ' + btoa(parameters['_user'] + ':' + parameters['_password']),
                'Content-Type': 'application/xml; charset=utf-8',
                'SoapAction': 'urn:microsoft-dynamics-schemas'
            },
            serializer: 'utf8',
            timeout: parameters.timeout || 5000
        };

        // set the trust mode to "nocheck"
        cordova.plugin.http.setServerTrustMode('nocheck', function () {
            // Check for authentication
            generateAuthorizationToken(
                parameters, 
                function(token) {
                    // Modify authorization if necessary
                    if (token) {
                        options.headers['Authorization'] = 'Bearer ' + token;
                    }

                    // Send the request
                    cordova.plugin.http.sendRequest(
                        url,
                        options,
                        function (response) {
                            // Returns the result
                            var data = utility.convertXMLtoJSON(response['data']);
                            data = data['Soap:Envelope']['Soap:Body'];

                            callback(data);
                        },
                        function (response) {
                            // Make sure it's not processing error
                            if (response['status'] === -7) {
                                callback("ok");
                                return;
                            }

                            // Returns the error information
                            var error = utility.convertXMLtoJSON(response['error']);

                            // Check if the error is a soap error
                            if (error['s:Envelope']) {
                                error = error['s:Envelope']['s:Body']['s:Fault'];
                                error = error['faultcode'] + ':' + error['faultstring'];
                            } else {
                                error = response['error'];
                            }

                            var result = utility.formatResult(false, parameters['api'], parameters['a'], error);
                            errorCallback(result);
                        }
                    );
                }, function (error) {
                    var result = utility.formatResult(false, parameters['api'], parameters['a'], error);
                    errorCallback(result);
                }
            );
        }, function () {
            var result = utility.formatResult(false, parameters['api'], parameters['a'], 'Unknown error');
            errorCallback(result);
        });
    }

    /**
     * Send the request based on the parameters passed
     */
    function sendRequest(parameters, callback) {
        // Set default values
        parameters['a'] = parameters['a'] || 'get';

        // Standard validation
        if (!utility.validateParameters(['api', 'url', '_user', '_password'], parameters, callback)) {
            return;
        }

        // Find the correct api
        switch (parameters['api']) {
            // Data services
            case 'data':
                serviceData(parameters, callback);
                break;
            // Companies
            case 'company':
                serviceCompany(parameters, callback);
                break;
            // Not found
            default:
                var result = utility.formatResult(false, parameters['api'], parameters['a'],
                    'Service requested is not existing.');
                callback(result);
        }
    }

    return {
        /**
         * Send the request based on the parameters passed
         */
        sendRequest: function () {
            return sendRequest.apply(this, arguments);
        }
    };

})();