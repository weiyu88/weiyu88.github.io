var cpcl = (function() {

    var buffer, state, encoding, lineHeight, currentY = 0, fontSize, fontType;

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
    function init(paramHeight = 210, paramLineHeight = 32, paramFontSize = 0, paramFontType = 2) {
        currentY = 0;
	    currentX=180;	
        // Reset the variables
        reset();
        lineHeight = paramLineHeight
        fontSize = paramFontSize
        fontType = paramFontType
        // initialize printer
        queue(["! 0 200 200 "+paramHeight+" 1\r\n"]);
    }

    /**
     * Prints a text
     * 
     * @param {string} value 
     */
    function text(value) {
        queue(["TEXT "+fontType+" "+fontSize+" "+ currentX+" "+ currentY+" "+value+"\r\n"]);
        currentY += lineHeight
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

        if (value) {
            queue(["SETBOLD 2\r\n"]);
        } else {
            queue(["SETBOLD 0\r\n"]);
        }
    }

    /**
     * Change the size of the text
     * 
     * @param {string} value    
     */
    function size(value) {
       
    }

    /**
     * Prints text in italic
     * 
     * @param {boolean} value 
     */
    function italic(value) {

    }

    /**
     * Prints text with underline
     * 
     * @param {boolean} value 
     */
    function underline(value) {
        
    }

    /**
     * Prints newline
     */
    function newLine() {
        // LF CR
        queue([""]);
    }

    /**
     * Aligns the text
     * 
     * @param {string} value    left, center, right
     */
    function alignment(value) {
        
    }

    /**
     * Set the line spacing
     * 
     * @param {int} value 
     */
    function lineSpacing(value) {
        
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
        let result = buffer.join("") + "PRINT\r\n";
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
