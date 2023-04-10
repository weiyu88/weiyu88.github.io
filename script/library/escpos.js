var escpos = (function() {

    var buffer, state, encoding;

    /**
     * Resets the variables to its original state
     */
    function reset() {
        buffer = [];
        encoding = null;
        state = {
            bold: false,
            italic: false,
            underline: false
        };
    }

    /**
     * Add commands to the buffer
     * 
     * @param {array} value 
     */
    function queue(value) {
        buffer = buffer.concat(value);
    }

    /**
     * Sets the encoding
     * 
     * @param {string} enc 
     */
    function setEncoding(enc)
    {
        encoding = enc;
    }

    /**
     * Functions that will be made publicly accessible
     */

     /**
      * Initializes the variables and printer
      */
    function init() {
        // Reset the variables
        reset();

        // initialize printer
        queue([0x1b, 0x40]);
    }

    /**
     * Prints a text
     * 
     * @param {string} value 
     */
    function text(value) {
        var dec = [];
        // Check if there's encoding
        if (encoding) {
            var encoder = new TextEncoder(encoding, { NONSTANDARD_allowLegacyEncoding: true });
            var data = encoder.encode(value);
            dec = Array.prototype.slice.call(data);
        } else {
            // convert to decimal
            var arr = value ? value.split('') : [];
            for (var i = 0; i < arr.length; i++) {
                dec.push(arr[i].charCodeAt());
            }
        }

        // ESC d 0
        queue(dec.concat([0x1b, 0x64, 0x00]));
    }

    /**
     * Bold text
     * 
     * @param {boolean} value 
     */
    function bold(value) {
        if (typeof value === 'undefined') {
            value = !state.bold;
        }

        state.bold = value;

        // ESC E
        queue([0x1b, 0x45, Number(value)]);
    }

    /**
     * Change the size of the text
     * 
     * @param {string} value    
     */
    function size(value) {
        if (value === 'small') {
            value = 0x01;
        } else {
            value = 0x00; // normal
        }

        // ESC M
        queue([0x1b, 0x4d, value]);
    }

    /**
     * Prints text in italic
     * 
     * @param {boolean} value 
     */
    function italic(value) {
        if (typeof value === 'undefined') {
            value = !state.italic;
        }

        state.italic = value;

        // ESC 4
        queue([0x1b, 0x34, Number(value)]);
    }

    /**
     * Prints text with underline
     * 
     * @param {boolean} value 
     */
    function underline(value) {
        if (typeof value === 'undefined') {
            value = !state.underline;
        }

        state.underline = value;

        // ESC -
        queue([0x1b, 0x2d, Number(value)]);
    }

    /**
     * Prints newline
     */
    function newLine() {
        // LF CR
        queue([0x0a, 0x0d]);
    }

    /**
     * Aligns the text
     * 
     * @param {string} value    left, center, right
     */
    function alignment(value) {
        // convert to lowercase
        value = value ? value.toLowerCase() : '';

        // list of alignments
        var alignments = {
            left: 0x00,
            center: 0x01,
            right: 0x02
        };

        // Check if alignment is in the list
        if (value in alignments) {
            // ESC a
            queue([0x1b, 0x61, alignments[value]]);
        }
    }

    /**
     * Set the line spacing
     * 
     * @param {int} value 
     */
    function lineSpacing(value) {
        // ESC ETX
        queue([0x1b, 0x03, Number(value)]);
    }

    /**
     * @param {array} data 
     */
    function raw(data) {
        queue(data);
    }

    /**
     * Encode commands
     * 
     * @returns {Uint8Array}
     */
    function encode() {
        var length = 0;

        buffer.forEach(function(value){
            if (typeof value === 'number') {
                length++;
            } else {
                length += value.length;
            }
        });

        var result = new Uint8Array(length);
        var index = 0;
        
        buffer.forEach(function(value){
            if (typeof value === 'number') {
                result[index] = value;
                index++;
            } else {
                result.set(value, index);
                index += value.length;
            }
        });

        // Reset the variables after encoding
        reset();

        return result;
    }

    return {
        init: function() {
            init.apply(this, arguments);
            return this;
        },
        encoding: function() {
            setEncoding.apply(this, arguments);
            return this;
        },
        text: function() {
            text.apply(this, arguments);
            return this;
        },
        bold: function() {
            bold.apply(this, arguments);
            return this;
        },
        underline: function() {
            underline.apply(this, arguments);
            return this;
        },
        italic: function() {
            italic.apply(this, arguments);
            return this;
        },
        size: function() {
            size.apply(this, arguments);
            return this;
        },
        newLine: function() {
            newLine.apply(this, arguments);
            return this;
        },
        alignment: function() {
            alignment.apply(this, arguments);
            return this;
        },
        lineSpacing: function() {
            lineSpacing.apply(this, arguments);
            return this;
        },
        raw: function() {
            raw.apply(this, arguments);
            return this;
        },
        encode: function() {
            return encode.apply(this, arguments);
        }
    };

})();
