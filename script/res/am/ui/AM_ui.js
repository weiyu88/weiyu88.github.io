AM.getScrollBarSize=function() {  
   var inner = AM.P({'style':'width:100%;height:100%;'});
   var outer = AM.DIV({'style':'position:absolute;top:0px;left:0px;visibility:hidden;width:100px;height:100px;overflow:hidden;'});
   AM.ACN(AM.getBody(),AM.ACN(outer,inner));
   var w1 = inner.offsetWidth;  
   var h1 = inner.offsetHeight;
   outer.style.overflow = 'scroll';  
   var w2 = inner.offsetWidth;  
   var h2 = inner.offsetHeight;
   if (w1 == w2) w2 = outer.clientWidth;
   if (h1 == h2) h2 = outer.clientHeight;   
   AM.REL(outer);
   return {w:(w1 - w2),h:(h1 - h2)};  
};
var scrollBarSize=null;
AM.AEV(window,'load',function(e){
   scrollBarSize=AM.getScrollBarSize();
   if(typeof(doNotExportAM)=="undefined" || !doNotExportAM){
	  window.getScrollBarSize=AM.getScrollBarSize;
   }
});
