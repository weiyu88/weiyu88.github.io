var pcx = function() {
    //===================

    function strHexToArray(s) {
        var a = [];
        (s.split(' ')).forEach(function(v) { a.push(parseInt(v, 16)) });
        return a;
    }

    var pcxRleMask = 0xC0;
    var pcxPaletteMarker = 0x0C;

    var mStream = function(input) {
        this.input = input;
        this.i = 0;
    }
    mStream.prototype.readByte = function() {
        return this.input[this.i++];
    }
    mStream.prototype.writeByte = function(value) {
        return this.input.push(value);
    }
    mStream.prototype.readWord = function() {
        var x1 = this.input[this.i++];
        var x2 = this.input[this.i++];
        return (x2 << 8) | x1;
    }
    mStream.prototype.writeWord = function(value) {
        var x1 = (value & 0xff00) >> 8;
        var x2 = (value & 0xff);
        this.input.push.apply(this.input, [x2, x1]);
    }
    mStream.prototype.read = function(le) {
        var r = this.input.slice(this.i, this.i + le); //The original array will not be changed
        this.i += le;
        return r;
    }
    mStream.prototype.write = function(value) {
        this.input.push.apply(this.input, value);
    }

    function parseHeader(inp) {
        var h = new mStream(inp);
        return {
            identifier: h.readByte(),
            version: h.readByte(),
            encoding: h.readByte(),
            bitsPerPixel: h.readByte(),
            xStart: h.readWord(),
            yStart: h.readWord(),
            xEnd: h.readWord(),
            yEnd: h.readWord(),
            horzRes: h.readWord(),
            vertRes: h.readWord(),
            palette: h.read(48),
            reserved1: h.readByte(),
            numBitPlanes: h.readByte(),
            bytesPerLine: h.readWord(),
            paletteType: h.readWord(),
            horzScreenSize: h.readWord(),
            vertScreenSize: h.readWord(),
            reserved2: h.read(54)
        }
    }

    function fill(a, v, r) {
        for (var i = 0; i < r; i++) {
            a.push(v);
        }
        return a;
    }

    function writeHeader(o) {
        var a = [];
        var m = new mStream(a);
        m.writeByte(10); //identifier
        m.writeByte(5); //version
        m.writeByte(1); //encoding
        m.writeByte(1); //bitsPerPixel
        m.writeWord(0); //xStart
        m.writeWord(0); //yStart
        m.writeWord((o.width || 576) - 1); //xEnd
        m.writeWord((o.height || 1) - 1); //yEnd
        m.writeWord(75); //horzRes
        m.writeWord(75); //vertRes
        m.write(fill(fill([], 0, 3), 255, 48 - 3)); //palette
        m.writeByte(0); //reserved1
        m.writeByte(1); //numBitPlanes
        m.writeWord(72); //bytesPerLine
        m.writeWord(18); //paletteType
        m.writeWord(120); //horzScreenSize
        m.writeWord(0); //vertScreenSize
        m.write(fill([], 0, 54)); //reserved2
        return a;
    }

    var pcxRleByteReader = function(input) {
        this.m_stream = new mStream(input);
        this.m_count = 0;
        this.m_rleValue = 0;
    }

    pcxRleByteReader.prototype.readByte = function() {
        if (this.m_count > 0) {
            this.m_count--;
            return this.m_rleValue;
        } else {
            var code = this.m_stream.readByte();

            if ((code & pcxRleMask) == pcxRleMask) {
                this.m_count = (code & (pcxRleMask ^ 0xff));
                this.m_rleValue = this.m_stream.readByte();

                this.m_count--;
                return this.m_rleValue;
            } else {
                return code;
            }
        }
    }

    var pcxIndexReader = function(reader) {
        this.m_reader = reader;
        this.m_bitsPerPixel = 1;
        this.m_bitMask = 1;
        this.m_bitsRemaining = 0;
        this.m_byteRead = null;
    }
    pcxIndexReader.prototype.readIndex = function() {
        if (this.m_bitsRemaining == 0) {
            this.m_byteRead = this.m_reader.readByte();
            this.m_bitsRemaining = 8;
        }
        var index = (this.m_byteRead >> (8 - this.m_bitsPerPixel)) & this.m_bitMask;
        this.m_byteRead = this.m_byteRead << this.m_bitsPerPixel;
        this.m_bitsRemaining -= this.m_bitsPerPixel;
        return index;
    }

    function readAll(inp, height, width) {
        var reader = new pcxRleByteReader(inp);
        var indexReader = new pcxIndexReader(reader);
        var out = [];
        for (var y = 0; y < height; y++) {
            var outy = [];
            for (var x = 0; x < width; x++) {
                outy.push(indexReader.readIndex());
            }
            out.push(outy);
        }
        return out;
    }

    var pcxIndexWriter = function(writer) {
        this.m_writer = writer;
        this.m_bitsPerPixel = 1;
        this.m_bitMask = 1;

        this.m_bitsUsed = 0;
        this.m_byteAccumulated = 0;
    }
    pcxIndexWriter.prototype.writeIndex = function(index) {
        this.m_byteAccumulated = (this.m_byteAccumulated << this.m_bitsPerPixel) | (index & this.m_bitMask);
        this.m_bitsUsed += this.m_bitsPerPixel;

        if (this.m_bitsUsed == 8) {
            this.flush();
        }
    }
    pcxIndexWriter.prototype.flush = function() {
        if (this.m_bitsUsed > 0) {
            this.m_writer.writeByte(this.m_byteAccumulated);
            this.m_byteAccumulated = 0;
            this.m_bitsUsed = 0;
        }
    }

    var pcxRleByteWriter = function(output) {
        if (output) {
            if (output instanceof Array) {
                this.m_stream = new mStream(output);
            } else {
                this.m_stream = output;
            }
        } else {
            this.m_stream = new mStream();
        }
        this.m_lastValue;
        this.m_count = 0;
    }
    pcxRleByteWriter.prototype.writeByte = function(value) {
        if (this.m_count == 0 || this.m_count == 63 || value != this.m_lastValue) {
            this.flush();
            this.m_lastValue = value;
            this.m_count = 1;
        } else {
            this.m_count++;
        }
    }
    pcxRleByteWriter.prototype.flush = function() {
        if (this.m_count == 0) {
            return;
        } else if ((this.m_count > 1) || ((this.m_count == 1) && ((this.m_lastValue & pcxRleMask) == pcxRleMask))) {
            this.m_stream.writeByte(pcxRleMask | this.m_count);
            this.m_stream.writeByte(this.m_lastValue);
            this.m_count = 0;
        } else {
            this.m_stream.writeByte(this.m_lastValue);
            this.m_count = 0;
        }
    }

    function writeAll(a) {
        var out = [];
        var byteWriter = new pcxRleByteWriter(out);
        var indexWriter = new pcxIndexWriter(byteWriter);
        for (var y = 0; y < a.length; y++) {
            for (var x = 0; x < a[y].length; x++) {
                indexWriter.writeIndex(a[y][x]);
            }
            indexWriter.flush();
            byteWriter.flush();
        }
        indexWriter.flush();
        byteWriter.flush();
        return out;
    }

    function toStr(a) {
        var s = '';
        for (var x = 0; x < a.length; x++) {
            var sm = String.fromCharCode(a[x]);
            s += sm;
        }
        return s;
    };

    function canvasToPcx(canvas) {
        var out = writeHeader({ height: canvas.height });
        var byteWriter = new pcxRleByteWriter(out);
        var indexWriter = new pcxIndexWriter(byteWriter);

        var context = canvas.getContext('2d');
        var dt = context.getImageData(0, 0, canvas.width, canvas.height).data;
        var yy = -1;
        for (var i = 0; i < dt.length; i += canvas.width * 4) {
            yy++;
            var xx = -1;
            for (j = 0; j < canvas.width * 4; j += 4) {
                xx++;
                var g = Math.floor((dt[yy * canvas.width * 4 + (xx * 4)] + dt[yy * canvas.width * 4 + (xx * 4) + 1] + dt[yy * canvas.width * 4 + (xx * 4) + 2]) / 3);
                indexWriter.writeIndex(g < 128 ? 0 : 1);
            }
            indexWriter.flush();
            byteWriter.flush();
        }
        indexWriter.flush();
        byteWriter.flush();
        return toStr(out);
    }

    function save(ou) {
        window.location.href = 'data:image/pcx;base64,' + btoa(ou);
    }

    function toCPCL(ou, height) {
        return "! 0 200 200 " + Math.floor((height - 1) * 0.93) + " 1\r\nPW 575\r\nTONE 0\r\nSPEED 3\r\nON-FEED IGNORE\r\nNO-PACE\r\nBAR-SENSE\r\nPCX 0 0 " + ou + "\r\nPRINT\r\n";
    }
    //===================
    return {
        fromCanvas: canvasToPcx,
        toCPCL: function(canvas) {
            return toCPCL(canvasToPcx(canvas), canvas.height);
        },
        save: save
    }
}();
registerFunction({

    /** canvas to CPCL (new)*/
    'canvasToCPCL': function(prm) {
        return pcx.toCPCL(prm.canvas);
    }
}, 'App');