var TGoogleMaps=TVisualComponent.extend({
	_tag:'div',
	_map:null,
	_marker:null,
	_infoWindow:null,
	_mapOptions:null,
	zoom:10,
	latLng:'',
	title:'',
	showMap:function(plc,sLatLng,zoom,ttl){
		var self=this;
		if (!this._map) {
			var mapOptions = {zoom:zoom,mapTypeId: google.maps.MapTypeId.ROADMAP};
			var ll=sLatLng.split(',');
			if (ll && ll[0] && ll[1]) {
				mapOptions.center=new google.maps.LatLng(parseFloat(ll[0]),parseFloat(ll[1]));
				this._marker=new google.maps.Marker({position: mapOptions.center});
			}
			var map = new google.maps.Map(plc, mapOptions);
			this._marker.setMap(AM.map);
			this._map=AM.map;
			this._infoWindow = new google.maps.InfoWindow();
			this._infoWindow.setContent(ttl);
		} else {
			var ll=sLatLng.split(',');
			if (ll && ll[0] && ll[1]) {
				var mc=new google.maps.LatLng(parseFloat(ll[0]),parseFloat(ll[1]));
				if (this._map.getCenter().toString() != mc.toString()) {
					this._map.setCenter(mc);
					this._marker.setPosition(mc);
				}
			}
			if (this._map.getZoom()!=zoom) {
				this._map.setZoom(zoom);
			}
			if (this._infoWindow.getContent()!=ttl) {
				this._infoWindow.setContent(ttl)
			}
		}
		if (ttl) {
			this._infoWindow.open(this._map, this._marker);
		} else {
			this._infoWindow.close();
		}
		return this._map;
	},
	getMap:function(){
		this.showMap(this._el,this.latLng,parseInt(this.zoom),this.title);
	},
	_onDataValue:function(v){
		this.setAttr({latLng:v});
	},
	setAttr:function(attr,w){
		this.parent(attr,w);
		var sttr='latLng,title,zoom'.split(',');
		for(var i in attr){
			if (AM.isIn(i,sttr)) {
				this[i]=attr[i];
			}
		}
		this.getMap();
	}
});

registerComponent('TGoogleMaps',TVisualComponent);