var TNFCreader=TComponent.extend({
	_listening:false,
	_current:null,
	receiveTag:'id',
	receiveFormat:'hexString',
	autoStop:false,
	load:function(o){
		this.parent(o);
		var attr=o.attr;
		this.receiveTag=attr.receiveTag||'id';
		this.receiveFormat=attr.receiveFormat||'hexString';
		this.autoStop=attr.autoStop||false;
	},
	start:function(receiveHandler,sCallback,eCallback){
		var self=this;
		if (!this._listening) {
			if (typeof(nfc)=='undefined' || !nfc) {
				console.log('nfc plugins not found');
				if (eCallback) {
					_doAction(eCallback,{'obj':this,'input':'nfc plugins not found'});
				}
				self.stop();
			} else {
				self._current = nfc.addTagDiscoveredListener(function(event){ //nfc.addNdefListener(function(event){
						console.log('read data');
						var tag = event.tag;
						var _raw = self.receiveTag=='message'?
								tag.ndefMessage[0].payload:
								tag.id || tag.serialid;
						var rslt=self.receiveFormat=='hexString'?
							nfc.bytesToHexString(_raw):
							nfc.bytesToString(_raw);
						if (receiveHandler) {
							_doAction(receiveHandler,{'obj':self,'input':rslt});
						}
						if (self.autoStop) {
							self.stop();
						}
					},
					function(){
						console.log('waiting for nfc');
						self._listening=true;
						if (sCallback) {
							_doAction(sCallback,{'obj':self,'input':'waiting for nfc'});
						}
					},
					function(e){
						console.log('nfc initialize failed');
						if (eCallback) {
							_doAction(eCallback,{'obj':self,'input':'nfc initialize failed'});
						}
						self.stop();
					}
				);
			}
		}
	},
	stop:function(){
		console.log('nfc not listening');
		if (this._current) {
           //nfc.removeNdefListener(this._current);
		   nfc.removeTagDiscoveredListener(this._current);
        }
		this._listening=false;
	}
});
registerComponent('TNFCreader',TComponent);

registerFunction({
	'nfcStartRead':function(prm){
		if (prm['nfc']) {
			var cmp=_Scope.componentByName(prm['nfc']);
			if (cmp && cmp.start) {
				var rH=prm['receiveHandler']||false;
				var sC=prm['sCallback']||false;
				var eC=prm['eCallback']||false;
				return cmp.start(rH,sC,eC);
			}
		}
		return false;
	}
},'App');