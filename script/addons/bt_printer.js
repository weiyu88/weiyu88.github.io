var _btPrinter=function(){};
_btPrinter.prototype={
    'macAddress': [], //[{"id":"0C:A6:94:27:3E:EB","class":7936,"address":"0C:A6:94:27:3E:EB","name":"AB-320M"}]
    'chars': '',
    'listPorts':function(cb,ecb) {
		var self=this;
		bluetoothSerial.list(
			function(results) {
				self.macAddress = results;
				if (cb) {
					cb(self.macAddress);
				}
				//app.display("macAddress : " + app.macAddress);
				//console.log("made ==> macAddress : " + AM.serializeJSON(app.macAddress))
			},
			function(error) {
				//app.display(JSON.stringify(error));
				//app.display(error);
				if (ecb) {
					ecb(error);
				}
			}
		);
	},
	'isEnabled':function(cb,ncb){
		bluetoothSerial.isEnabled(
			function(){ this.listPorts(cb); },
			function (){ncb();}
		);
	},
	'openPort': function() {
        bluetoothSerial.subscribe('\n', function (data) {
            //app.display(data);
        });
    },
	'closePort':function() {
        if (self.onStatus) { self.onStatus("disconnected"); }
        bluetoothSerial.unsubscribe(
			function (data) {
				//app.display(data);
			},
			function (e){
				console.log('unsubscribe error',e);
			}
        );
    },
	'onStatus':null,
	'activeId':'',
	'idInMac':function(id){ //macById
		var self=this;
		for(var i in self.macAddress){
			if (self.macAddress[i].id==id) {
				return self.macAddress[i];
			}
		}
		return false;
	},
	'connect':function (cb,ecb) {
		var self=this;
		if (self.onStatus) { self.onStatus("connecting"); }
		if (!self.idInMac(self.activeId)) {
			ecb('selected printer not found');
			return;
		}
		//console.log(app.dtid);
		bluetoothSerial.connect(
			//self.macAddress[self.activeIndex].id,
			self.activeId,
			function(){
				if (cb) { cb(); }
				if (self.onStatus) { self.onStatus("connected"); }
				self.openPort();
			},
			function (e) {
				if (self.onStatus) { self.onStatus("connection error"); }
				if (ecb) { ecb(e); }
			}
		);
    },
	'disconnect':function (cb,ecb) {
		var self=this;
		if (self.onStatus) { self.onStatus("disconnecting"); }
		bluetoothSerial.disconnect(
			function (){
				if (cb) { cb(); }
				self.closePort(); // stop listening to the port
			},
			function (e) {
				if (self.onStatus) { self.onStatus("disconnection error"); }
				if (ecb) { ecb(e); }
			}
		);
    },
	'isConnected':function(cb,ncb){
		bluetoothSerial.isConnected(cb,ncb);
	},
//	'manageConnection':function(cb,ecb) {
//		var self=this;
//        bluetoothSerial.isConnected(disconnect, function(){self.connect(cb,ecb)});
//   },
	'print':function(isi,ecb){
		var self=this;
    	bluetoothSerial.write(isi,
			function (data) {
				console.log(data);
				//app.display(data);
			},
			function (e){
				if (ecb) {
					ecb(e);
				}
			}
    	);
    }
}

var btPrinter=null;
_onAppReady.push(function(){
	if (isCordova()) {
		if (bluetoothSerial) {
			btPrinter=new _btPrinter();
		} else {
			console.log('app AM.ready : bluetoothSerial doesnt exists');
		}
	} else {
		console.log('app AM.ready : not cordova');
	}
});

registerFunction({
	'btPrinterPortList':function(prm){
		if (!btPrinter) {
			var e='bluetoothSerial plugins not found';
			console.log('btPrinterPortList error:',e);
			if(prm.errorCallback){
				_doAction(prm.errorCallback,AM.update(this||{},{input:e}));
			}
			return false;
		}
		btPrinter.listPorts(function(dt){
			console.log('btPrinterPortList success:',dt);
			if(prm.callback){
				_doAction(prm.callback,AM.update(this||{},{input:dt}));
			}
		},function(e){
			console.log('btPrinterPortList error:',e);
			if(prm.errorCallback){
				_doAction(prm.errorCallback,AM.update(this||{},{input:e}));
			}
		});
		return true;
	},
	'btPrinterConnect':function(prm){
		if (!btPrinter) {
			var e='bluetoothSerial plugins not found';
			console.log('btPrinterConnect error:',e);
			if(prm.errorCallback){
				_doAction(prm.errorCallback,AM.update(this||{},{input:e}));
			}
			return false;
		}
		if (prm['printerId']) {
			btPrinter.activeId=prm['printerId'];
		} else if (!btPrinter.activeId) {
			var e='printerId not set';
			console.log('btPrinterConnect error:',e);
			if(prm.errorCallback){
				_doAction(prm.errorCallback,AM.update(this||{},{input:e}));
			}
			return false;
		}
		
		btPrinter.connect(function(){
			console.log('btPrinterConnect success');
			if(prm.callback){
				_doAction(prm.callback,this||{});
			}
		},function(e){
			console.log('btPrinterConnect error:',e);
			if(prm.errorCallback){
				_doAction(prm.errorCallback,AM.update(this||{},{input:e}));
			}
		});
		return true;
	},
	'btPrinterDisconnect':function(prm){
		if (!btPrinter) {
			var e='bluetoothSerial plugins not found';
			console.log('btPrinterDisconnect error:',e);
			if(prm.errorCallback){
				_doAction(prm.errorCallback,AM.update(this||{},{input:e}));
			}
			return false;
		}
		btPrinter.disconnect(function(){
			console.log('btPrinterDisconnect success');
			if(prm.callback){
				_doAction(prm.callback,this||{});
			}
		},function(e){
			console.log('btPrinterDisconnect error:',e);
			if(prm.errorCallback){
				_doAction(prm.errorCallback,AM.update(this||{},{input:e}));
			}
		});
		return true;
	},
	'btPrinterIsConnected':function(prm){
		if (!btPrinter) {
			var e='bluetoothSerial plugins not found';
			console.log('btPrinterIsConnected error:',e);
			if(prm.noCallback){
				_doAction(prm.noCallback,AM.update(this||{},{input:e}));
			}
			return false;
		}
		btPrinter.isConnected(function(){
			console.log('btPrinterIsConnected : yes');
			if(prm.yesCallback){
				_doAction(prm.yesCallback,this||{});
			}
		},function(e){
			console.log('btPrinterIsConnected : no');
			if(prm.noCallback){
				_doAction(prm.noCallback,this||{});
			}
		});
		return true;
	},
	'btPrinterPrint':function(prm){
		if (!btPrinter) {
			var e='bluetoothSerial plugins not found';
			console.log('btPrinterPrint error:',e);
			if(prm.errorCallback){
				_doAction(prm.errorCallback,AM.update(this||{},{input:e}));
			}
			return false;
		}
		if (!prm['text']) {
			var e='text parameter not set';
			console.log('btPrinterPrint error:',e);
			if(prm.errorCallback){
				_doAction(prm.errorCallback,AM.update(this||{},{input:e}));
			}
			return false;
		}
		btPrinter.print(prm['text'],function(e){
			console.log('btPrinterPrint error',e);
			if(prm.errorCallback){
				_doAction(prm.errorCallback,AM.update(this||{},{input:e}));
			}
		});
		return true;
	},
},'Print');