var RLE={
    strHexToArray:function(s){
        var a=[];
        (s.split(' ')).forEach(function(v){a.push(parseInt(v,16))});
        return a;
    },
    fillArray:function(v,r){var a=[];for(var i=0;i<r;i++){a.push(v)}; return a;},
    decode:function(d){
        var a=[];
        while (d.length) {
            if(d[0]<=127){
                var c=d.splice(0,1)[0];
                var v=d.splice(0,c+1);
                a.push.apply(a,v);
            } else {
                var c=(256 -(d.splice(0,1)[0]))+1;
                var v=d.splice(0,1)[0];
                a.push.apply(a,RLE.fillArray(v,c));
            }
        }
        return a;
    },
    encode:function(d){
        var a=[],re=false,r={};
        while (d.length){
            if(d.length && d.length<2){
                a.push(0);
                a.push(d[0]);
                d.splice(0,1);
                return a;
            }
            re=d[0]==d[1];
            r={dt:[d[0]],c:1};
            for(var j=1;j<d.length;j++){
                if(re && d[j]==d[j-1]){
                    r.c++;
                } else if(!re && d[j]!=d[j-1]){
                    if(j+1<d.length && d[j]!=d[j+1]){
                        r.dt.push(d[j]);
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            }
            if(re){
                a.push(256+1-r.c);
                a.push(r.dt[0]);
                d.splice(0,r.c);
            } else {
                a.push(r.dt.length-1);
                a.push.apply(a,r.dt);
                d.splice(0,r.dt.length);
            }
        }
        return a;
    }
}