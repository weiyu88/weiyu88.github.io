function bbCodeToCanvas(prm) {
	prm=prm||{};
	
	prm.font=prm.font||'monospace';
	prm.size=prm.size||'17pt';
	prm.marginTop=prm.marginTop||0;
	prm.marginLeft=prm.marginLeft||0;
	prm.marginRight=prm.marginRight||0;
	prm.marginBottom=prm.marginBottom||0;
	//prm.canvasHeight=prm.canvasHeight||150;
	
    /** Canvas Configuration Start */
    var CanvasText = function(position, size) {
        this._textStack = [];
        if (position === null || position === undefined) {
            position = {x: 0,y: 0}
        }
        if (size === null || size === undefined) {
            size = {width: 100,height: 100}
        }
        this._position = position;
        this._size = size;
    }
    CanvasText.prototype = {
        _position: null,
        _size: null,
        _textStack: null,
        _currentOptionSet: null,
    
        _newOptionSet: function() {
            if (this._currentOptionSet != null) {
                return;
            }
            this._currentOptionSet = { text: '', family: '', size: '', style: '', decoration: '' }
        },
        position: function(x, y) {
            this._position.x = x;
            this._position.y = y;
        },
        family: function(family) {
            this._newOptionSet();
            this._currentOptionSet.family = family;
            return this;
        },
        size: function(size) {
            this._newOptionSet();
            this._currentOptionSet.size = size;
            return this;
        },
        style: function(style) {
            this._newOptionSet();
            this._currentOptionSet.style = style;
            return this;
        },
        decoration: function(decoration) {
            this._newOptionSet();
            this._currentOptionSet.decoration=decoration;
            return this;
        },
        append: function(text) {
            this._newOptionSet();
            this._currentOptionSet.text = text;
            this._textStack.push(this._currentOptionSet);
            this._currentOptionSet = null;
            return this;
        },
        newLine: function() {
            this.append('\n');
            return this;
        },
        render: function() {
            if (this._textStack.length == 0) {
                return;
            }
            var previousFontOptions = { text: '', family: '', size: '', style: '', decoration: ''};
            var textAdjustment = { x: 0, y: 0 };
    
            context.save();
            context.fillStyle="#FFFFFF";
            context.fillRect(0,0,canvas.width,canvas.height);
    
            for (var i = 0, textStackLen = this._textStack.length; i < textStackLen; i++) {
    
                var currentFontOptions = this._textStack[i];
                if (currentFontOptions.family) {
                    previousFontOptions.family = currentFontOptions.family;
                }
                if (currentFontOptions.size) {
                    previousFontOptions.size = currentFontOptions.size;
                }
                if (currentFontOptions.style) {
                    previousFontOptions.style = currentFontOptions.style;
                }
                context.font = previousFontOptions.style.trim() + ' ' + previousFontOptions.size.trim() + ' ' + previousFontOptions.family.trim();
                if (currentFontOptions.decoration) {
                    previousFontOptions.decoration = currentFontOptions.decoration;
                }
    
                var textToDraw = currentFontOptions.text;
                var wordsArray = textToDraw.split(' ');
    
                for (var j = 0, wordsArrayLen = wordsArray.length; j < wordsArrayLen; j++) {
                    var currentWord = ' ' + wordsArray[j];
                    var currentWordWidth = context.measureText(currentWord).width;
    
                    if (textAdjustment.x + currentWordWidth > this._size.width || textToDraw == '\n') {
                        textAdjustment.x = 0;
                        textAdjustment.y += parseInt(previousFontOptions.size, 15);
                    }
    
                    if (textToDraw == '\n') {
                        continue;
                    }
                    context.fillStyle = '#000';
                    context.fillText(
                        currentWord,                            // text
                        this._position.x + textAdjustment.x,    // x position
                        this._position.y + textAdjustment.y     // y position
    
                    );
                    
                     if (currentFontOptions.decoration) {
                        var dc=currentFontOptions.decoration;
                        //var textWidth = context.measureText(currentFontOptions.text).width;
                        var textWidth = currentWordWidth;
                        var startX = 0;
                        var startY = '';
                        
                        if(dc=="underline") {
                            startY = this._position.y + textAdjustment.y + (parseInt(previousFontOptions.size) / 10);
                        } else if(dc=="strikethrough") {
                            startY = this._position.y + textAdjustment.y - (parseInt(previousFontOptions.size) / 3);
                        }
                        
                        var endX = 0;
                        var endY = startY;
                        var underlineHeight = parseInt(previousFontOptions.size)/15;
                        
                        if(underlineHeight < 1){
                            underlineHeight = 1;
                        }
                        context.beginPath();
                        context.lineWidth = underlineHeight>=1?underlineHeight:1;
        
                        startX = this._position.x + textAdjustment.x + 4;
                        endX = this._position.x + textAdjustment.x + textWidth + 4;
        
                        context.lineWidth = underlineHeight;
                        context.moveTo(startX, startY);
                        context.lineTo(endX, endY);
                        context.stroke();
                    }
                    
                    textAdjustment.x += currentWordWidth;
                }
            }
			this._size.height= textAdjustment.y+50;
            context.restore();
        }
    }
    
    var canvas=document.createElement('canvas');
    canvas.setAttribute('width', '576');
	
	var myText = new CanvasText({ x: prm.marginLeft, y: prm.marginTop+24},{
        width: (canvas.width - prm.marginRight),
        height: canvas.height - prm.marginBottom
    });
	
	var context = canvas.getContext('2d');
    /** Canvas Configuration Stop */
    
    var sty={ bold:false, italic:false };
    var dec={ underline: false, strikethrough: false };
    function setSty(k,v){
        sty[k]=v;
        return getSty();
    }
    function getSty(){
        prm.text='';
        prm.text+=sty.bold?'bold':'';
        prm.text+=sty.italic?' italic':'';
        prm.text=prm.text.replace(/^\s/,'');
        return prm.text?prm.text:'normal';
    }
    function setDec(k,v) {
        dec[k]=v;
        return getDec();
    }
    function getDec() {
        prm.text='';
        prm.text+=dec.underline?'underline':'';
        prm.text+=dec.strikethrough?' strikethrough':'';
        prm.text=prm.text.replace(/^\s/,'');
        return prm.text?prm.text:'';
    }
    var _tg=[];
    var rep=prm.text.replace(/\[\/?[\w\=\"|']+\]/g,function(x){
        _tg.push(x)
        return '';
    });
    var spl=prm.text.split(/\[\/?[\w\=\"|']+\]/g);
    myText.family(prm.font).size(prm.size);
    for(var i=0;i<spl.length;i++){
        if(spl[i]){
            if(spl[i] != " ") {
				var xi=spl[i].split('\n');
				for(var ix=0;ix<xi.length;ix++){
					myText.append(xi[ix]);
					if (ix<xi.length-1) {
						myText.append('\n');
					}
				}
            }
        };
        if (_tg[i]) {
            if(_tg[i].match(/\[b/)){
                myText.style(setSty('bold',true));
            } else if (_tg[i].match(/\[\/b/)){
                myText.style(setSty('bold',false));
            } else if (_tg[i].match(/\[i/)){
                myText.style(setSty('italic',true));
            } else if (_tg[i].match(/\[\/i/)){
                myText.style(setSty('italic',false));
            } else if(_tg[i].match(/\[u/)) {
                myText.decoration(setDec('underline',true));
            } else if(_tg[i].match(/\[\/u/)) {
                myText.decoration(setDec('underline', false));
            } else if(_tg[i].match(/\[font=/)) {
                var fam=_tg[i].split(/\[font="|'/);
                myText.family(fam[1]);
            } else if(_tg[i].match(/\[\/font/)) {
                myText.family(prm.font);
            } else if(_tg[i].match(/\[size=/)) {
                var sz=_tg[i].split(/\[size="|'/);
                myText.size(sz[1]);
            } else if(_tg[i].match(/\[\/size/)) {
                myText.size(prm.size);
            } else if(_tg[i].match(/\[s/)) {
                myText.decoration(setDec('strikethrough', true));
            } else if(_tg[i].match(/\[\/s/)) {
                myText.decoration(setDec('strikethrough', false));
            } 
        }
    }
	myText.render();
	canvas.height = prm.marginTop + myText._size.height + prm.marginBottom;
	myText.render();
    return canvas;
}

var toRLE=function(d){
    var a=[];
    for(var y=0;y<d.length;y++){
        a.push(RLE.encode(d[y].slice(0)))
    }
    return a;
};
var toStr=function(a) {
    var s='';
    for(var x=0;x<a.length;x++){
        var sm=String.fromCharCode(a[x]);
        s+=sm;
    }
    return s;
};
var toEXPL=function(d){
    var dd=toRLE(d);
    var s=toStr([27,80,36]);
    for(var y=0;y<dd.length;y++){
        s+=toStr([27,118,1,72])+toStr(dd[y]);
    }
    return (s+toStr([4]));
}

registerFunction({
    /** canvas bbtocanvas (new) */
    'bbCodeToCanvas': function(prm) {
        return bbCodeToCanvas(prm);
    },
    /** canvas to ExPCL (new)*/
	'canvasToExPCL': function(prm) {
        var context = prm.canvas.getContext('2d');
        var px =[];
        var dt=context.getImageData(0, 0, prm.canvas.width, prm.canvas.height).data;
        var yy=-1;
        for (var i=0;i<dt.length;i+=prm.canvas.width*4) {
            yy++;
            var xx=-1;
            var x=0;
            var br=[];
            for(j=0;j<prm.canvas.width*4;j+=4) {
                xx++;
                var g=Math.floor((dt[yy*prm.canvas.width*4+(xx*4)]+dt[yy*prm.canvas.width*4+(xx*4)+1]+dt[yy*prm.canvas.width*4+(xx*4)+2]) / 3);
                if (g<128) { 
                    x= x | (1<<(7-(xx % 8)));
                }
                if (xx % 8 >=7) {
                    br.push(x);
                    x=0;
                }
            }
            px.push(br);
        }
		return toEXPL(px);
	}
	/** canvas to ExPCL */
},'App');