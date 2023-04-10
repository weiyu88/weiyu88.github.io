//var encrypt_key = '1234567890';
//var encrypt_key = '12345678901234561234567890123456';
//url=http://istampz.net/api/nfc/verify

function istampzService(url,prm,dt,cb,ecb){
	prm=prm||{};
	url=url+'?'+AM.encodeArguments(prm);
	console.log('request url : ',url);
	console.log('request dt : ',dt);
	var d=AM.getRequest(url);
	d.addCallback(function(s){
		//console.log('s',s);
		var r=safeEval(s);
		if (r) {
			if(cb){cb.apply(d,[r])}
		} else {
			if(ecb){ecb.apply(d,[{s:false,err:s}])}
		}
	});
	d.addErrback(function(s){
		if(ecb){ecb.apply(d,[{s:false,err:s}])}
	});
	dt=dt||{};
	for(var i in dt){
		if(AM.isObject(dt[i])){
			dt[i]=AM.serializeJSON(dt[i]);
		}
	}
	d.sendReq(dt);
	return d;
}

var _istampzHelper = {
    rand_str: function( num ) {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+,./<>?";

        for( var i=0; i < num; i++ )
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    },
    encrypt256: function(data,encrypt_key) {
        // var salt = CryptoJS.lib.WordArray.random(128/8); 
        // var key256Bits500Iterations = CryptoJS.PBKDF2("gfg%$#%WEFSDdfdfklsdj@DFS01!", salt, { keySize: 128/32, iterations: 500 });
        // var iv  = CryptoJS.enc.Hex.parse("12345678901234561234567890123456");
        // var encrypted = CryptoJS.AES.encrypt( param_string, key256Bits500Iterations, { iv: iv, padding: CryptoJS.pad.ZeroPadding } );
        // var key = CryptoJS.lib.WordArray.random(32);
        // var key = CryptoJS.enc.Base64.parse('12345678901234561234567890123456');
        // var iv  = CryptoJS.enc.Base64.parse('1234567890123456');

        var key = CryptoJS.enc.Utf8.parse(encrypt_key);
        
        var iv  = CryptoJS.lib.WordArray.random(16);
        var encrypted = CryptoJS.AES.encrypt( data, key, { iv: iv, padding: CryptoJS.pad.ZeroPadding } );

        var pre1 = _istampzHelper.rand_str(3);
        var pre2 = _istampzHelper.rand_str(2);

        var data_base64 = pre1 + encrypted.ciphertext.toString(CryptoJS.enc.Base64);
        var iv_base64 = pre2 + encrypted.iv.toString(CryptoJS.enc.Base64);

        var encrypted_data = {
            'p1': data_base64,
            'p2': iv_base64
        }

        return encrypted_data;
    },

    decript256: function( encrypted_data, iv,encrypt_key,ecb) {
        //Remove unuse character
        iv = iv.substring(7);
        encrypted_data = encrypted_data.substring(4);

        //Decode parameter to base64 and prepare
        key = CryptoJS.enc.Utf8.parse(encrypt_key);
        iv = CryptoJS.enc.Base64.parse(iv);
console.log('tesT');
        //Descript process
        plaintext = CryptoJS.AES.decrypt(encrypted_data, key, { iv: iv, padding: CryptoJS.pad.ZeroPadding });
		try {
			var result = CryptoJS.enc.Utf8.stringify(plaintext);
		} catch (e) {
			console.log(e);
			if(ecb){
				ecb(e);
			}
			return false;
		}
		return JSON.parse(result);
    }
}

var TISTAMPZconn=TComponent.extend({
	url:'http://istampz.net/api/nfc/verify',
	encryptKey:'12345678901234561234567890123456',
	appId:'I3tiJ5I3DkpEqnwm',
	moduleId:'vql2NhOCXixKKzUs',
	load:function(o){
		this.parent(o);
		var attr=o.attr;
		this.url=attr.url||'http://istampz.net/api/nfc/verify';
		this.encryptKey=attr.encryptKey||'12345678901234561234567890123456';
		this.appId=attr.appId||'I3tiJ5I3DkpEqnwm';
		this.moduleId=attr.moduleId||'vql2NhOCXixKKzUs';
	},
	request:function(prm,callback,errorCallback){
		//prm={"app_id":"I3tiJ5I3DkpEqnwm","module_id":"vql2NhOCXixKKzUs","tag":"04662692f43b80","pin":"123"}
		var self=this;
		prm=AM.update({app_id:self.appId,module_id:self.moduleId},prm);
		var sprm=JSON.stringify(prm);
		var param_encrypted = _istampzHelper.encrypt256( sprm,self.encryptKey);
		return istampzService(self.url,{},param_encrypted,function(o){
			var x=o;
			if (x && x.p1 && x.p2) {
				var rslt=_istampzHelper.decript256(x.p1,x.p2,self.encryptKey,errorCallback);
				if (rslt) {
					if (rslt.status) {
						if (callback) {
							callback(rslt);
						}
					} else {
						if (errorCallback) {
							errorCallback(rslt);
						}
					}
				}
			}
		},function(e){
			if (errorCallback) {
				errorCallback(e);
			}
		});
	}
});
registerComponent('TISTAMPZconn',TComponent);

registerFunction({
	'istampzRequest':function(prm){
		if (prm['istampz']) {
			var cmp=_Scope.componentByName(prm['istampz']);
			if (cmp && cmp.request) {
				var ebd=this;
				if (prm['tag'] && prm['pin']) {
					return cmp.request({tag:prm['tag'],pin:prm['pin']},function(dt){
							ebd=ebd||{};
							if (prm.callback) {
								_doAction(prm.callback,AM.update(ebd,{input:dt}));
							}
						},function(dt){
							ebd=ebd||{};
							if (prm.errorCallback) {
								_doAction(prm.errorCallback,AM.update(ebd,{input:dt}));
							}
						});
				}
			}
		}
		return false;
	}
},'App');
