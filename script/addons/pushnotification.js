var isMobile = {
    Android: function() {
        return navigator.userAgent.match(/Android/i);
    },
    iOS: function() {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    }
};
var TPushNotif = TComponent.extend({
	autoload: true,
	apiUrl:'',
	user:'',
	password:'',
	appName:'',
	topicName:'',
	projectId:'',
	apiKey:'',
	privateKeyProduction:'',
	certificateProduction:'',
	privateKeyDevelopment:'',
	certificateDevelopment:'',
	load:function(o) {
		this.parent(o);
		var attr = o.attr;
		console.log(JSON.stringify(attr));
		var projectId = '';
		if (attr.APIKey != null || attr.APIKey !== undefined) projectId = attr.ProjectID;
		console.log('ruunnn');
		var push = PushNotification.init({
            "android": {"senderID": projectId},
            "ios": {"alert": "true", "badge": "true", "sound": "true"}
        });
        push.on('registration', function(data) {
            console.log("registration event");
            console.log('RegisterID', data.registrationId);
            var registerId = data.registrationId;
            var appName = attr.ApplicationName;
            var topicName = attr.TopicSubscribe;
            if(isMobile.iOS()) {
            	if (attr.CertificateKeyProduction === undefined) var platformType = "APNS_SANDBOX";
            	else if (attr.CertificateKeyProduction !== undefined) var platformType = "APNS";
            }
            else if(isMobile.Android()) {
                var platformType = "GCM";
            }
            var urlSource = attr.apiUrl;
            if (localStorage.getItem('endpointArn') === undefined) {
                var data = "appName=" + appName + "&platformType=" + platformType + "&registerId=" + registerId;
                var xhr = new XMLHttpRequest();
                if ("withCredentials" in xhr) {
                    xhr.open("POST", urlSource + '/api/register-device', true);
                } 
                else if (typeof XDomainRequest != "undefined") {
                    xhr = new XDomainRequest();
                    xhr.open("POST", urlSource + '/api/register-device');
                } 
                else {
                    xhr = null;
                    console.log('CORS', 'CORS Not supported');
                }
                
                xhr.setRequestHeader("authorization", "Basic " + btoa(attr.user + ":" + attr.password));
                xhr.setRequestHeader("cache-control", "no-cache");
                xhr.setRequestHeader("content-type", "application/x-www-form-urlencoded");
                xhr.onload = function() {
                    if (xhr.status === 200) {
                        var rsData = JSON.parse(xhr.responseText);
                        localStorage.setItem('endpointArn', rsData.endpointArn);
                        console.log('Register Device Result',rsData);
                    }
                    else if (xhr.status === 401) {
                        console.log('Request failed.  Returned status of ', xhr.statusText);
                    }
                };
                xhr.send(data);
            }
        });
        push.on('notification', function(data) {
        	console.log("notification event");
            var title = data.title;
            var message = data.message;
            runFunction({
				f:attr.pushFunction,
				params:{
					pushdata:{
						title: title,
						message: message
					}
				}
			});
            push.finish(function () {
                console.log('finish successfully called');
            });
        });
        push.on('error', function(e) {
            console.log(e);
        });
	}
});
registerComponent('TPushNotif',TComponent);