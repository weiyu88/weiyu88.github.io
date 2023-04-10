function uint8a2str(a) {
  return String.fromCharCode.apply(null, a);
}

function str2uint8a(str) {
    var buf = new Uint8Array(str.length);
    for (var i=0, strLen=str.length; i < strLen; i++) {
        buf[i] = str.charCodeAt(i);
    }
    return buf;
}

var tag=function(_tg){
	function _expclf(open,close){
		return function(m,closetag,prms){
			if (!closetag) {
				return uint8a2str(new Uint8Array(open));
			} else {
				return uint8a2str(new Uint8Array(close));
			}
		}
	}

	var _tag=function (){
		var x={};
		for(var i in _tg){
			x[i]={
				k:new RegExp('\\[(\\\/?)'+i+'\\s*([\\s\\S]*?)\\s*\\]','g'),
				f:_expclf(_tg[i][0],_tg[i][1])
			}
		}
		return x;
	}();
	
	_tag['barcode']={
		//k:/\[(\/?)barcode\s*([\s\S]*?)\s*\]/g,
		k:/\[barcode\s*([\s\S]*?)\s*\]([\s\S]*)\[\/barcode\s*\]/g,
		f:function(m,prms,s){
			return uint8a2str(new Uint8Array([27, 90, 49, s.length, 48]))+
				s+
				uint8a2str(new Uint8Array([13,10]));
		}
	}
	
	return function(){
		var y=function(){
			var y2=[];
			for(var j in _tag){
				y2.push(j);
			}
			return y2.sort(function(a,b){
				return b.length-a.length;
			});
		}();
		var tg={};
		for(var i=0;i<y.length;i++){
			tg[y[i]]=_tag[y[i]];
		}
		return tg;
	}();
}({
	b	:[[ 27, 85, 49 ],[ 27, 85, 48 ]],
	u	:[[ 27, 85, 85 ],[ 27, 85, 117 ]],
	big	:[[14, 28],[29,15]],
	wide:[[14],[ 15 ]],
	high:[[ 28 ],[ 29 ]]
});

function toExPCL(str){
	for(var i in tag){
		str=str.replace(tag[i].k||/$^/,function(m,closetag,prms){return tag[i].f(m,closetag,prms);})
	}
	return str;
}

registerFunction({
	'BBtoExPCL':function(prm){
		if(prm['text']){
			return toExPCL(prm['text']);
		} else {
			return false;
		}
	}
},'Print');

//'ini [barcode type=1]tes[/barcode] bro'.replace(x||/$^/,function(m,closetag,prms){ if(closetag)return '}'; else return '{';})