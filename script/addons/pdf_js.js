var TPDFView=TVisualComponent.extend({
	_tag:'div',
	_thePdf:{loaded:false,pdf:null,url:''},
	_prm:{
		scale:1,
		page:1,
		single:true
	},
	renderPdf:function(url,plc,options,ecb) {
		url=url||'';
		plc=plc||null;
		ecb=ecb||function(e){console.log(e);}
		options=options||{};
		var prm=this._prm;
		var thePdf=this._thePdf;
		for (var i in (options)){
			prm[i]=options[i];
		}
		function renderPage(pdf,pg){
			var canvas=document.createElement('canvas');
			var context=canvas.getContext('2d');
			plc.appendChild(canvas);
			pdf.getPage(pg).then(function(page){
				var viewport = page.getViewport(prm.scale);
				canvas.width = viewport.width;
				canvas.height = viewport.height;
				page.render({canvasContext: context, viewport: viewport});
			});
		}
		function clearChild(){
			while (plc && plc.lastChild) {
				plc.removeChild(plc.lastChild);
			}
		}
		function renderPages(pdf){
			clearChild();
			if(prm.page>pdf.numPages){
				prm.page=pdf.numPages;
			}
			if (prm.single) {
				renderPage(pdf,prm.page);
			} else {
				for (var i=1; i<=pdf.numPages;i++){
					renderPage(pdf,i);
				}
			}
		}
		
		if (plc && url) {
			if (thePdf.loaded && thePdf.url==url) {
				renderPages(thePdf.pdf);
			} else {
				thePdf.loaded=false;
				var self=this;
				this._loadPDF(url,function(_pdf){
					thePdf={'loaded':true,'pdf':_pdf,'url':url};
					if (self.ev && self.ev.load && self.ev.load.length) {
						self.doAction(self.ev.load,{input:_pdf.numPages});
					}
					renderPages(thePdf.pdf);
				},ecb);
			}
		} else {
			thePdf.url=url,
			thePdf.loaded=false;
			clearChild();
		}
	},
	_loadPDF:function(url,cb,ecb){
		cb=cb||function(_pdf_){console.log('loaded numPages : ',_pdf_.numPages);}
		ecb=ecb||function(e){console.log('error',e);}
		PDFJS.disableWorker = true;
		PDFJS.getDocument(url).then(function(_pdf) {
					cb(_pdf);
				},function(e){
					ecb(e);
				});
	},
	setAttr:function(attr,w){
		this.parent(attr,w);
		var self=this;
		var cel=this._el || null;
		if (typeof attr['path'] !='undefined' ||
			typeof attr['localPath'] !='undefined' ||
			typeof attr['scale'] !='undefined' ||
			typeof attr['page'] !='undefined' ||
			typeof attr['single'] !='undefined'
			) {
			this.attr=AM.update(this.attr,attr);
			self.show();
		}
	},
	show:function(){
		console.log('jalan')
		var self=this;
		if(self.attr['localPath']){
			enableLocalAjax(function(){
				var lh='http://localhost:8081';
				self.renderPdf(lh+self.attr['path'],self._el,{scale:parseFloat(self.attr['scale'])||1,page:parseInt(self.attr['page'])||1,single:self.attr['single']})
			},function(e){
				if (self.ev && self.ev.error && self.ev.error.length) {
					self.doAction(self.ev.error,{input:e});
				}
			})
		} else {
			console.log('bukan lokal')
			self.renderPdf(self.attr['path'],self._el,{scale:parseFloat(self.attr['scale'])||1,page:parseInt(self.attr['page'])||1,single:self.attr['single']},function(e){
				if (self.ev && self.ev.error && self.ev.error.length) {
					self.doAction(self.ev.error,{input:e});
				}
			});
		}
	}
});
//Object.defineProperty(TSignature.prototype, 'value', {
//	get: function() { return this.getEl().sig.simplify(0); },
//	set: function(val) { return this.getEl().sig.fromString(val); }
//});

registerComponent('TPDFView',TVisualComponent);