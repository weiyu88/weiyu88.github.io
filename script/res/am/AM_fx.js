/**
 * AM effects
 * Last Modified : Fri Feb 03 01:44:26 2012 by Agus Made
 * v:1.0
 **/

AM.Transitions={
    sineInOut: function (t, b, c, d) {return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;},
}
AM.fx = AM.Class({
	from:{},to:{},transition:null,cb:null,before:null,after:null,fps:50,duration:500,autostart:true,deftrans:AM.Transitions.sineInOut,
	timer:null,time:0,
	init:function(prms){
        var def={from:{},to:{},duration:500,transition:null,cb:null};
        for (var i in def){ this[i]=def[i];} 

		if(prms != undefined){ for (var i in prms){ this[i]=prms[i];} }
		if(this.autostart){ this.start(); }
        return this;
	},
	step:function(){
		var time = new Date().getTime();
		if (time < this.time + this.duration){
			this.cTime = time - this.time;
			this.process();
		} else {
			if(this.after){ var self=this; setTimeout(function(){self.after()}, 10); }
			this.stop();
		}
	},
	process:function(){
		if(AM.isObject(this.from)){
			var v={};
			for(var i in this.from){
				var trans=this.transition && this.transition[i] ? this.transition[i] : this.deftrans;
				var change = this.to[i] - this.from[i];
				v[i]=trans(this.cTime, this.from[i], change, this.duration);
			}
		} else {
			var trans=this.transition || this.deftrans;
			var v=trans(this.cTime, this.from, this.to-this.from , this.duration);
		}
		if(this.cb){ this.cb(v); }
        return this;
	},
	start:function(){
		if(this.before){ this.before(); }
		this.time = new Date().getTime();
		var self=this;
		this.timer = setInterval(function(){self.step()}, Math.round(1000/this.fps));
	},
	stop:function(){
		clearInterval(this.timer);
		this.timer = null;
		return this;
	}
});

/*
//contoh:
ACN(getBody(),SPAN({id:"benda",style:"position:absolute;"},'haloo'));

new fx({from:0,to:1000,cb:function(v){setStyle($('benda'),{'left':v+'px'})}});

var a = new fx({
	from:{l:1000,t:5},
	to:{l:0,t:100},
	duration:2000,
	transition:{t:Transitions.bounceOut,l:Transitions.linear},
	cb:function(v){
			setStyle($('benda'),{'left':v.l+'px','top':v.t+'px'})
		}
	}
);
*/