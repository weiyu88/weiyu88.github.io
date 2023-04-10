AM.popup=AM.Class({
	autoshow:true,outerclose:true,autoclose:false,closetimeout:10000,tmr:null,closebtn:false,modal:false,modalwnd:null,visible:false,inner:null,inittoolbar:null,cn:'popupwindow',cni:'popup-inner',mcn:'popupmodalbg',preinit:null,
	ev:{'resize':[],'show':{'before':[],'after':[]},'close':{'before':[],'after':[]}},
	tmp_rsobj:0,
	init:function(prms){
		if(prms != undefined){ for (var i in prms){ this[i]=prms[i];} }
		if(this.preinit){ this.preinit(); }
		if(this.autoshow){ this.show(); }
	},
	initdiv:function(){
		if(!this.visible){
			this.place=AM.DIV({c:this.cn});
			if(this.title){
				this.titleplace=AM.DIV({c:'popup-title'},this.title);
				AM.ACN(this.place,this.titleplace);
			}
			if(this.inittoolbar || this.closebtn){
				var tb=AM.DIV({c:'popup-toolbar'});
				AM.ACN(this.place,tb);
				if(this.inittoolbar){this.inittoolbar(tb);}
				if(this.closebtn){
					var self=this;
					var cbtn=AM.SPAN({title:'Close',c:'icn24 icn-x sprite2 s2-close'+(this.title?' white':'')});
					AM.ACN(tb,cbtn);
					AM.AEV(cbtn,'click',function(e){ self.close();});
				}
			}
			this.inner=AM.DIV({c:this.cni});
			AM.ACN(this.place,this.inner);
		}
		AM.RCN(this.inner,this.content);
	},
	setPos:function(){
		var sc=AM.screenCenter();
		var sz=AM.getSize(this.place);
		AM.setStyle(this.place,{left:Math.floor(sc.x-(sz.w/2)-7)+'px',top:Math.floor(sc.y-(sz.h/2))+'px'});
	},
	beforeshow:function(el){
		AM.map(el.ev.show.before,function(i){i();});
	},
	show:function(){
		this.beforeshow(this);
		this.initdiv();
		var self=this;
		var ws=AM.getScrollSize();
		if(!self.visible){
			if(self.modal){ AM.ACN(AM.getBody(),self.modalwnd=AM.DIV({c:self.mcn})); }
			AM.ACN(AM.getBody(),this.place);
		}
		self.setPos();
		if(!self.visible){
			if(!self.tmp_rsobj){
				AM.AEV(window,'resize',function(){
					self.setPos();
					AM.map(self.ev.resize,function(i){i();});
				});
				self.tmp_rsobj=!0;
			}
			if(this.outerclose){
				var bodymd=function(e){ if(! AM.mouseInEl(self.place,e)){ AM.REV(AM.getBody(),'mousedown',bodymd); self.close(); } }
				AM.AEV(AM.getBody(),'mousedown',bodymd);
			}
		}
		this.visible=true;
		AM.map(this.ev.show.after,function(i){i();});
		if(this.autoclose){self.tmr=setTimeout(function(e){self.close();},self.closetimeout);}
	},
	afterclose:function(el){
		AM.map(el.ev.close.after,function(i){i();});
	},
	close:function(){
		AM.map(this.ev.close.before,function(i){i();});
		this.visible=false;
		if(this.tmr){clearTimeout(this.tmr)}
		if(this.modal){AM.REL(this.modalwnd);}
		AM.REL(this.place);
		this.afterclose(this);
	}
});
var amui_gbcbtn=null;
AM.graybox=AM.popup.extend({
	cn:'popupwindow graybox',
	modal:true,
	img:AM.IMG(),
	desc:AM.DIV(),
	preinit:function(){
		this.content=AM.ACN(AM.DIV(),this.img,this.desc);
		var self=this;
		AM.AEV(self.img,'load',function(e){
			self.setPos();
			AM.removeClass(self.place,'hide');
		});
		if(!amui_gbcbtn){
			amui_gbcbtn=AM.ACN(AM.SPAN({c:'gb-close hide icon-delete'}),AM.SPAN({c:'btn-icon'}));
			AM.ACN(AM.getBody(),amui_gbcbtn);
			amui_gbcbtn.obj=this;
			AM.AEV(amui_gbcbtn,'click',function(e){ amui_gbcbtn.obj.close(); });
		}
	},
	afterclose:function(el){
		AM.addClass(amui_gbcbtn,'hide');
		AM.map(this.ev.close.after,function(i){i();});
	},
	beforeshow:function(el){
		amui_gbcbtn.obj=this;
		AM.removeClass(amui_gbcbtn,'hide');
		AM.map(el.ev.show.before,function(i){i();});
	},
	setImage:function(isrc){
		AM.addClass(this.place,'hide');
		this.img.src=isrc;
	},
	setPos:function(){
		AM.setStyle(this.img,{height:'auto',width:'auto'});
		var gs=AM.getSize(this.place);
		var ws=AM.getSize();
		var ps=AM.getSize(AM.getBody());//m_page.s();
		m_ss=AM.scrollBarSize;
		var pad={'w':ps.h>ws.h?m_ss.w:0,'h':ps.w>ws.w?m_ss.h:0};
		if(gs.w>ws.w || gs.h>ws.h){
			if(ws.h/gs.h < ws.w/gs.w){
				AM.setStyle(this.img,{height:(ws.h-20)+'px',width:'auto'});
			} else{
				AM.setStyle(this.img,{height:'auto',width:(ws.w-20-pad.w)+'px'});
			}
		}
		var sc=AM.fixedScreenCenter();//getScreenCenter();
		var sz=AM.getSize(this.place);
		AM.setStyle(this.place,{left:Math.floor(sc.x-(sz.w/2)-(pad.w/2))+'px',top:Math.floor(sc.y-(sz.h/2))+'px'});
	}
});
