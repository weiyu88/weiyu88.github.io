var fx=0;
var cWidth=576;

window.addEventListener('load', function() {
    setTimeout(function() {
        window.MobileAccessibility.usePreferredTextZoom(false);
        window.MobileAccessibility.getTextZoom(function(d) {
            fx = d/100;
        });
    }, 200);
});

function bbCodeToCanvas(prm) {
	prm=prm||{};
	
	prm.font=prm.font||'monospace';
	prm.size=prm.size||'17pt';
	prm.marginTop=prm.marginTop||0;
	prm.marginLeft=prm.marginLeft||0;
	prm.marginRight=prm.marginRight||0;
	prm.marginBottom=prm.marginBottom||0;
	prm.listImage=[];
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
    };
    CanvasText.prototype = {
        _position: null,
        _size: null,
        _textStack: null,
        _currentOptionSet: null,
    
        _newOptionSet: function() {
            if (this._currentOptionSet != null) {
                return;
            }
            this._currentOptionSet = { text: '', family: '', size: '', style: '', decoration: '', image: '' }
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
        image: function(image) {
            this._newOptionSet();
            this._currentOptionSet.image = image;
            return this;
        },
        decoration: function(decoration) {
            this._newOptionSet();
            this._currentOptionSet.decoration=decoration;
            return this;
        },
        append: function(text) {
            this._newOptionSet();
            if (this._currentOptionSet.image != true) {
                this._currentOptionSet.text = text;
            }
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
                        textAdjustment.y += (parseInt(previousFontOptions.size, 15) * fx); //parseInt(previousFontOptions.size, 15);
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

                        startX = (this._position.x + textAdjustment.x) * fx; //+ 0;//4;
                        endX = (this._position.x + textAdjustment.x + textWidth) * fx; //+ 0;//4;

                        context.lineWidth = underlineHeight;
                        context.moveTo(startX, startY);
                        context.lineTo(endX, endY);
                        context.stroke();
                    }
                    
                    textAdjustment.x += currentWordWidth;
                }
            }
            this._size.height= (textAdjustment.y+50+fx);
            context.restore();
        }
    }
    var self = this;
    var canvas=document.createElement('canvas');
    canvas.setAttribute('width', cWidth);

    var myText = new CanvasText({ x: prm.marginLeft, y: prm.marginTop+24},{
        width: (canvas.width - prm.marginRight),
        height: canvas.height - prm.marginBottom
    });
	
	var context = canvas.getContext('2d');
    /** Canvas Configuration Stop */
    
    var sty={ bold:false, italic:false };
    var dec={ underline: false, strikethrough: false };
    var image={ image: true };
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
    function setDec() {
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
    function preImage(sources, callback) {
        var images = [];
        var loadedImages = 0;
        var numImages = 0;

        for (var src in sources) {
            numImages++;
        }
        for (var src in sources) {
            images[src] = new Image();
            images[src].crossOrigin = 'Anonymous';
            images[src].onload = function() {
                if (++loadedImages >= numImages) {
                    callback(images);
                }
            };
            images[src].src = sources[src];
        }
    }
    function isEmpty(obj) {
        for(var prop in obj) {
            if(obj.hasOwnProperty(prop))
                return false;
        }
        return true;
    }
    function preLoadedImage(listImage) {
        var sources = [];
        prm.listImage=[];
        var tmpImage = {};

        listImage.map(function(imgs) {
            var attribute = {};
            var imageAttr = imgs.match(/(sx|sy|swidth|sheight|x|y|width|height)=(\d*)/g);
            var imageData = imgs.replace(/(\[.*?])/g, '');
            if (imageAttr != null) {
                for (var i = 0; i < imageAttr.length; i++) {
                    var imgRes = imageAttr[i].split('=');
                    attribute[imgRes[0]] = parseInt(imgRes[1]);
                }
                tmpImage[imageData] = attribute;
            }
            prm.listImage.push(imageData);
            sources.push(imageData);
        });

        preImage(sources, function(images) {
            images.map(function(imgResult) {
                if (isEmpty(tmpImage) === true) {
                    var x = 0;
                    var y = 0;
                    context.drawImage(imgResult, x, y);
                }
                else {
                    var imageWithAttr = tmpImage[imgResult.getAttribute('src')];

                    if (imageWithAttr !== undefined) {
                        var x = (imageWithAttr.x === undefined ? 0 : imageWithAttr.x);
                        var y = (imageWithAttr.y === undefined ? 0 : imageWithAttr.y);

                        if (imageWithAttr.width !== undefined &&
                            imageWithAttr.height !== undefined
                        ) {
                            context.drawImage(
                                imgResult,
                                x,
                                y,
                                imageWithAttr.width,
                                imageWithAttr.height
                            );
                        }
                        else if (imageWithAttr.sx !== undefined &&
                            imageWithAttr.sy !== undefined &&
                            imageWithAttr.swidth !== undefined &&
                            imageWithAttr.sheight !== undefined &&
                            imageWithAttr.width !== undefined &&
                            imageWithAttr.height !== undefined
                        ) {
                            context.drawImage(
                                imgResult,
                                imageWithAttr.sx,
                                imageWithAttr.sy,
                                imageWithAttr.swidth,
                                imageWithAttr.sheight,
                                x,
                                y,
                                imageWithAttr.width,
                                imageWithAttr.height
                            );
                        }
                        else {
                            context.drawImage(imgResult, x, y);
                        }
                    }
                    else {
                        context.drawImage(imgResult, 0, 0);
                    }
                }
            });
        });
    }

    var _tg=[];
    var rep=prm.text.replace(/\[\/?[\w\=\"|']+\]/g,function(x){
        _tg.push(x)
        return '';
    });

    var img = prm.text;
    var regexImage = new RegExp(/img/);
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
            if(_tg[i].match(/\[b/)){spl[i]
                myText.style(setSty('bold',true));
            } else if (_tg[i].match(/\[\/b/)){
                myText.style(setSty('bold',false));
            } else if(_tg[i].match(/\[img/)) {
                myText.image(true);
                preLoadedImage(img.match(/\[img(.*?)\[\/img]/g));
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

    var wForCanvas = cWidth;
    var hForCanvas = (prm.marginTop + myText._size.height + prm.marginBottom);

    canvas.width = cWidth * fx;
    canvas.height = (prm.marginTop + myText._size.height + prm.marginBottom) * fx;

    myText.render();

    var canvasReal = document.createElement('canvas');

    canvasReal.setAttribute('width', wForCanvas);
    canvasReal.setAttribute('height', hForCanvas);

    contextReal = canvasReal.getContext('2d');
    contextReal.drawImage(canvas,0,0,wForCanvas,hForCanvas);

    return canvasReal;
}

function getCanvasPrm(prm, cb) {
    cb(bbCodeToCanvas(prm));
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

function loadImages(arr) {    
    var newimages = [],
        loadedimages = 0;    
    var postaction = function() {};    
    var arr = (typeof arr != "object") ? [arr] : arr;    
    function imageloadpost() {        
        loadedimages++       
        if (loadedimages == arr.length) {            
            postaction(newimages);        
        }    
    }    
    for (var i = 0; i < arr.length; i++) {        
        newimages[i] = new Image();        
        newimages[i].src = arr[i];        
        newimages[i].onload = function() {            
            imageloadpost();        
        }        
        newimages[i].onerror = function() {            
            imageloadpost();        
        }    
    }    
    return {        
        done: function(f) {            
            postaction = f || postaction;        
        }    
    }
}

function setDPI(canvas, dpi) {
    if (!canvas.style.width)
        canvas.style.width = canvas.width + 'px';
    if (!canvas.style.height)
        canvas.style.height = canvas.height + 'px';

    var scaleFactor = dpi / 96;
    canvas.width = Math.ceil(canvas.width * scaleFactor);
    canvas.height = Math.ceil(canvas.height * scaleFactor);
    var ctx = canvas.getContext('2d');
    ctx.scale(scaleFactor, scaleFactor);
}

registerFunction({
    /** canvas bbtocanvas (new) */
    'bbCodeToCanvas': function(prm) {
        return bbCodeToCanvas(prm);
    },

    'bbCodeToCanvasSync': function(prm) {
        var self = this;
        getCanvasPrm(prm,function(canvas) {
            loadImages(prm.listImage).done(function(images) {
                _doAction(prm.callback,AM.update(self||{},{input:canvas}));
            });
        });
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