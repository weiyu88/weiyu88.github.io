/** 
 * DynamoDB for www3 - Singleton Object
 */
var dynamodb = (function(){

    /** 
     * Variables used
     */
    var configurationType = 'aws';
    var dynamoDB;
    var dynamoDocClient;

    /**
     * Initialize the aws dynamodb settings
     * 
     * @param {object} settings - the settings to be configured
     */
    function init(settings) {
        // Update the configuration
        configurations.setConfiguration(configurationType, settings);
        // Initailize the dynamodb and doc client
        dynamoDB = new AWS.DynamoDB();
        dynamoDocClient = new AWS.DynamoDB.DocumentClient();
    }

    /**----------------------
     * Functions - Used within
     **----------------------**/

    /**
     * Format the result that is given by dynamodb 
     * to remove it's type
     * 
     * @param {boolean} isDataset - to know whether to process a specific value or whole dataset
     * @param {object} data - data returned by dynamodb
     * 
     * @return {any} formatted result
     */ 
    function formatAWSResult(isDataset, data) {
        // Check if it is dataset then loop through it
        if (isDataset) {
            for (var ctr in data) {
                for (var field in data[ctr]) {
                    data[ctr][field] = formatAWSResult(false, data[ctr][field]);
                }
            }
            return data;
        }

        // Get the type of the current field
        var type = Object.keys(data)[0];

        // Process the right value by turning it to a string
        var value = data[type];
        if (['M', 'L'].includes(type)) {
            // Go through all data and format them
            for (var ctr in value) {
                value[ctr] = formatAWSResult(false, value[ctr]);
            }
        }
        
        return value;
    }

    /**----------------------
     * AWS DynamoDB Functions
     **----------------------**/

    /**
     * Describe a table in dynamodb
     * 
     * @param {string} tableName - name of the table
     * @param {function} callback - callback upon finishing
     * @param {function} errorCallback - error callback if something wrong happened
     */ 
    function awsDescribeDynamoDBTable(tableName, callback, errorCallback) {
        // Prepare the parameters to be passed
        var params = {
            TableName : tableName
        };

        // Send the request to create a table
        dynamoDB.describeTable(params, function(error, data) {
            // Check if no error
            if (error) {
                errorCallback(JSON.stringify(error, undefined, 2));
                return;
            }
            callback(data);
        });
    }

    /**
     * Read all table items in dynamodb
     * 
     * @param {string} tableName - name of the table
     * @param {object} options - other parameters needed
     * @param {array} fullData - previous data from pagination
     * @param {function} callback - callback upon finishing
     * @param {function} errorCallback - error callback if something wrong happened
     */ 
    function awsScanDynamoDBTable(tableName, options, fullData, callback, errorCallback) {
        // Prepare the parameters to be passed
        var params = {
            TableName : tableName
        };

        // Merge the basic parameters to the options
        Object.assign(params, options);

        // Send the request to create a table
        dynamoDB.scan(params, function(error, data) {
            // Check if no error
            if (error) {
                errorCallback(JSON.stringify(error, undefined, 2));
                return;
            }

            // Merge the final data stack
            fullData = fullData.concat(data['Items']);

            // Check if there is a next page then load it too
            if (data['LastEvaluatedKey']) {
                awsScanDynamoDBTable(tableName, 
                    { ExclusiveStartKey: data['LastEvaluatedKey'] }, fullData, callback, errorCallback);
                return;
            }
            
            callback(fullData);
        });
    }

    /**
     * Insert record to a table in dynamodb
     * 
     * @param {string} tableName - name of the table
     * @param {object} data - data to be inserted
     * @param {object} options - other parameters needed
     * @param {function} callback - callback upon finishing
     * @param {function} errorCallback - error callback if something wrong happened
     */ 
    function awsInsertRecordDynamoDBTable(tableName, data, options, callback, errorCallback) {
        // Prepare the parameters to be passed
        var params = {
            TableName : tableName,
            Item: data
        };

        // Merge the basic parameters to the options
        Object.assign(params, options);

        // Send the request to create a table
        dynamoDocClient.put(params, function(error, data) {
            // Check if no error
            if (error) {
                errorCallback(JSON.stringify(error, undefined, 2));
                return;
            }
            callback(data);
        });
    }

    /**
     * Update a record from the table in dynamodb
     * 
     * @param {string} tableName - name of the table
     * @param {object} key - key of the record to be updated
     * @param {object} data - data to be inserted
     * @param {object} options - other parameters needed
     * @param {function} callback - callback upon finishing
     * @param {function} errorCallback - error callback if something wrong happened
     */ 
    function awsUpdateRecordDynamoDBTable(tableName, key, data, options, callback, errorCallback) {
        // Prepare the update statement
        var updateExpression = 'set ';
        var expressionAttributeValues = {};
        var ctr = 1;
        var expressionAttributeNames = (options['ExpressionAttributeNames'] ? options['ExpressionAttributeNames'] : {}) ;
        for (var field in data) {
            updateExpression += '#field' + ctr + '=:' + field + ',';
            expressionAttributeValues[':' + field] = data[field];
            expressionAttributeNames['#field' + ctr] = field;
            ctr++;
        }
        updateExpression = updateExpression.substring(0, updateExpression.length - 1);
        
        // Prepare the parameters to be passed
        var params = {
            TableName : tableName,
            Key: key,
            UpdateExpression: updateExpression,
            ExpressionAttributeValues: expressionAttributeValues,
            ExpressionAttributeNames: expressionAttributeNames
        };

        // Merge the basic parameters to the options
        Object.assign(params, options);

        // Send the request to create a table
        dynamoDocClient.update(params, function(error, data) {
            // Check if no error
            if (error) {
                errorCallback(JSON.stringify(error, undefined, 2));
                return;
            }
            callback(data);
        });
    }

    /**
     * Delete a record from the table in dynamodb
     * 
     * @param {string} tableName - name of the table
     * @param {object} key - key of the record to be deleted
     * @param {object} options - other parameters needed
     * @param {function} callback - callback upon finishing
     * @param {function} errorCallback - error callback if something wrong happened
     */
    function awsDeleteRecordDynamoDBTable(tableName, key, options, callback, errorCallback) {  
        // Prepare the parameters to be passed
        var params = {
            TableName : tableName,
            Key: key
        };

        // Merge the basic parameters to the options
        Object.assign(params, options);

        // Send the request to create a table
        dynamoDocClient.delete(params, function(error, data) {
            // Check if no error
            if (error) {
                errorCallback(JSON.stringify(error, undefined, 2));
                return;
            }
            callback(data);
        });
    }

    /**
     * Batch Insert record to a table in dynamodb
     * 
     * @param {string} tableName - name of the table
     * @param {array} data - data to be inserted
     * @param {object} options - other parameters needed
     * @param {function} callback - callback upon finishing
     * @param {function} errorCallback - error callback if something wrong happened
     */ 
    function awsBatchInsertRecordDynamoDBTable(tableName, data, options, callback, errorCallback) {
        // Prepare the parameters to be passed
        var params = {
            TableName : tableName,
            Item: data
        };

        // Merge the basic parameters to the options
        Object.assign(params, options);

        // Send the request to create a table
        dynamoDocClient.put(params, function(error, data) {
            // Check if no error
            if (error) {
                errorCallback(JSON.stringify(error, undefined, 2));
                return;
            }
            callback(data);
        });
    }

    return {
        init: function() {
            return init.apply(this, arguments);
        },
        formatAWSResult: function() {
            return formatAWSResult.apply(this, arguments);
        },
        awsDescribeDynamoDBTable: function() {
            return awsDescribeDynamoDBTable.apply(this, arguments);
        },
        awsScanDynamoDBTable: function() {
            return awsScanDynamoDBTable.apply(this, arguments);
        },
        awsInsertRecordDynamoDBTable: function() {
            return awsInsertRecordDynamoDBTable.apply(this, arguments);
        },
        awsUpdateRecordDynamoDBTable: function() {
            return awsUpdateRecordDynamoDBTable.apply(this, arguments);
        },
        awsDeleteRecordDynamoDBTable: function() {
            return awsDeleteRecordDynamoDBTable.apply(this, arguments);
        },
        awsBatchInsertRecordDynamoDBTable: function() {
            return awsBatchInsertRecordDynamoDBTable.apply(this, arguments);
        }
    };

})();