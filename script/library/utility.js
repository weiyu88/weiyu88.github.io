/** 
 * Utility - Singleton Object
 * Contains some reusable functions.
 */
var utility = (function(){

    /**
     * Validate some important parameters
     */
    function validateParameters(required, parameters, callback) {
        // Prepare the basic result information
        var valid = true;
        var missing = [];
        
        // Check if all the param are existing
        for (var index in required) {
            if (!parameters[required[index]]) {
                valid = false;
                missing.push(required[index]);
            }
        }

        // Response back if it's missing some parameters
        if (!valid) {
            var result = formatResult(false, parameters['api'], parameters['a'], 
                'Missing the following parameters: ' + missing.join(',') + '.');
            callback(result);
        }
    
        return valid;
    }

    /**
     * Format the result to follow the web connector
     */
    function formatResult(success, service, action, data) {
        // Prepare the basic result information
        var result = {
            'act': service,
            'a': action,
            's': (success ? 1 : 0)
        };

        // Check if it's successfull or failed
        if (success) {
            result['dt'] = data;
        } else {
            result['err'] = data;
        }

        return result;
    }

    /**
     * Originally from http://davidwalsh.name/convert-xml-json
     * This is a version that provides a JSON object without the attributes and places textNodes as values
     * rather than an object with the textNode in it.
     *
     * @param xml * - contains the xml data
     * 
     * @return {*}
     */
    function xmlToJson(xml) {   
        // Create the return object
        var obj = {};

        // Text node
        if (4 === xml.nodeType) {
            obj = xml.nodeValue;
        }

        if (xml.hasChildNodes()) {
            for (var i = 0; i < xml.childNodes.length; i++) {
                var TEXT_NODE_TYPE_NAME = '#text',
                    item = xml.childNodes.item(i),
                    nodeName = item.nodeName,
                    content;

                if (TEXT_NODE_TYPE_NAME === nodeName) {
                    //single textNode or next sibling has a different name
                    if ((null === xml.nextSibling) || (xml.localName !== xml.nextSibling.localName)) {
                        content = xml.textContent;
                    //we have a sibling with the same name
                    } else if (xml.localName === xml.nextSibling.localName) {
                        //if it is the first node of its parents childNodes, send it back as an array
                        content = (xml.parentElement.childNodes[0] === xml) ? [xml.textContent] : xml.textContent;
                    }
                    return content;
                } else {
                    if ('undefined' === typeof(obj[nodeName])) {
                        obj[nodeName] = xmlToJson(item);
                    } else {
                        // Check if it's an array
                        if (!Array.isArray(obj[nodeName])) {
                            var old = obj[nodeName];
                            obj[nodeName] = [];
                            obj[nodeName].push(old);
                        }

                        obj[nodeName].push(xmlToJson(item));
                    }
                }
            }
        }

        // Check if it's empty
        // Cause it's returning {} instead of blank
        if (Object.keys(obj).length === 0 && obj.constructor === Object) {
            obj = '';
        }

        return obj;
    }

    /**
     * Converts xml to json object
     *
     * @param xml * - contains the xml data
     * 
     * @return {*}
     */
    function convertXMLtoJSON(xml) {
        // Make sure it is a proper xml object
        if (typeof xml === 'string') {
            // Convert string to xml
            var parser = new DOMParser();
            xml = parser.parseFromString(xml, 'text/xml');
        }

        // Convert the xml to json
        return xmlToJson(xml);
    }

    /**
     * Encode xml value
     *
     * @param value any - encode the value to a valid xml value
     * 
     * @return string
     */
    function encodeXMLValue(xml) {
        // Skip if it's not a string
        if (typeof xml !== 'string') {
           return xml;
        }

        return xml.replace(/[<>&'"]/g, function (c) {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
            }
        });
    }

    /**
     * Sorting for array objects
     * 
     * @param data array objects - the array to be sorted
     * @param order array objects - the sorting order
     *                            - [f: {field}, v: {order - ASC/DESC}]
     * 
     * @return array objects
     */
    function sortArrayObjects(data, order) {
        // Sort the data
        data.sort(
            function(a, b) {
                // Holder for the expression
                var expression = "";

                // Loop through all of the sorting data
                for (var key in order) {
                    var sortData = order[key];

                    // Make sure the sortData is not null
                    if (sortData) {
                        // Set to case insensitive
                        var sortField1 = a[sortData.f] || a[sortData.field];
                        var sortField2 = b[sortData.f] || b[sortData.field];
                        var val1 = (sortField1 ? sortField1.toString().toUpperCase() : '');
                        var val2 = (sortField2 ? sortField2.toString().toUpperCase() : '');

                        // Convert to date if it's a valid date
                        if (isNaN(val1) && !isNaN(Date.parse(val1.replace(/([a-z])\W+(\d)/ig, "$1$2")))) {
                            val1 = Date.parse(val1).toString();
                        }
                        if (isNaN(val2) && !isNaN(Date.parse(val2.replace(/([a-z])\W+(\d)/ig, "$1$2")))) {
                            val2 = Date.parse(val2).toString();
                        }

                        // Regex for alphanumeric sorting
                        var reA = /[^a-zA-Z]/g;
                        var reN = /[^0-9|^.|^-]/g;

                        // Aplhanumeric Sorting
                        var aA = val1.replace(reA, "");
                        var bA = val2.replace(reA, "");
                        
                        var sortOrder = sortData.v || sortData.order;
                        sortOrder = sortOrder.toUpperCase();
                        if(aA === bA) {
                            var aN = parseFloat(val1.replace(reN, ""), 10);
                            var bN = parseFloat(val2.replace(reN, ""), 10);
                            expression = expression + (aN === bN ? 0 : aN > bN ? (sortOrder == 'DESC' ? -1 : 1) : (sortOrder == 'DESC' ? 1 : -1)).toString() + " || ";
                        } else {
                            expression = expression + (val1 === val2 ? 0 : val1 > val2 ? (sortOrder == 'DESC' ? -1 : 1) : (sortOrder == 'DESC' ? 1 : -1)).toString() + " || ";
                        }
                    }
                }

                // Evaluate the combined expression
                return eval(expression.substr(0, expression.length - 4));
            }
        );

        return data;
    }
    
    /**
     * Cleans the data before submission
     * 
     * @param {mixed} data
     * @returns void
     */
    function cleanData(data) {
        if (typeof data === 'object') {
            for (var i in data) {
                // check if numberic
                // https://medium.com/javascript-in-plain-english/how-to-check-for-a-number-in-javascript-8d9024708153
                if (isFinite(data[i])) {
                    var num = parseFloat(data[i]);
                    if (!isNaN(num)) {
                        data[i] = num;
                    }
                } else if (typeof data[i] === 'object') {
                    cleanData(data[i]);
                }
            }
        }
    }
    
    /**
     * From: https://locutus.io/php/url/rawurlencode/
     * 
     * @param {string} str 
     */
    function rawUrlEncode(str) {
        return encodeURIComponent(str)
                    .replace(/!/g, '%21')
                    .replace(/'/g, '%27')
                    .replace(/\(/g, '%28')
                    .replace(/\)/g, '%29')
                    .replace(/\*/g, '%2A');
    }
    
    /**
     * @param {object} data
     * @returns {String}
     */
    function httpBuildQuery(data) {
        var result = [];
        for (var i in data) {
            if (!data[i]) {
                continue;
            }
            
            result.push(i + '=' + encodeURI(data[i]));
        }
        return result.join('&');
    }
    
    /**
     * Parse a json string, if not a json will return the data
     * 
     * @param {string} data
     * @returns {Array|Object}
     */
    function jsonDecode(data) {
        try {
            return JSON.parse(data);
        } catch (e) {
            return data;
        }
    }
    
    /**
     * Check if the given date is a Date
     * 
     * @param {string} date
     * @returns {Boolean}
     */
    function isDate(date) {
        var d = new Date(date);
        if (d instanceof Date && !isNaN(d.getTime())) {
            // check if the format is the same
            return d.toISOString().split('T')[0] == date;
        }
        return false;
    }
           
    return {
        /**
         * Convert the xml to a json object
         */
        convertXMLtoJSON: function() {
            return convertXMLtoJSON.apply(this, arguments);
        },
        /**
         * Encode xml value
         */
        encodeXMLValue: function() {
            return encodeXMLValue.apply(this, arguments);
        },
        /**
         * Sort array objects
         */
        sortArrayObjects: function() {
            return sortArrayObjects.apply(this, arguments);
        },
        /**
         * Validate some important parameters
         */
        validateParameters: function() {
            return validateParameters.apply(this, arguments);
        },
        /**
         * Format the result to follow the web connector
         */
        formatResult: function() {
            return formatResult.apply(this, arguments);
        },
        /**
         * Cleans the data before submission
         */
        cleanData: function() {
            return cleanData.apply(this, arguments);
        },
        /**
         * Encodes url
         */
        rawUrlEncode: function() {
            return rawUrlEncode.apply(this, arguments);
        },
        /**
         * Formats an object into http query (var=foo&var1=foo1)
         */
        httpBuildQuery: function() {
            return httpBuildQuery.apply(this, arguments);
        },
        /**
         * Parse a json string, if not a json will return the data
         */
        jsonDecode: function() {
            return jsonDecode.apply(this, arguments);
        },
        /**
         * Check if the given date is a Date
         */
        isDate: function() {
            return isDate.apply(this, arguments);
        }
    };

})();