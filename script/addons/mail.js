
function mailService(prm,dt,cb,ecb){
	prm=prm||{};
	var url=_baseConfig.mailservice+'?'+AM.encodeArguments(prm);
	console.log('request url : ',url);
	console.log('request dt : ',dt);
	var d=AM.getRequest(url);
	console.log('d: ',d);
	d.addCallback(function(s){
		var r=safeEval(s);
		if (r) {
			if (r.s) {
				if(cb){cb.apply(d,[r])}
			} else {
				if(ecb){ecb.apply(d,[r])}
                //if(ecb){ecb.apply(d,[s])}
			}
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
function mailRequest(prm,dt,cb,ecb){
    mailService(prm,dt,function(o){
                    if (o.s) {
                            console.log('sukses',o);
                            if (cb) {
                                    cb(o);
                            }
                   			 } else {
                            console.log('gagal',e);
                            if (ecb) {
                                    ecb(o.err);
                            }
                    }
                 },function(e){
                    console.log('gagal',e);
                    if (ecb) {
                            ecb(e);
                    }
            });
    return true;
}

registerFunction({
    	'sendMail':function(prm){
			if (prm['config'] && prm['to'] && prm['data']){
                    var ebd=this;
                    var cba=function(o){
                            if (prm.callback) {
                                _doAction(prm.callback,AM.update(ebd,{input:o.dt}));
                            }
                    }
                    var ecba=function(o){
                        if (prm.errCallback) {
                            _doAction(prm.errCallback,AM.update(ebd,{input:o}));
                        }
                    }
                    var xprm={'api':'mail'};
		    var dt=dt||{};
		    if (prm['config']) {dt.config=prm['config']; }
		    if (prm['to']) {dt.to=prm['to']; }
		    if (prm['from']) {dt.from=prm['from']; }
		    if (prm['cc']) {dt.cc=prm['cc']; }
		    if (prm['bcc']) {dt.bcc=prm['bcc']; }
		    if (prm['data']) {dt.data=prm['data']; }
        mailRequest(xprm,dt,cba,ecba);
		}
	}
},'App');
