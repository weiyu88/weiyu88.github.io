/**
 * Converts filter from soap to odata
 */
var oDataFilter = (function(){
    
    /**
     * List of operators
     */
    var operators = [
        'ne', 'ge', 'le', 'eq', 'lt', 'gt'
    ];
    
    /**
     * Operators
     */
    var mapOperators = {
        '<>': 'ne',
        '!=': 'ne',
        '>=': 'ge',
        '<=': 'le',
        '=': 'eq',
        '==': 'eq',
        '<': 'lt',
        '>': 'gt',
        'like': 'contains',
        'ilike': 'contains'
    };
    
    /**
     * This is a workaround
     * Just to get the right values
     */
    var mapValues = {
        'G_L_Account': 'G/L Account'
    };
    
    /**
     * Get the value from the map
     * 
     * @param {string} value
     * @returns {string}
     */
    function getMapValues(value) {
        var keys = Object.keys(mapValues);
        return keys.indexOf(value) !== -1 ? mapValues[value] : value;
    }
    
    /**
     * Checks if the value is a date
     * 
     * Solution from here:
     * https://stackoverflow.com/questions/6177975/how-to-validate-date-with-format-mm-dd-yyyy-in-javascript/6178341#6178341
     * 
     * @param {string} value
     * @returns {Boolean}
     */
    function isDate(value) {
        // yyyy
        var formatRegex = /^\d{4}\-\d{1,2}\-\d{1,2}$/;
        
        if (!formatRegex.test(value)) {
            return false;
        }
        
        // Parse the date parts to integers
        var parts = value.split('-');
        var day = parseInt(parts[2], 10);
        var month = parseInt(parts[1], 10);
        var year = parseInt(parts[0], 10);

        // Check the ranges of month and year
        if(year < 1000 || year > 3000 || month === 0 || month > 12) {
            return false;
        }

        var monthLength = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];

        // Adjust for leap years
        if(year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0)) {
            monthLength[1] = 29;
        }

        // Check the range of the day
        return day > 0 && day <= monthLength[month - 1];
    }
    
    /**
     * 10..20
     * Field ge 10 and Field le 20
     * 
     * 1&>8
     * Field eq 1 and Field ge 8 
     * 
     * ..500|800..
     * Field le 500 or Field ge 800
     * 
     * >50&<100
     * Field gt 50 and Field lt 100
     * 
     * >50
     * Field gt 50
     * 
     * @param {string} field
     * @param {string} value
     * @returns {string}
     */
    function parse(field, value) {
        // check if undefined
        if (typeof value === 'undefined' || value === null || value === false) {
            return;
        }
        
        // check if the value is a number
        if (typeof value === 'number') {
            return getExpression(field, 'eq', value);
        }

        var 
            // initialize to null
            logicOp = null;

            // regex pattern
            pattern = /\'[\-\w\.\$\%\*\/\|\&\s]*\'/g,

            splitValue = value.split(pattern),
            splitCount = splitValue.length - 1,

            joinValue = splitValue.join(''),

            delimeter = '|',
            countPipe = joinValue.split(delimeter).length;

        // if this is zero then there's no operator
        if (splitCount > 0) {
            // check if not equal
            if (splitCount != countPipe) {
                // maybe this is &
                delimeter = '&';
                var countAmp = joinValue.split(delimeter).length;
                if (splitCount != countAmp) {
                    // throw an exception because there's a combination of | and &
                    throw "Invalid filter criteria";
                }
            }
        }

        var operands = [];
        value.replace(pattern, function(val) {
            operands.push(val);
        });

        if (operands.length >= 2) {
            logicOp = delimeter === '|' ? 'or' : 'and';
        }
        
        // greater than 2 meaning there are more than one logic symbol
        // e.g. 1|2|3
        if (operands.length > 2) {
            // comment this for now
            // not sure why I limit to only this 
            //throw "Invalid filter criteria";
        }
        
        if (logicOp) {
            var listOperands = [];
            for (var i in operands) {
                listOperands.push(parse(field, operands[i]));
            }
            return '(' + listOperands.join(' ' + logicOp + ' ') + ')';
        } else {
            if (value.indexOf('..') !== -1) {
                var expr = value.split('..');
                
                if (expr.length > 2) {
                    throw "Invalid filter criteria";
                }
                
                // check if first element is blank
                if (!expr[0]) {
                    return getExpression(field, 'le', expr[1]);
                } else if (expr[0] && !expr[1]) {
                    return getExpression(field, 'ge', expr[0]);
                } else {
                    return '(' + getExpression(field, 'ge', expr[0]) + ' and ' + getExpression(field, 'le', expr[1]) + ')';
                }
            } else if (value.indexOf('*') !== -1) {
                if (value.match(/^\*/)) {
                    // * at the beginning of the value
                    return 'startswith(' + field + ", '" + value.replace(/\*/, '') + "')";
                } else if (value.match(/\*$/)) {
                    // * at the end of the value
                    return 'endswith(' + field + ", '" + value.replace(/\*/, '') + "')";
                }
            } else {
                // get operators (soap)
                var operatorList = Object.keys(mapOperators);
                
                // loop through operators to find the right operator
                for (var i in operatorList) {
                    var expr = value.split(operatorList[i]);
                    if (expr.length === 2) {
                        return getExpression(field, operators[i], expr[0] ? expr[0] : expr[1]);
                    }
                }
            }
            
            // default to eq
            return getExpression(field, 'eq', value);
        }
    }
    
    /**
     * @param {string} field
     * @param {string} operator
     * @param {string} value
     * @returns {string}
     */
    function getExpression(field, operator, value) {
        // if this is a null then just return
        if (typeof value === 'undefined' || value === null || value === false) {
            return;
        }
        
        // check the operator if it is already using the odata form
        // if not then get the correct operator from the map
        operator = operators.indexOf(operator) !== -1 ? operator : mapOperators[operator];
        
        if (typeof value === 'boolean' || value === 'true' || value === 'false') {
            // no change in the value
        } else if (typeof value === 'string' && !isDate(value)) {
            // remove space and '
            value = $.trim(value).replace(/\'/g, '');
            value = "'" + getMapValues(value) + "'";
        }

        // Check the operator for using contains
        if (operator == 'contains') {
            return 'contains(' + field + ', ' + value + ')';
        }
        
        return field + ' ' + operator + ' ' + value;
    }
    
    /**
     * Converts the filter to odata
     * 
     * @param {array} criteriaAnd - The criteria to be used for and
     * @param {array} criteriaOr  - The criteria to be used for or
     * @returns string
     */
    function convert(criteriaAnd, criteriaOr) {

        // Process through the and filters
        var expressionsAnd = processFilter(criteriaAnd);

        // Process through the or filters
        var expressionsOr = processFilter(criteriaOr);

        // Prepare the string format for odata
        var oDataFilter = '';

        // Check if there are valid filters for both and filter and or filter.
        if (expressionsAnd.length > 0) {
            oDataFilter += '(' + expressionsAnd.join(' and ') + ')';
        }

        if (expressionsAnd.length > 0 && expressionsOr.length > 0) {
            oDataFilter += ' and ';
        }

        if (expressionsOr.length > 0) {
            oDataFilter += '(' + expressionsOr.join(' or ') + ')';
        }

        return oDataFilter ? oDataFilter : null;

    }

    /**
     * Process the filter format of emobiq to the format of odata
     * @param {array} criteria - The emobiq format filter to process
     * 
     * @return array
     */
    function processFilter(criteria) {
        var expressions = [];

        if (!criteria) {
            return expressions;
        }

        // loop through criteria
        for (var i in criteria) {
            var field = criteria[i].f || criteria[i].field,
                operator = criteria[i].o || criteria[i].operator,
                value = (criteria[i].v !== undefined ? criteria[i].v : criteria[i].value);
        
            // check if there's an operator
            // if there's none then parse the value
            var expression = operator ? getExpression(field, operator, value) : parse(field, value);
            
            // check first before appending to the array
            if (expression) {
                expressions.push(expression);
            }
        }

        return expressions;
    }
    
    return {
        convert: function() {
            return convert.apply(this, arguments);
        }
    };
    
})();