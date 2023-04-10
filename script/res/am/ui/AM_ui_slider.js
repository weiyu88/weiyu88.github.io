/*
	a=AM.$bytc('div','',AM.$('sliderku'))
	aku=new AM.slider({items:a,place:AM.$('sliderku')})
*/
AM.slider=AM.Class({
	place:null,items:[],bar:null,barItems:[],leftNav:null,rightNav:null,playing:false,mainTimer:0,interval:3000,citem:0,ready:false,transition:AM.Transitions.sineInOut,ev:{'resize':[],'stop':[],'play':[],'go':[],imgready:[]},
	init:function(prms){
		if(prms != undefined){ for (var i in prms){ this[i]=prms[i];} }
		this._initPlace();
	},
	_initPlace:function(){
		if(this.place){
			if(!AM.hasClass(this.place,'slider')){
				AM.addClass(this.place,'slider');
				
				this.bar=AM.DIV({c:'slider-bar'});
				this.barPlace=AM.ACN(AM.DIV({c:'slider-bar-place'}),this.bar);
				
				this.content=AM.DIV({c:'slider-content'});
				this.contentPlace=AM.ACN(AM.DIV({c:'slider-content-place cbs'}),this.content);
				
				this.leftNav=AM.ACN(AM.SPAN({c:'slider-nav slider-nav-left'}),AM.ACN(AM.A(),AM.SPAN()));
				this.rightNav=AM.ACN(AM.SPAN({c:'slider-nav slider-nav-right'}),AM.ACN(AM.A(),AM.SPAN()));
				
				AM.ACN(this.place,this.contentPlace,this.barPlace,this.leftNav,this.rightNav);
				var self=this; var j=0;
				AM.map(self.items,function(i){
					var bi=AM.ACN(AM.A(),AM.SPAN(''));
					AM.ACN(self.bar,bi);
					AM.ACN(self.content,i);
					AM.addClass(i,'slider-item');
					var x=j;
					AM.AEV(bi,'click',function(e){ self.go(x); });
					//self.barItems.push(bi);
					j++;
				});
				self.barItems=AM.$bytc('a','',self.bar);
				AM.AEV(self.leftNav,'click',function(e){ self.prev();});
				AM.AEV(self.rightNav,'click',function(e){ self.next();});
				this._setSize();
				AM.AEV(window,'resize',function(e){
					self._setSize();
					AM.map(self.ev.resize,function(i){i();});
					self.go(self.citem);
				});
				this._getReady();
			}
		}
	},
	_run:function(){
		var self=this;
		if(!self.mainTimer){
			self.mainTimer=setInterval(function(){
				if(self.ready && self.playing){ self.next(); }
			},self.interval);
		}
	},
	_getReady:function(){
		this.imgs=AM.$bytc('img','',this.content);
		this.imgcnt=this.imgs.length;
		this.imgreadey=0;
		var self=this;
		if(self.imgs.length>0){
			AM.map(self.imgs,function(i){
				if(i.complete){ self.imgreadey++;}
				AM.AEV(i,'load',function(e){self.imgreadey++; if(self.imgreadey>=self.imgcnt){self.ready=true; self._run(); AM.map(self.ev.imgready,function(iii){iii();}); }});
			});
		}
		if(self.imgreadey>=self.imgcnt){self.ready=true; self._run();}
		return self.ready;
	},
	_setSize:function(){
		var sz=AM.getSize(this.contentPlace);
		AM.map(this.items,function(i){ AM.setStyle(i,'width',sz.w); });
	},
	play:function(){
		this.playing = true;
		AM.map(this.ev.play,function(i){i();});
		this._run();
	},
	stop:function(){
		this.playing = false;
		if(this.mainTimer){
			clearInterval(this.mainTimer);
			AM.map(this.ev.stop,function(i){i();});
			this.mainTimer=0;
		}
	},
	slideInterval:function(i){
		var ply=this.playing;
		this.stop();
		this.interval=i;
		if(ply){this.play();}
	},
	go:function(i){
		var self=this;
		var sz=AM.getSize(self.contentPlace);
		if (i>self.items.length-1){ i=0; }
		if (i < 0){ i=self.items.length-1; }
		self.citem=i;
		AM.setStyle(self.content,'left',-Math.floor(sz.w*this.citem));
		//AM.removeElements(self.items,'se');
		//console.log(self.barItems);
		AM.removeClass(self.barItems,'se');
		AM.addClass(self.barItems[self.citem],'se');
		AM.map(self.ev.go,function(g){g(i);});
	},
	next:function(){
		this.citem++;
		this.go(this.citem);
	},
	prev:function(){
		this.citem--;
		this.go(this.citem);
	}
});

