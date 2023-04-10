var connectorDynamicsOData365BC = (function () {

    /**
     * List of allowed http methods
     */
    var methods = ['get', 'post', 'put', 'patch', 'head', 'delete', 'options'];

    /**
     * Http methods are for data 
     */
    var dataMethods = ['post', 'put', 'patch'];

    /**
     * Generates a body to be submitted for batch request
     * 
     * @param {array} data
     * @param {string} batchId
     * @param {string} method
     * @param {string} url
     * @param {string} ent
     */
    function generateBody(data, batchId, method, url, ent) {
        var result = '';

        // make sure data is an array
        if (!Array.isArray(data)) {
            data = [data];
        }

        // loop through all data
        for (var i in data) {
            var changeset = 'changeset_' + (new Date().getTime()) + i;

            // Get the Key
            var key = getKeyForBatch(data[i], method);

            // Get the url
            var urlBatch = getUrlForBatch(data[i], url, ent);

            // Remove the Ent from the data
            if (typeof data[i]['Ent'] !== 'undefined') {
                delete data[i]['Ent'];
            }

            result += "--" + batchId + "\r\n";
            result += "Content-Type: multipart/mixed; boundary=" + changeset + "\r\n";
            result += "\r\n";
            result += "--" + changeset + "\r\n";
            result += "Content-Type: application/http\r\n";
            result += "Content-Transfer-Encoding: binary\r\n";
            result += "Content-ID: " + (parseInt(i) + 1) + "\r\n";
            result += "\r\n";
            result += method.toUpperCase() + " " + encodeURI(urlBatch) + " HTTP/1.1\r\n";
            result += "Content-Type: application/json; type=entry\r\n";
            result += key ? "If-Match: " + key + "\r\n" : "";
            result += "\r\n";
            result += JSON.stringify(data[i]) + "\r\n";
            result += "--" + changeset + "--\r\n";
            result += "\r\n";
        }

        result += "--" + batchId + "--\r\n";

        return result;
    }

    /**
     * Generates a body to be submitted for batch request in json format
     * 
     * @param {array} data
     * @param {string} method
     * @param {string} companyWithoutUrl
     * @param {string} company
     * @param {string} ent
     */
    function generateBodyJson(data, method, companyWithoutUrl, company, ent) {
        // Initialize the result
        var result = {
            requests: []
        }

        // make sure data is an array
        if (!Array.isArray(data)) {
            data = [data];
        }

        // loop through all data
        for (var i in data) {
            var headers = {
                'Company': company,
                'Content-Type': 'application/json'
            }

            // Get the url
            var urlBatch = getUrlForBatch(data[i], companyWithoutUrl, ent);
		
            // Get the Key
            var key = getKeyForBatch(data[i], method);

            if (key) {
                headers['If-Match'] = key;
            }

            // Append it to the requests
            result.requests.push({
                'method': method.toUpperCase(),
                'url': urlBatch,
                'headers': headers,
                'body': data[i]
            });
        }

        return result;
    }

    /**
     * Get the Key for batch request
     * 
     * @param {object} data 
     * @param {string} method 
     * @return {string}
     */
    function getKeyForBatch(data, method) {
        var key;

        // Get the Key from data
        if (method.toUpperCase() === 'PATCH' && typeof data.Key !== 'undefined') {
            if (data.Key) {
                key = data.Key;
            }

            // Remove Key from data
            delete data.Key;
        }

        return key;
    }

    /**
     * Get the url for batch request
     * 
     * @param {object} data 
     * @param {string} url 
     * @param {string} ent 
     */
    function getUrlForBatch(data, url, ent) {
        // Check if there's "Ent" in data, if true then use it
        if (typeof data.Ent !== 'undefined' && data.Ent) {
            ent = data.Ent;

	    delete data.Ent;
        }

        // Check if there's already an "ent" at the end of the url
        if (url.substring(url.length - ent.length, url.length) !== ent) {
            url += '/' + ent;
        }

        return url;
    }

    /**
     * Process the list recursively, replacing all @odata.etag to Key and remove @odata.context
     */
    function processList(data) {
        // Check if there's data
        if (typeof data === 'undefined' || data === null) {
            return;
        }

        // Remove entries that are undefined
        var i = 0;
        while (i < data.length) {
            if (typeof data[i] === 'undefined') {
                data.splice(i, 1)
            } else {
                ++i;
            }
        }

        for (var index in data) {
            for (var field in data[index]) {
                // remove element with space only
                // remove @odata.context
                if (data[index][field] === '' || data[index][field] === '@odata.context') {
                    delete data[index][field];
                }

                // check if an array
                if (Array.isArray(data[index][field])) {
                    processList(data[index][field]);
                    continue;
                }

                // change the etag to Key
                // will be use in updating/deleting
                if (field === '@odata.etag') {
                    data[index]['Key'] = data[index][field];
                    delete data[index][field];
                }

                // Convert the images to base64 src
                // @todo: enhance this part, temporary to make it run
                if (field.includes('Picture') && typeof data[index][field] !== 'undefined') {
                    data[index][field] = 'data:image/png;base64,' + data[index][field];
                }
            }
        }
    }

    /**
     * Services available for data
     */
    function serviceData(parameters, callback) {
        // Standard validation
        if (!utility.validateParameters(['company'], parameters, callback)) {
            return;
        }

        // Find the correct action
        switch (parameters['a']) {
            // Data Listing
            case 'get':
                // Set default values
                parameters['subpath'] = parameters['subpath'] || 'Page';

                // Query string
                var queryString = [];

                // If there is a filter
                try {
                    var filter = oDataFilter.convert(parameters['filter'], parameters['orFilter']);
                    if (filter) {
                        queryString.push('$filter=' + filter);
                    }
                } catch (error) {
                    var result = utility.formatResult(false, parameters['api'], parameters['a'], error);
                    callback(result);
                    return;
                }

                // Check if there are selected fields to display
                var fields = (parameters['fields'] ? parameters['fields'] : '*');
                if (fields) {
                    queryString.push('$select=' + fields);
                }

                // If there is a limit
                var limitCount = (parameters['limit'] ? parameters['limit'] : 0);
                if (limitCount) {
                    queryString.push('$top=' + limitCount);
                }

                var page = (parameters['page'] ? parameters['page'] : '');
                if (page) {
                    queryString.push('$skip=' + (limitCount * (parseInt(page) - 1)));
                }

                // Check if expand is required
                var expand = (!parameters['expand'] || parameters['expand'] == 'true' ? '*' : parameters['expand']);
                expand = (expand == 'false' ? '' : expand)
                if (expand) {
                    queryString.push('$expand=' + expand);
                }
                
                // Check if ordering the data is required
                if (parameters['order']) {
                    var order = [];
                    for (var key in parameters['order']) {
                        var value = parameters['order'][key];

                        // Get the order value and field
                        var orderValue = value['v'] || value['order'];
                        orderValue = orderValue ? orderValue.toLowerCase() : '';
                        var orderField = value['f'] || value['field'];

                        // Prepare the kind of sorting is expected
                        if (orderValue === 'desc' || orderValue === 'asc') {
                            order.push(orderField + ' ' + orderValue);
                        } else {
                            order.push(orderField+ ' asc');
                        }
                    }
                    if (order.length > 0) {
                        queryString.push('$orderby=' + order.join(','));
                    }
                }

                // Generate the proper url 
                var url = parameters['url'] + "/ODataV4/Company('" + parameters['company'] + "')/" + parameters['ent'];
                if (queryString.length > 0) {
                    url += '?' + queryString.join('&');
                }
                url = encodeURI(url);

                // Send the official request
                sendAPIRequest('get', url, parameters, null, function (data) {
                    // Get the valid data for this request 
                    data = data['value'];

                    processList(data);

                    // Check if it is an empty array, then make it null
                    if ((Array.isArray(data) && data.length == 0) || typeof data === 'undefined') {
                        data = null;
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
                // Set default values
                parameters['function'] = parameters['function'] || 'Create';
                parameters['subpath'] = parameters['subpath'] || 'Page';

                // Validation for this call
                // if (parameters['function'].toLowerCase() !== 'delete' && !utility.validateParameters(['data'], parameters, callback)) {
                //     return;
                // }

                // If there's no data in parameters then make it to empty object
                if (!parameters['data']) {
                    parameters['data'] = {};
                }

                var methods = {
                    'create': 'post',
                    'update': 'patch',
                    'delete': 'delete',
                    'action': 'post'
                };

                // map the function create / update / delete to post / patch / delete
                // else get
                var method = ['create', 'update', 'delete', 'action'].indexOf(parameters['function'].toLowerCase()) !== -1 ? methods[parameters['function'].toLowerCase()] : 'get';

                // Generate the proper url 
                var baseUrl = parameters['url'] + "/ODataV4",
                    url = baseUrl,
                    //urlCompanyWithOutEnt = url + "/Company('" + parameters['company'] + "')",
                    companyWithoutUrl = "/Company('" + parameters['company'] + "')",
                    urlCompanyWithOutEnt = url + companyWithoutUrl,
                    urlCompany = urlCompanyWithOutEnt + "/" + parameters['ent'];

                // Headers
                var headers = {};

                // Clean the data before submission
                // comment for now
                //utility.cleanData(parameters['data']);

                // Check if there's batch parameter
                if (parameters['batch']) {
//                    var batchId = 'batch_' + (new Date().getTime());

//                    url += "/$batch";

//                    headers['Content-Type'] = 'multipart/mixed; boundary=' + batchId;

//                    parameters['data'] = generateBody(parameters['data'], batchId, method, urlCompanyWithOutEnt, parameters['ent']);

                    url += "/$batch";

                    var batchRequestFormat = 'text';
                    if (parameters['batchRequestFormat']) {
                        batchRequestFormat = parameters['batchRequestFormat'];
                    }

                    if (batchRequestFormat == 'text') {
                        var batchId = 'batch_' + (new Date().getTime());

                        headers['Content-Type'] = 'multipart/mixed; boundary=' + batchId;
    
                        parameters['data'] = generateBody(parameters['data'], batchId, method, urlCompanyWithOutEnt, parameters['ent']);    
                    } else {
                        parameters['data'] = generateBodyJson(parameters['data'], method, companyWithoutUrl, parameters['company'], parameters['ent']);
                    }
                } else if (parameters['subpath'] === 'Codeunit') {
                    // /ODataV4/{serviceName}_{procedureName}?company={companyName|companyId}
                    url = baseUrl + '/' + parameters['ent'] + '_' + parameters['function'] + '?company=' + parameters['company'];
                } else {
                    url = urlCompany;
                }

                if (method === 'patch' || method === 'post') {
                    headers['Prefer'] = 'return=representation';
                }

                if (parameters['data'] && parameters['data']['Key'] && !parameters['batch']) {
                    headers['If-Match'] = parameters['data']['Key'];

                    if (method === 'patch') {
                        delete parameters['data']['Key'];
                    }
                }

                // Add the headers to parameters
                parameters['_headers'] = headers;

                url = encodeURI(url);

                // Get the method to use
                // If this is batch request or the subpath is codeunit then the method should be 'post'
                method = parameters['batch'] || parameters['subpath'] === 'Codeunit' ? 'post' : method

                // Send the official request
                sendAPIRequest(method, url, parameters, parameters['data'], function (data) {
                    // Get the valid data for this request 
                    for (var field in data) {
                        // remove element with space only   
                        if (data[field] === '') {
                            delete data[field];
                        }

                        // change the etag to Key
                        // will be use in updating/deleting
                        if (field === '@odata.etag') {
                            data['Key'] = data[field];
                            delete data[field];
                        }
                    }

                    var newdata = {};
                    if (parameters['ent'] && parameters['subpath'] !== 'Codeunit') {
                        newdata[parameters['ent']] = data;
                    } else {
                        newdata = data;
                    }

                    // Prepare the result/return
                    var result = utility.formatResult(true, parameters['api'], parameters['a'],
                        newdata);
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
                var url = parameters['url'] + '/ODataV4/Company';
                url = encodeURI(url);

                // Send the official request
                sendAPIRequest('get', url, parameters, null, function (data) {
                    var companies = [];

                    // Loop through the data to get the companies
                    for (var i in data.value) {
                        companies.push(data.value[i].Name);
                    }

                    // Prepare the result/return
                    var result = utility.formatResult(true, parameters['api'], parameters['a'],
                        companies);
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
    function sendAPIRequest(method, url, parameters, data, callback, errorCallback) {
        var headers = {
            'Authorization': 'Basic ' + btoa(parameters['_user'] + ':' + parameters['_password']),
            'Accept': 'application/json',
            'Content-Type': 'application/json; charset=utf-8',
            'OData-Version': '4.0',
            'OData-MaxVersion': '4.0',
            'Accept-Encoding': '*'
        };

        // Check if there's an additional headers
        if (parameters['_headers']) {
            Object.assign(headers, parameters['_headers']);
        }

        // Get the method
        method = method || 'get';
        if (parameters.method && methods.includes(parameters.method.toLowerCase())) {
            method = parameters.method.toLowerCase();
        }

        // if post,put,patch
        if (dataMethods.includes(method)) {
            var contentType = headers['Content-Type'] || headers['content-type'];
            if (contentType.match(/application\/json/)) {
                data = JSON.stringify(data);
            } else if (contentType.match(/multipart\/mixed/)) {
                // nothing to do
            } else {
                data = utility.httpBuildQuery(data);
            }
        } else if (data) {
            url += (url.indexOf('?') === -1 ? '?' : '&') + utility.httpBuildQuery(data);
            data = undefined;
        }

        // Prepare the request information
        const options = {
            method: method,
            data: data,
            headers: headers,
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
                            var data = JSON.parse(response.data);

                            callback(data);
                        },
                        function (response) {
                            // Make sure it's not processing error
                            if (response['status'] === -7) {
                                callback("ok");
                                return;
                            }

                            // Plugin issue: The status is always -1, I think the plugin still parses the response body, 
                            // even when the method is "DELETE" which normally has an empty response body
                            if (response['status'] === -1 && method === 'delete') {
                                callback("ok");
                                return;
                            }

                            var error;
                            // Returns the error information
                            try {
                                error = JSON.parse(response.error);
                            } catch (e) {
                                error = response.error;
                            }

                            if (typeof error === 'object') {
                                if (error.error) {
                                    error = error.error.code + ': ' + error.error.message;
                                }
                            }

                            var result = utility.formatResult(false, parameters['api'], parameters['a'], error);
                            errorCallback(result);
                        }
                    );
                },
                function (error) {
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
                var result = formatResult(false, parameters['api'], parameters['a'],
                    'Service requested is not existing.');
                callback(result);
        }
    }

    return {
        sendRequest: function () {
            return sendRequest.apply(this, arguments);
        }
    };

})();
