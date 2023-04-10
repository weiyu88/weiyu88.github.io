(function(global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
        typeof define === 'function' && define.amd ? define('emobiqApp', ['exports'], factory) :
        (factory((global.emobiqApp = global.emobiqApp || {})));
}(this, function(exports) {
    'use strict';

    function templateEngine() {
        var startend = {
                append: {
                    start: "'+(",
                    end: ")+'",
                },
                split: {
                    start: "';out+=(",
                    end: ");out+='",
                }
            },
            skip = /$^/;

        function unescape(code) {
            return code.replace(/\\('|\\)/g, "$1").replace(/[\r\t\n]/g, " ");
        }

        function extend(a, b) {
            b = b || {};
            for (var i in b) {
                a[i] = b[i];
            }
            return a;
        }
        var te = {
            setting: {
                evaluate: /\{\{([\s\S]+?(\}?)+)\}\}/g,
                interpolate: /\{\{=([\s\S]+?)\}\}/g,
                encode: /\{\{!([\s\S]+?)\}\}/g,
                conditional: /\{\{\?(\?)?\s*([\s\S]*?)\s*\}\}/g,
                iterate: /\{\{~\s*(?:\}\}|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\}\})/g,
                strip: true,
                append: true
            },
            template: function(tmpl, c) {
                c = c ? extend(extend({}, te.setting), c) : te.setting;
                var cse = c.append ? startend.append : startend.split,
                    needhtmlencode, sid = 0,
                    indv,
                    str = tmpl;
                str = ("with(obj){ var out='" + (c.strip ? str.replace(/(^|\r|\n)\t* +| +\t*(\r|\n|$)/g, " ").replace(/\r|\n|\t|\/\*[\s\S]*?\*\//g, "") : str)
                        .replace(/'|\\/g, "\\$&")
                        .replace(c.interpolate || skip, function(m, code) {
                            return cse.start + unescape(code) + cse.end;
                        })
                        .replace(c.conditional || skip, function(m, elsecase, code) {
                            return elsecase ?
                                (code ? "';}else if(" + unescape(code) + "){out+='" : "';}else{out+='") :
                                (code ? "';if(" + unescape(code) + "){out+='" : "';}out+='");
                        })
                        .replace(c.iterate || skip, function(m, iterate, vname, iname) {
                            if (!iterate) return "';} } out+='";
                            sid += 1;
                            indv = iname || "i" + sid;
                            iterate = unescape(iterate);
                            return "';var arr" + sid + "=" + iterate + ";if(arr" + sid + "){var " + vname + "," + indv + "=-1,l" + sid + "=arr" + sid + ".length-1;while(" + indv + "<l" + sid + "){" +
                                vname + "=arr" + sid + "[" + indv + "+=1];out+='";
                        })
                        .replace(c.evaluate || skip, function(m, code) {
                            return "';" + unescape(code) + "out+='";
                        }) +
                        "';} return out;")
                    .replace(/\n/g, "\\n").replace(/\t/g, '\\t').replace(/\r/g, "\\r")
                    .replace(/(\s|;|\}|^|\{)out\+='';/g, '$1').replace(/\+''/g, "");
                if (c.asString) {
                    return 'function (obj){' + str + '}';
                }
                try {
                    return new Function('obj', str);
                } catch (e) {
                    if (typeof console !== "undefined") console.log('Could not create a template function: ' + str + '.');
                    throw e;
                }
            }
        };
        return te;
    };

    var isReady = false,
        _event = {};

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = (function() {
            return window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.oRequestAnimationFrame ||
                window.msRequestAnimationFrame ||
                function(callback, element) {
                    window.setTimeout(callback, 1000 / 60);
                };
        })();
    }

    function on(ev, handler) {
        if (!_event[ev]) {
            _event[ev] = [];
        }
        _event[ev].push(handler);
        if (ev == 'ready' && isReady) {
            handler();
        }
    }

    function off(ev, handler) {
        if (!_event[ev]) {
            return;
        }
        for (var i = _event[ev].length - 1; i >= 0; i--) {
            if (_event[ev][i] == handler) {
                _event[ev].splice(i, 1);
            }
        }
    }

    function fire(ev, self, prms) {
        if (!_event[ev]) {
            return;
        }
        prms = prms || [];
        self = self || null;
        AM.map(_event[ev], function(v) {
            v.apply(self, prms);
        });
    }

    var _onAppReady=[];
    var TE = new templateEngine();
    var TE2 = new templateEngine();
    TE2.setting.strip = false;

    function pad(num, size) {
        var s = num + "";
        while (s.length < size) s = "0" + s;
        return s;
    }

    function e_stop(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        } else {
            e.cancelBubble = true;
        }
        e.preventDefault();
    }

    var LINK = function() {
        return AM.createDOM.apply(null, ['link', arguments]);
    }

    function isCordova() {
        return typeof(cordova) != 'undefined';
    }

    function _predefImg(el) {
        el.onerror = function(e) {
            e.target._iserror = true;
        }
    }

    function clone(obj) {
        // Validate the pass parameter
        // That it is not null, it is not an object, and not a normal array/object
        if (null == obj || "object" != typeof obj || (obj.toString() !== "" && obj.toString() !== "[object Object]") || Object.getPrototypeOf(obj).__proto__ != null) {
            return obj;
        }

        // Check if it contains valid constructor
        if (!obj.constructor || obj.constructor() === undefined) {
            return obj;
        }
        
        // Start the cloning process by initializing the constructor
        var copy = obj.constructor();
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
        }
        return copy;
    }

    function imgComplete(cb) {
        var imgs = AM.$bytc('img', null, _Scope.cWrap);
        var cnt = 0;
        var errcnt = 0;
        AM.map(imgs, function(i) {
            if (i.complete) {
                cnt++;
            } else if (i._iserror) {
                errcnt++;
            }
        });

        if (cnt >= imgs.length) {
            cb();
        } else {
            setTimeout(function() {
                imgComplete(cb)
            }, 5);
        }
    }

    function setLanguage(lang) {
        if (_Lang && _Lang['key'] && _Lang['value']) {
            if (lang == _Lang['key'] || AM.isIn(lang, _Lang['value'])) {
                localStorage['lang'] = lang;
            } else {
                console.log('No language reference.');
            }
        } else {
            console.log('No language support.');
        }
    }

    function getLanguage() {
        if (localStorage['lang']) {
            return localStorage['lang'];
        } else if (_Lang && _Lang['key']) {
            return _Lang['key'];
        } else {
            return '';
        }
    }

    /*
     * @TODO: Clean up!
     */
    function getLangCaption(k, language) {
        var l = language || getLanguage();
        if (_Lang && _Lang['key'] && _Lang['value'] && _Lang['data'] && l &&
            _Lang['key'] != l && AM.isIn(l, _Lang['value'])) {
            var i = _Lang['value'].indexOf(l);
            if (_Lang['data'][k] && _Lang['data'][k][i]) {
                return _Lang['data'][k][i];
            }
            // Validate if it's not undefined
            if (!k || typeof k === 'boolean') {
                return k;
            }
            // Support lowercase
            if (_Lang['data'][String(k).toLowerCase()] && _Lang['data'][String(k).toLowerCase()][i]) {
                return _Lang['data'][k.toLowerCase()][i];
            }
        }
        return k;
    }

    function curFormat(number, decimals, decimals_sep, thousands_sep) {

        number = (number + '').replace(/[^0-9+\-Ee.]/g, '');

        var n = !isFinite(+number) ? 0 : +number,
            prec = !isFinite(+parseInt(decimals)) ? 0 : Math.abs(parseInt(decimals)),
            sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
            dec = (typeof decimals_sep === 'undefined') ? '.' : decimals_sep,
            s = '',
            toFixedFix = function(n, prec) {
                // var k = Math.pow(10, prec);
                // return '' + (Math.round(n * k) / k).toFixed(prec);
                var value = '';

                // Check for negative values
                if (n < 0) {
                    value = Number(Math.round((n * -1) + 'e' + prec) + 'e-' + prec) * -1;
                } else {
                    value = Number(Math.round(n + 'e' + prec) + 'e-' + prec);
                }

                return '' + value;
            };

        // Fix for IE parseFloat(0.55).toFixed(0) = 0;
        s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
        // s = (prec ? toFixedFix(n, prec) : '' + Math.floor(n)).split('.');

        if (s[0].length > 3) {
            s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
        }

        if ((s[1] || '')
            .length < prec) {
            s[1] = s[1] || '';
            s[1] += new Array(prec - s[1].length + 1)
                .join('0');
        }

        return s.join(dec);

    }

    function jsonQueryGet(o, s) {
        s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
        s = s.replace(/^\./, ''); // strip a leading dot
        var a = s.split('.');
        for (var i = 0, n = a.length; i < n; ++i) {
            var k = a[i];
            if (k in o) {
                o = o[k];
            } else {
                return;
            }
        }
        return o;
    }

    function safeEval(txt) {
        if (typeof txt != 'string') {
            return txt;
        }
        var invert = false;
        if (txt.match(/^(\!+)/)) {
            invert = true;
            txt = txt.replace(/^\!+/, '');
        }
        var r = '';
        try {
            r = JSON.parse(txt);
        } catch (e) {
            var o = typeof exports != 'undefined' ? exports : window;
            try {
                r = jsonQueryGet(o, txt);
            } catch (ee) {
                console.error('gagal EVAL==>', txt)
                return undefined;
            }
        }
        r = invert ? !r : r;
        return r;
    }

    /**********
     * All the global variables used around in this file
     **********/

    /**
     * Send the request along to the url with its parameter
     * 
     * @param {*} url 
     * @param {*} a 
     * @param {*} baseApp 
     * @param {*} apiKey 
     */
    function initAjax(url, a, baseApp, apiKey) {
        showLoader();
        apiKey = apiKey || 'api';
        var p = {
            api: false,
            p: {},
            m: 'get',
            cb: function(o, e) {
                console.log(o)
            }
        };
        if (a.length) {
            p.api = a.shift();
            if (a.length) {
                p.cb = a.pop();
            }
            if (a.length) {
                p.p = a.pop();
            }
            if (a.length) {
                p.m = a.pop();
            }
        }
        p.p.appid = _baseConfig.appid;
        p.m = p.m.toUpperCase();
        var data = {};
        if (p.m == 'GET') {
            p.p[apiKey] = p.api;
            url += '?' + AM.encodeArguments(p.p);
        } else {
            var arg = {}
            arg[apiKey] = p.api;
            if (p.p.a) {
                arg.a = p.p.a;
                delete(p.p.a);
            }
            if (p.p.token) {
                arg.token = p.p.token;
                delete(p.p.token);
            }
            if (p.p.sid) {
                arg.sid = p.p.sid;
                delete(p.p.sid);
            }
            if (p.p.appid) {
                arg.appid = p.p.appid;
                delete(p.p.appid);
            }
            url += '?' + AM.encodeArguments(arg);
            data = p.p;
        }
        var d = AM.getRequest(url, p.m);
        d.addErrback(function(e) {
            closeLoader();
            p.cb(false, 'error');
        })
        d.addCallback(function(o) {
            closeLoader();
            if (!o) {
                p.cb(false, 'no data');
            } else {
                var oo = safeEvalTxt(o);
                if (oo.e) {
                    p.cb(false, 'error');
                } else {
                    p.cb(oo.o);
                }
            }
        });
        d.sendReq(data);
        return d;
    }

    /**
     * Send the api request to the app3 web services
     * of eMOBIQ
     */
    function getService() {
        initAjax(_baseConfig.appmainhost, AM.forceArray(arguments));
        return true;
    }

    /**********
     *
     **********/

    var KJidX = 1;
    var KJcbX = {};
    var JSp = function(uri, prm, cb, cbkey) {
        if (typeof(cbkey) == "undefined") {
            cbkey = 'fcb';
        }
        var scriptid = ++KJidX;
        KJcbX['scr' + scriptid] = function(o) {
            AM.REL($('scri' + scriptid));
            if (typeof(cb) != "undefined") {
                cb(o);
            };
        };
        prm[cbkey] = 'KJcbX.scr' + scriptid;
        var scri = AM.SCRIPT({
            id: 'scri' + scriptid,
            'type': 'text/javascript',
            'async': true,
            src: uri + '?' + AM.queryArguments(prm)
        });
        AM.ACN(AM.getBody(), scri);
        return false;
    }

    var m_names = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');
    var d_names = 'sunday monday tuesday wednesday thursday friday saturday'.split(' ');

    function kDate(t) {
        if (isNumeric(t)) {
            t = new Date(parseFloat(t))
        } else if (AM.isString(t)) {
            t = new Date(t);
        }
        if (Object.prototype.toString.call(t) !== '[object Date]') {
            return '';
        }
        if (t.getTime() <= 0) {
            return '';
        }
        var c = new Date();

        function extr(d) {
            return {
                y: d.getFullYear(),
                m: d.getMonth(),
                d: d.getDate(),
                ho: d.getHours(),
                mi: d.getMinutes(),
                se: d.getSeconds()
            };
        }

        var ca = extr(c);
        var ta = extr(t);
        var oneDay = 24 * 60 * 60 * 1000;
        var oneHour = 60 * 60 * 1000;
        var oneMinute = 60 * 1000;
        //(new Date(ca.y,ca.m,ca.d))
        var diffD = Math.round(Math.abs((c.getTime() - t.getTime()) / oneDay));
        //var diffH = Math.round(Math.abs((c.getTime() - t.getTime())/oneHour)); //belum kepake
        var diffM = Math.round(Math.abs((c.getTime() - t.getTime()) / oneMinute));

        var zf = function(v) {
            return pad(v, 2);
        }
        if (diffD == 0) { //today
            if (diffM <= 1) {
                return 'a few seconds ago';
            } else if (diffM < 30) {
                return diffM + ' minutes ago';
            } else {
                return 'today at ' + zf(ta.ho) + ':' + zf(ta.mi);
            }
        } else if (diffD == 1) { //yesterday
            return 'yesterday at ' + zf(ta.ho) + ':' + zf(ta.mi);
        } else if (diffD < 7) {
            return d_names[t.getDay()] + ' at ' + zf(ta.ho) + ':' + zf(ta.mi);
        } else {
            return ta.d + ' ' + m_names[ta.m] + ' ' + ta.y;
        }
    }

    Date.prototype.kChatFormat = function() {
        return kDate(this);
    }

    Date.prototype.milliTimeStamp = function() {
        return this.getTime();
    }

    Date.prototype.tickFormat = function() {
        return '' + this.getFullYear() +
            pad(this.getMonth() + 1, 2) +
            pad(this.getDate(), 2) +
            pad(this.getHours(), 2) +
            pad(this.getMinutes(), 2) +
            pad(this.getSeconds(), 2) +
            pad(this.getMilliseconds(), 3);
    }

    Date.prototype.simpleFormat = function() {
        return '' + pad(this.getDate(), 2) +
            '-' + pad(this.getMonth() + 1, 2) +
            '-' + this.getFullYear() +
            ' ' + pad(this.getHours(), 2) +
            ':' + pad(this.getMinutes(), 2);
    }

    function simpleDate(s) {
        var d = new Date(s);
        return d.simpleFormat();
    }

    /**
     * Generate unique id with a low chance of duplicating
     * 
     * @param number - integer to generate the random number
     * 
     * @return integer
     */
    function makeId(number) {
        number = number || 1000;
        var d = new Date();
        return '' + d.getTime() + pad(Math.floor(Math.random() * number), 3);
    }

    // Increase the date passed
    function addDate(add, date, type) {
        // Prepare the needed information
        type = type || 'days';
        if (!date) {
            date = new Date();
        }

        // Prepare the time to add to the date
        switch(type.toLowerCase()) {
            case 'hour':
            case 'hours':
                add = (add * 60 * 60 * 1000);
                break;
            case 'minute':
            case 'minutes':
                add = (add * 60 * 1000);
                break;
            case 'second':
            case 'seconds':
                add = (add * 1000);
                break;
            default: // days
                add = (add * 24 * 60 * 60 * 1000);
        }

        // Add the time
        date.setTime(date.getTime() + add);

        return date;
    }

    // Get the current date with time or not
    function dbDate(date, wTime) {
        wTime = wTime || false;
        if (!date) {
            date = new Date();
        }
        var result = date.getFullYear() +
            '-' + pad(date.getMonth() + 1, 2) +
            '-' + pad(date.getDate(), 2);
        if (wTime) {
            result += ' ' + pad(date.getHours(), 2) +
                ':' + pad(date.getMinutes(), 2) +
                ':' + pad(date.getSeconds(), 2);
        }
        return result;
    }

    function strToDate(s) {
        // if (!s) {
        //     return new Date();
        // }
        if (!s || typeof s == 'undefined') {
            return new Date();
        }
        s = s.replace(/[Tt]/, ' ').trim();
        var re = /((\d{4})-(\d{1,2})-(\d{1,2}))?(\s*)((\d{1,2}):?(\d{1,2})?:?(\d{1,2})?)?/;
        var dt = new Date();
        var a = [dt.getFullYear(), dt.getMonth() + 1, dt.getDate(), 0, 0, 0];
        var m = s.match(re);
        if (m && m.length) {
            if (m[1]) {
                a.splice(0, 3, m[2], m[3], m[4]);
            }
            if (m[6]) {
                a[3] = m[7];
                if (m[8]) {
                    a[4] = m[8];
                }
                if (m[9]) {
                    a[5] = m[9];
                }
            }
        }
        return new Date(a[0], a[1] - 1, a[2], a[3], a[4], a[5]);
    }

    //change by AAS
    function formatDate(format, timestamp) { 
        var jsdate, f
            // Keep this here (works, but for code commented-out below for file size reasons)
            // var tal= [];
        var txtWords = [
                'Sun', 'Mon', 'Tues', 'Wednes', 'Thurs', 'Fri', 'Satur',
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ]
            // trailing backslash -> (dropped)
            // a backslash followed by any character (including backslash) -> the character
            // empty string -> empty string
        var formatChr = /\\?(.?)/gi
        var formatChrCb = function(t, s) {
            return f[t] ? f[t]() : s
        }
        var _pad = function(n, c) {
            n = String(n)
            while (n.length < c) {
                n = '0' + n
            }
            return n
        }
        f = {
            // Get total days
            q: function() {
                return new Date(jsdate.getFullYear(), _pad(f.n(), 2), 0).getDate();
            },
            // Day
            d: function() {
                // Day of month w/leading 0; 01..31
                return _pad(f.j(), 2)
            },
            D: function() {
                // Shorthand day name; Mon...Sun
                return f.l()
                    .slice(0, 3)
            },
            j: function() {
                // Day of month; 1..31
                return jsdate.getDate()
            },
            l: function() {
                // Full day name; Monday...Sunday
                return txtWords[f.w()] + 'day'
            },
            N: function() {
                // ISO-8601 day of week; 1[Mon]..7[Sun]
                return f.w() || 7
            },
            S: function() {
                // Ordinal suffix for day of month; st, nd, rd, th
                var j = f.j()
                var i = j % 10
                if (i <= 3 && parseInt((j % 100) / 10, 10) === 1) {
                    i = 0
                }
                return ['st', 'nd', 'rd'][i - 1] || 'th'
            },
            w: function() {
                // Day of week; 0[Sun]..6[Sat]
                return jsdate.getDay()
            },
            z: function() {
                // Day of year; 0..365
                var a = new Date(f.Y(), f.n() - 1, f.j())
                var b = new Date(f.Y(), 0, 1)
                return Math.round((a - b) / 864e5)
            },

            // Week
            W: function() {
                // ISO-8601 week number
                var a = new Date(f.Y(), f.n() - 1, f.j() - f.N() + 3)
                var b = new Date(a.getFullYear(), 0, 4)
                return _pad(1 + Math.round((a - b) / 864e5 / 7), 2)
            },

            // Month
            F: function() {
                // Full month name; January...December
                return txtWords[6 + f.n()]
            },
            m: function() {
                // Month w/leading 0; 01...12
                return _pad(f.n(), 2)
            },
            M: function() {
                // Shorthand month name; Jan...Dec
                return f.F()
                    .slice(0, 3)
            },
            n: function() {
                // Month; 1...12
                return jsdate.getMonth() + 1
            },
            t: function() {
                // Days in month; 28...31
                return (new Date(f.Y(), f.n(), 0))
                    .getDate()
            },

            // Year
            L: function() {
                // Is leap year?; 0 or 1
                var j = f.Y()
                return j % 4 === 0 & j % 100 !== 0 | j % 400 === 0
            },
            o: function() {
                // ISO-8601 year
                var n = f.n()
                var W = f.W()
                var Y = f.Y()
                return Y + (n === 12 && W < 9 ? 1 : n === 1 && W > 9 ? -1 : 0)
            },
            Y: function() {
                // Full year; e.g. 1980...2010
                return jsdate.getFullYear()
            },
            y: function() {
                // Last two digits of year; 00...99
                return f.Y()
                    .toString()
                    .slice(-2)
            },

            // Time
            a: function() {
                // am or pm
                return jsdate.getHours() > 11 ? 'pm' : 'am'
            },
            A: function() {
                // AM or PM
                return f.a()
                    .toUpperCase()
            },
            B: function() {
                // Swatch Internet time; 000..999
                var H = jsdate.getUTCHours() * 36e2
                    // Hours
                var i = jsdate.getUTCMinutes() * 60
                    // Minutes
                    // Seconds
                var s = jsdate.getUTCSeconds()
                return _pad(Math.floor((H + i + s + 36e2) / 86.4) % 1e3, 3)
            },
            g: function() {
                // 12-Hours; 1..12
                return f.G() % 12 || 12
            },
            G: function() {
                // 24-Hours; 0..23
                return jsdate.getHours()
            },
            h: function() {
                // 12-Hours w/leading 0; 01..12
                return _pad(f.g(), 2)
            },
            H: function() {
                // 24-Hours w/leading 0; 00..23
                return _pad(f.G(), 2)
            },
            i: function() {
                // Minutes w/leading 0; 00..59
                return _pad(jsdate.getMinutes(), 2)
            },
            s: function() {
                // Seconds w/leading 0; 00..59
                return _pad(jsdate.getSeconds(), 2)
            },
            u: function() {
                // Microseconds; 000000-999000
                return _pad(jsdate.getMilliseconds() * 1000, 6)
            },

            // Timezone
            e: function() {
                // Timezone identifier; e.g. Atlantic/Azores, ...
                // The following works, but requires inclusion of the very large
                // timezone_abbreviations_list() function.
                /*              return that.date_default_timezone_get();
                 */
                var msg = 'Not supported (see source code of date() for timezone on how to add support)'
                throw new Error(msg)
            },
            I: function() {
                // DST observed?; 0 or 1
                // Compares Jan 1 minus Jan 1 UTC to Jul 1 minus Jul 1 UTC.
                // If they are not equal, then DST is observed.
                var a = new Date(f.Y(), 0)
                    // Jan 1
                var c = Date.UTC(f.Y(), 0)
                    // Jan 1 UTC
                var b = new Date(f.Y(), 6)
                    // Jul 1
                    // Jul 1 UTC
                var d = Date.UTC(f.Y(), 6)
                return ((a - c) !== (b - d)) ? 1 : 0
            },
            O: function() {
                // Difference to GMT in hour format; e.g. +0200
                var tzo = jsdate.getTimezoneOffset()
                var a = Math.abs(tzo)
                return (tzo > 0 ? '-' : '+') + _pad(Math.floor(a / 60) * 100 + a % 60, 4)
            },
            P: function() {
                // Difference to GMT w/colon; e.g. +02:00
                var O = f.O()
                return (O.substr(0, 3) + ':' + O.substr(3, 2))
            },
            T: function() {
                // The following works, but requires inclusion of the very
                // large timezone_abbreviations_list() function.
                /*              var abbr, i, os, _default;
                if (!tal.length) {
                  tal = that.timezone_abbreviations_list();
                }
                if ($locutus && $locutus.default_timezone) {
                  _default = $locutus.default_timezone;
                  for (abbr in tal) {
                    for (i = 0; i < tal[abbr].length; i++) {
                      if (tal[abbr][i].timezone_id === _default) {
                        return abbr.toUpperCase();
                      }
                    }
                  }
                }
                for (abbr in tal) {
                  for (i = 0; i < tal[abbr].length; i++) {
                    os = -jsdate.getTimezoneOffset() * 60;
                    if (tal[abbr][i].offset === os) {
                      return abbr.toUpperCase();
                    }
                  }
                }
                */
                return 'UTC'
            },
            Z: function() {
                // Timezone offset in seconds (-43200...50400)
                return -jsdate.getTimezoneOffset() * 60
            },

            // Full Date/Time
            c: function() {
                // ISO-8601 date.
                return 'Y-m-d\\TH:i:sP'.replace(formatChr, formatChrCb)
            },
            r: function() {
                // RFC 2822
                return 'D, d M Y H:i:s O'.replace(formatChr, formatChrCb)
            },
            U: function() {
                // Seconds since UNIX epoch
                return jsdate / 1000 | 0
            }
        }

        var _date = function(format, timestamp) {

            jsdate = (timestamp === undefined ? new Date() // Not provided
                :
                (timestamp instanceof Date) ? new Date(timestamp) // JS Date()
                :
                new Date(timestamp * 1000) // UNIX timestamp (auto-convert to int)
            )

            return format.replace(formatChr, formatChrCb)
        }

        return _date(format, timestamp)

    }

    function cDateDiff(d1, d2, interval) {
        /*
         * DateFormat month/day/year hh:mm:ss
         * ex.
         * interval  : days, weeks,
         * datediff('01/01/2011 12:00:00','01/01/2011 13:30:00','seconds');
         */
        var second = 1000,
            minute = second * 60,
            hour = minute * 60,
            day = hour * 24,
            week = day * 7;
        var t1 = d1,
            t2 = d2;
        if (typeof t1 == 'string') {
            t1 = strToDate(t1);
        }
        if (typeof t2 == 'string') {
            t2 = strToDate(t2);
        }
        //var t1=new Date( d1.replace( /(\d{2})-(\d{2})-(\d{4})/, "$2/$1/$3") );
        //var t2=new Date( d2.replace( /(\d{2})-(\d{2})-(\d{4})/, "$2/$1/$3") );
        var fromDate = new Date(t1);
        var toDate = new Date(t2);
        var timediff = toDate - fromDate;
        if (isNaN(timediff)) return NaN;
        switch (interval) {
            case "years":
                return toDate.getFullYear() - fromDate.getFullYear();
            case "months":
                return (
                    (toDate.getFullYear() * 12 + toDate.getMonth()) -
                    (fromDate.getFullYear() * 12 + fromDate.getMonth())
                );
            case "weeks":
                return Math.floor(timediff / week);
            case "days":
                return Math.floor(timediff / day);
            case "hours":
                return Math.floor(timediff / hour);
            case "minutes":
                return Math.floor(timediff / minute);
            case "seconds":
                return Math.floor(timediff / second);
            default:
                return 0;
        }
    }

    var kMainMenu = null;

    function loadLocalPage(o) {
        if (o.p) {
            showPage(getStorageDt('template', o.p));
        }
    }

    function saveLocalPage(o, dt, jso) {
        setStorageDt('template', o.p, dt);
    }

    function loadSnippet(nm) {
        return getStorageDt('snippet', nm);
    }

    function saveSnippet(nm, dt) {
        setStorageDt('snippet', nm, dt);
    }

    function _hashHandler(o) {
        //if (document.readyState != 'complete') {
        //  //AM.AEV(window,'load',function(){ _hashHandler(o); });
        //  window.onload=function(){
        //      _hashHandler(o);
        //  }
        //  return;
        //}
        //if (!AM.getBody()) {
        //  return;
        //}
        //
        //if (o.p) {
        //  _Scope.loadPage(o);
        //}

        if (document.readyState != 'complete') {
            window.onload = function() {
                setTimeout(function() {
                    _Scope.loadPage(o);
                }, 50);
            }
            return;
        }
        if (!AM.getBody()) {
            return;
        }

        if (o.p) {
            setTimeout(function() {
                _Scope.loadPage(o);
            }, 50);
            //
        }
    }

    function nobackSetHash(o) {
        if (history.replaceState) {
            _hashHandler(o);
            history.replaceState(null, null, '#' + AM.serializeJSON(o));
        } else {
            window.location.hash = AM.serializeJSON(o);
        }
    }

    function setHash(o, noback) {
        o = o || {};
        o.rnd = makeId();
        noback = noback || false;
        if (!o.p || noback) {
            if (!o.p) {
                o.p = _baseConfig.defaultPage;
            }
            nobackSetHash(o);
            //_hashHandler(o);
            return;
        }
        window.location.hash = AM.serializeJSON(o);

        // Check the license
        licenseCheck();

        // Check version update
        if (isCordova() && _appGlobal.global.data.attr.autoUpdate) {
            appVersionCheck(false);
        }
    }



    /* source:lib/hash.js */


    function safeEvalTxt(txt) {
        var r = {};
        try {
            r.o = JSON.parse(txt);
        } catch (ee) {
            console.error('safeEvalTxt error==>', txt);
            r.e = ee.toString();
        }
        return r;
    }

    function safeJSONdecode(s) {
        var hsl = safeEvalTxt(s);
        if (hsl.e) {
            return {
                e: 'can not convert to JSON',
                txt: s
            }
        } else {
            return {
                o: hsl.o
            }
        }
    }

    function getHash() {
        var s = decodeURIComponent(window.location.hash.replace(/^\#/, ''));
        if (!s) {
            return false;
        }
        var jd = safeJSONdecode(s);
        if (!jd.e) {
            return jd.o;
        } else {
            return false;
        }
    }

    function doHashEvent() {
        if (!_hashHandler) {
            return;
        }
        var s = decodeURIComponent(window.location.hash).replace(/^\#/, '');
        if (s) {
            if (!(("onhashchange" in window) && !AM.isIe())) {
                window.location.hash = '';
            }
            var jd = safeJSONdecode(s);
            if (!jd.e) {
                _hashHandler(jd.o);
            }
        }
    }

    function _addHashListener() {
        if (("onhashchange" in window) && !AM.isIe()) {
            doHashEvent();
            window.onhashchange = function() {
                doHashEvent();
            }
        } else {
            window.setInterval(function() {
                doHashEvent();
            }, 100);
        }
    }

    _addHashListener();

    /* source:lib/touch.js */


    var touchy = null,
        touchAlias = {
            "touchstart": "mousedown",
            "touchmove": "mousemove",
            "touchend": "mouseup",
            "touchcancel": "mouseout"
        };

    function touchE(ta) {
        if (touchAlias[ta] && !touchy) {
            return touchAlias[ta];
        } else {
            return ta;
        }
    }

    function touchyTest() {
        var o = document.createElement('div');
        var test = ("ontouchstart" in o);
        if (!test) {
            o.setAttribute("ontouchstart", 'return;');
            test = (typeof o.ontouchstart === 'function');
        }
        touchy = test;
        o = null;
        return touchy;
    }

    AM.AEV(window, 'load', function() {
        touchyTest();
    });


    /* source:lib/local_storage.js */


    function deleteLocalJSONStorage(nm) {
        localStorage.removeItem(nm);
    }

    function getLocalJSONStorage(nm, def) {
        if (localStorage[nm]) {
            return AM.evalTxt(localStorage[nm]);
        } else {
            if (def) {
                return def;
            } else {
                return {};
            }
        }
    }

    function setLocalJSONStorage(nm, v) {
        localStorage[nm] = AM.serializeJSON(v);
    }

    function getStorageDt(dt, nm) {
        var comp = getLocalJSONStorage(dt);
        return comp[nm] || {};
    }

    function setStorageDt(dt, nm, v) {
        var comp = getLocalJSONStorage(dt);
        comp[nm] = v;
        setLocalJSONStorage(dt, comp);
    }

    //function getStorageComponents(nm) {
    //  return getStorageDt('components',nm);
    //}
    //
    //function setStorageComponents(nm,v) {
    //  setStorageDt('components',nm,v);
    //}


    /* source:lib/slidemenu.js */


    "use strict";

    var slideMenu = function(options) {
        options = options || {};
        this.isOpen = false;
        this.bodyContent = document.querySelector('body');
        this.contentPanel = options.content;
        this.menu = options.menu;
        this.width = options.width === undefined ? '250px' : options.width;
        this._halfWindow = Math.ceil((this.width).replace('px', '') / 2);
        this.type = options.type === undefined ? 'reveal' : options.type;
        this.swipeZone = options.swipeZone === undefined ? (window.innerWidth / 15) : options.swipeZone;
        this.duration = options.duration === undefined ? 300 : options.duration;
        this.contentOverlay = options.contentOverlay === undefined ? false : options.contentOverlay;
        this.touchSlide = options.touchSlide === undefined ? true : options.touchSlide;

        if (this.menu === undefined || this.menu == null) {
            error.error('Error:', 'menu undefined or null');
            return;
        } else {
            this.menu.style.width = this.width;
        }

        if (this.menu.className.search('sm-menu') === -1) {
            this.menu.className += ' sm-menu';
        }

        if (this.contentOverlay !== false) {
            var divOverlay = document.createElement("div");
            divOverlay.setAttribute('class', 'sm-overlay');
            this.bodyContent.prepend(divOverlay);
            this.elemOverlay = document.querySelector('.sm-overlay');
        }

        if (this.type === 'push') {
            if (this.contentPanel === undefined || this.contentPanel == null) {
                console.error('Error:', 'Content panel is required for push menu');
                return {
                    valid: false,
                    errorType: 'contentPanel',
                    message: 'Content panel is required for push menu'
                };
            }
            if (this.contentPanel.className.search('sm-content') === -1) {
                this.contentPanel.className += ' sm-content';
            }
            this.menu.style.transform = 'translateX(-' + this.menu.offsetWidth + 'px)';
            this.menu.style.zIndex = '99 !important';
            this.contentPanel.style.zIndex = '1 !important';
            this.contentPanel.style.transform = 'translateX(0px)';
        }

        if (this.type === 'reveal') {
            if (this.contentPanel === undefined || this.contentPanel == null) {
                console.error('Error:', 'Content panel is required for reveal menu');
                return {
                    valid: false,
                    errorType: 'contentPanel',
                    message: 'Content panel is required for reveal menu'
                };
            }
            if (this.contentPanel.className.search('sm-content') === -1) {
                this.contentPanel.className += ' sm-content';
            }
            this.menu.style.transform = 'translateX(0)';
            this.menu.style.zIndex = '0 !important';
            this.contentPanel.style.zIndex = '1 !important';
            this.contentPanel.style.transform = 'translateX(0px)';
        }

        if (this.type === 'overlay') {
            this.menu.style.transform = 'translateX(-' + this.menu.offsetWidth + 'px)';
            this.menu.style.zIndex = '99 !important';
        }

        if (this.touchSlide === true) this._touchSlider();
    }

    slideMenu.prototype.slideOpen = function() {
        this._slider('sm-open', 'open');
        return this;
    };

    slideMenu.prototype.slideClose = function() {
        this._slider('sm-close', 'close');
        return this;
    };

    slideMenu.prototype._slider = function(addClass, slideType) {
        var self = this;
        var elem = window.document.documentElement;

        if (elem.className.search(addClass) === -1) {
            elem.className = addClass;
        }

        if (this.type === 'reveal') {
            this.contentPanel.style.transition = this._browserType() + 'transform ' + this.duration + 'ms ease';
            this.contentPanel.style.transform = 'translateX(' + (slideType === 'open' ? this.menu.offsetWidth + 'px' : '0px') + ')';
        }

        if (this.type === 'push') {
            this.menu.style.transition = this._browserType() + 'transform ' + this.duration + 'ms ease';
            this.menu.style.transform = 'translateX(' + (slideType === 'open' ? '0px' : '-' + this.menu.offsetWidth + 'px') + ')';

            this.contentPanel.style.transition = this._browserType() + 'transform ' + this.duration + 'ms ease';
            this.contentPanel.style.transform = 'translateX(' + (slideType === 'open' ? this.menu.offsetWidth + 'px' : '0px') + ')';
        }

        if (this.type === 'overlay') {
            this.menu.style.transition = this._browserType() + 'transform ' + this.duration + 'ms ease';
            this.menu.style.transform = 'translateX(' + (slideType === 'open' ? '0px' : '-' + this.menu.offsetWidth + 'px') + ')';
        }

        setTimeout(function() {
            self.menu.style.transition = self.menu.style[self._browserType() + 'transition'] = '';

            if (self.contentPanel !== undefined)
                self.contentPanel.style.transition = self.contentPanel.style[self._browserType() + 'transition'] = '';

            if (self.type === 'push' || self.type === 'overlay') {
                if (self.parseTranslateX(self.menu.style.transform) === 0) self.isOpen = true;
                else self.isOpen = false;
            }
            if (self.type === 'reveal') {
                if (self.parseTranslateX(self.contentPanel.style.transform) === self.menu.offsetWidth) self.isOpen = true;
                else self.isOpen = false;
            }

        }, this.duration + 50);

        if (this.type === 'push' || this.type === 'overlay') {
            var menuStat = this.parseTranslateX(this.menu.style.transform) === 0;
        }
        if (this.type === 'reveal') {
            if (document.querySelector('.sm-overlay') !== null) {
                document.querySelector('.sm-overlay').remove();
            }
        }

        if (this.contentOverlay === true) {
            if (menuStat) {
                this.elemOverlay.style.display = 'block';
            } else {
                this.elemOverlay.style.display = 'none';
            }
        }

        return this;
    }

    slideMenu.prototype.isOpened = function() {
        return this.isOpen;
    }

    slideMenu.prototype.toggle = function() {
        if (this.isOpen === false) this.slideOpen();
        else this.slideClose();
        return this;
    }

    slideMenu.prototype._touchSlider = function() {
        var self = this;
        var panSwipe = new Hammer(this.bodyContent, {});
        var selfWidth = self.width;
        var width = this.menu.offsetWidth;
        var lastDeltaX = 0;

        panSwipe.get('pan').set({
            direction: Hammer.DIRECTION_HORIZONTAL,
            threshold: 0
        });

        panSwipe.get('doubletap').set({
            enable: false
        });
        panSwipe.get('press').set({
            enable: false
        });
        panSwipe.get('swipe').set({
            enable: false
        });
        panSwipe.get('pinch').set({
            enable: false
        });
        panSwipe.get('rotate').set({
            enable: false
        });

        panSwipe.on('panleft panright', function(evt) {
                var x = evt.center.x;
                var deltaX = evt.deltaX;

                if (self.isOpen === false && (x - deltaX) > self.swipeZone) return false;

                if (self.type === 'reveal') {
                    var sideMenuCurrentTranslate = self.parseTranslateX(self.contentPanel.style.transform),
                        finalTranslate = sideMenuCurrentTranslate + (deltaX - lastDeltaX);

                    if (finalTranslate >= 0 && finalTranslate <= width) {
                        self.contentPanel.style.transform = 'translateX(' + finalTranslate + 'px)';
                    }
                }

                if (self.type === 'push') {
                    var sideMenuCurrentTranslate = self.parseTranslateX(self.menu.style.transform),
                        finalTranslate = sideMenuCurrentTranslate + (deltaX - lastDeltaX);

                    if (finalTranslate >= -parseInt(width) && finalTranslate <= 0) {
                        self.menu.style.transform = 'translateX(' + finalTranslate + 'px)';
                        self.contentPanel.style.transform = 'translateX(' + (finalTranslate + parseInt(width)) + 'px)';
                    }
                }

                if (self.type === 'overlay') {
                    var sideMenuCurrentTranslate = self.parseTranslateX(self.menu.style.transform),
                        finalTranslate = sideMenuCurrentTranslate + (deltaX - lastDeltaX);

                    if (finalTranslate >= -parseInt(width) && finalTranslate <= 0) {
                        self.menu.style.transform = 'translateX(' + finalTranslate + 'px)';
                    }
                }

                lastDeltaX = deltaX;
            })
            .on('panend', function(evt) {
                lastDeltaX = 0;

                if (self.type === 'reveal') {
                    var sideMenuActualLeft = self.parseTranslateX(self.contentPanel.style.transform);
                    var halfWindow = self._halfWindow;
                }

                if (self.type === 'push' || self.type === 'overlay') {
                    var sideMenuActualLeft = self.parseTranslateX(self.menu.style.transform);
                    var halfWindow = -self._halfWindow;
                }

                if (sideMenuActualLeft > halfWindow) self.slideOpen();
                else self.slideClose();
            })
            .on('tap', function(evt) {
                if (self.isOpened && evt.target.closest('.sm-menu') === null) self.slideClose();
            });
        return this;
    };

    slideMenu.prototype.parseTranslateX = function(str) {
        var matrix = str.replace(/[^0-9\-.,]/g, '').split(',');
        return parseInt(matrix[0]);
    }

    slideMenu.prototype._browserType = function() {
        var regex = /^(Webkit|Khtml|Moz|ms|O)(?=[A-Z])/;
        var styleDeclaration = window.document.getElementsByTagName('script')[0].style;
        for (var prop in styleDeclaration) {
            if (regex.test(prop)) return '-' + prop.match(regex)[0].toLowerCase() + '-';
        }
        if ('WebkitOpacity' in styleDeclaration) {
            return '-webkit-';
        }
        if ('KhtmlOpacity' in styleDeclaration) {
            return '-khtml-';
        }
        return '';
    }

    var HTMLElement = typeof(window.HTMLElement) != 'undefiend' ? window.HTMLElement : window.Element;

    HTMLElement.prototype.prepend = function(element) {
        if (this.firstChild) {
            return this.insertBefore(element, this.firstChild);
        } else {
            return this.appendChild(element);
        }
    };

    Element.prototype.remove = function() {
        this.parentElement.removeChild(this);
    };

    NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
        for (var i = this.length - 1; i >= 0; i--) {
            if (this[i] && this[i].parentElement) {
                this[i].parentElement.removeChild(this[i]);
            }
        }
    };

    /* source:lib/components/component.js */


    var _Components = {};

    function registerComponent(ref, name, classParent, category) {
        if (typeof ref == 'string') {
            console.error('class refference must be function');
            return;
        }
        var classFunction = ref;
        if (name && classFunction) {
            classFunction.prototype._class = name.replace(/^T/, ''); //.toLowerCase();
            classFunction.prototype._design = category ? true : false;
            if (classParent) {
                if (classParent.prototype._classParent && classParent.prototype._classParent.length) {
                    classFunction.prototype._classParent = classParent.prototype._classParent.join(',').split(',');
                } else {
                    classFunction.prototype._classParent = [];
                }
                classFunction.prototype._classParent.push(classParent.prototype._class)
            } else {
                classFunction.prototype._classParent = [];
            }
            var x = {
                'cf': classFunction
            };
            if (classParent) {
                x.p = classParent;
            }
            if (category) {
                x.ct = category;
            }
            _Components[name] = x;
        }
    }

    /**
     * Trigger the action called
     */ 
    function _doAction(act, embed) {
        if (!AM.isArray(act)) {
            act = [act];
        }
        //for (var i of act) {
        // };
        AM.map(act, function(i) {
            i = i || {};
            if (i.f) {
                i._embed = {
                    'action': i
                };
                i._embed = AM.update(i._embed, embed || {});
                runFunction(i);
            } else {
                console.log('Invalid "f" (function name).', i);
            }
        });
    };

    /**
     * Run the function
     */ 
    function runFunction(prm) {
        if (AM.isObject(prm) && prm.f) {
            prm._embed = prm._embed || {};
            return processFunction(prm.f, prm.params, prm.paramType, prm._embed);
        } else {
            return prm;
        }
    }

    /**
     * Process the function
     */ 
    function processFunction(fn, prm, prmType, _embed) {
        if (!_Function[fn]) {
            return false;
        }

        _embed = _embed || {};
        prmType = prmType || {};
        prm = prm || {};
        var vprm = {};
        for (var i in prm) {
            if (prmType[i]) {
                if (prmType[i] == 'function') {
                    vprm[i] = processFunction(prm[i]['f'], prm[i]['params'], prm[i]['paramType'], _embed);
                } else if (AM.isIn(prmType[i], AM.keys(_embedDetail))) {
                    // Clone to remove the reference
                    vprm[i] = clone(_embedDetail[prmType[i]](prm[i], _embed));
                } else if (_embed[prmType[i]]) {
                    // Clone to remove the reference
                    vprm[i] = clone(_embed[prmType[i]]);
                }
            } else {
                vprm[i] = prm[i];
            }
        }

        return _Function[fn].apply(clone(_embed), [vprm]);
    }

    var TComponent = new AM.Class({
        init: function(name) {
            this.name = name;
            TComponent.count++;
        },
        attr: {},
        ev: {},
        clearChilds: function() {
            if (this.childs && this.childs.length) {
                AM.rmap(this.childs, function(i) {
                    if (i.remove) {
                        i.remove();
                    }
                });
            }
            this.childs = [];
        },
        remove: function() {
            this.clearChilds();
            if (this._el) {
                AM.REL(this._el);
                delete this._el;
            }
            _Scope.deleteComponentIdx(_Scope.componentIndex(this));
        },
        setAttr: function(attr, w) {
            AM.update(this.attr, attr);
        },
        setEvent: function(ev) { },
        doAction: function(act, ebd) {
            ebd = ebd || {};
            _doAction(act, AM.update({
                'obj': this,
                'data': this.data || {}
            }, ebd));
        },
        load: function(o) {
            // Set the event listener
            if (o.ev) {
                this.ev = AM.update(this.ev, o.ev);
                this.setEvent(o.ev || {});
            }
            // Trigger the load event
            if (this.ev && this.ev['load']) {
                this.doAction(this.ev['load']);
            }
        },
        loadAttr: function(o) {
            // Set the attributes of the object
            this.attr = {};
            if (o.attr) {
                this.attr = AM.update(this.attr, o.attr);
                if (this.attr.idPrefix && this.attr.idField) {
                    if (this.data) {
                        // Get the correct field if have subfield
                        var field = '';
                        var data = this.attr.idField.split(".");
                        for (var i in data) {
                            // Check if field already have data then use it
                            if (field == '') {
                                field = this.data[data[i]];
                            } else {
                                field = field[data[i]];
                            }
                        }
                        this._id = this.attr.idPrefix + field;
                    }
                }
                this.setAttr(o.attr || {});
            }
        }
    });

    TComponent.count = 0;
    registerComponent(TComponent, 'TComponent', null);


    /* source:lib/components/visualcomponent.js */


    var cssAttr = {
        // Position + Display
        'position' : 'position',
        'display' : 'display',
        'float' : 'float',
        'overflow' : 'overflow',
        'overflowX' : 'overflow-x',
        'overflowY' : 'overflow-y',
        'overflowWrap' : 'overflow-wrap',
        'top' : 'top',
        'bottom' : 'bottom',
        'left' : 'left',
        'right' : 'right',
        'zIndex' : 'z-index',
        'verticalAlign' : 'vertical-align',

        // Display - Flex 
        'flexDirection' : 'flex-direction',
        'flexWrap' : 'flex-wrap',
        'justifyContent' : 'justify-content',
        'alignContent' : 'align-content',
        'alignItems' : 'align-items',
        'alignSelf' : 'align-self',
        'flexGrow' : 'flex-grow',
        'flexShrink' : 'flex-shrink',
        'flexBasis' : 'flex-basis',
        'flex' : 'flex',
        
        // Display - Grid 
        'gridTemplateAreas' : 'grid-template-areas',
        'gridAutoColumns' : 'grid-auto-columns',
        'gridColumnGap' : 'grid-column-gap',
        'gridColumnStart' : 'grid-column-start',
        'gridColumnEnd' : 'grid-column-end',
        'gridAutoRows' : 'grid-auto-rows',
        'gridRowGap' : 'grid-row-gap',
        'gridRowStart' : 'grid-row-start',
        'gridRowEnd' : 'grid-row-end',

        // Size
        'height' : 'height',
        'width' : 'width',
        'minWidth' : 'min-width',
        'minHeight' : 'min-height',
        'maxWidth' : 'max-width',
        'maxHeight' : 'max-height',

        // Style
        'opacity' : 'opacity',
        'boxShadow' : 'box-shadow',
        'filter' : 'filter',
        'mixBlendMode' : 'mix-blend-mode',

        // Text
        'caretColor' : 'caret-color',
        'color' : 'color',
        'fontFamily' : 'font-family',
        'fontSize' : 'font-size',
        'fontStyle' : 'font-style',
        'fontVariant' : 'font-variant',
        'fontWeight' : 'font-weight',
        'textAlign' : 'text-align',
        'textDecorationLine' : 'text-decoration-line',
        'textDecorationColor' : 'text-decoration-color',
        'textDecorationStyle' : 'text-decoration-style',
        'textShadow' : 'text-shadow',
        'textTransform' : 'text-transform',
        'writingMode' : 'writing-mode',

        // Text Spacing
        'whiteSpace' : 'white-space',
        'textOverflow' : 'text-overflow',
        'wordBreak' : 'word-break',
        'wordSpacing' : 'word-spacing',
        'lineHeight' : 'line-height',
        'letterSpacing' : 'letter-spacing',
        
        // Background
        'background' : 'background',
        'backgroundColor' : 'background-color',
        'backgroundPosition' : 'background-position',
        'backgroundSize' : 'background-size',
        'backgroundRepeat' : 'background-repeat',
        'backgroundAttachment' : 'background-attachment',

        // Border
        'border' : 'border', // Deprecated
        'borderStyle' : 'border-style',
        'borderWidth' : 'border-width',
        'borderColor' : 'border-color',
        'borderImageSlice' : 'border-image-slice',
        'borderImageWidth' : 'border-image-width',
        'borderImageOutset' : 'border-image-outset',
        'borderImageRepeat' : 'border-image-repeat',
        'borderTop' : 'border-top', // Deprecated
        'borderTopStyle' : 'border-top-style',
        'borderTopWidth' : 'border-top-width',
        'borderTopColor' : 'border-top-color',
        'borderBottom' : 'border-bottom', // Deprecated
        'borderBottomStyle' : 'border-bottom-style',
        'borderBottomWidth' : 'border-bottom-width',
        'borderBottomColor' : 'border-bottom-color',
        'borderLeft' : 'border-left', // Deprecated
        'borderLeftStyle' : 'border-left-style',
        'borderLeftWidth' : 'border-left-width',
        'borderLeftColor' : 'border-left-color',
        'borderRight' : 'border-right', // Deprecated
        'borderRightStyle' : 'border-right-style',
        'borderRightWidth' : 'border-right-width',
        'borderRightColor' : 'border-right-color',
        'borderRadius' : 'border-radius',
        'borderTopLeftRadius' : 'border-top-left-radius',
        'borderTopRightRadius' : 'border-top-right-radius',
        'borderBottomLeftRadius' : 'border-bottom-left-radius',
        'borderBottomRightRadius' : 'border-bottom-right-radius',

        // Padding
        'padding' : 'padding',
        'paddingTop' : 'padding-top',
        'paddingBottom' : 'padding-bottom',
        'paddingLeft' : 'padding-left',
        'paddingRight' : 'padding-right',

        // Margin
        'margin' : 'margin',
        'marginTop' : 'margin-top',
        'marginBottom' : 'margin-bottom',
        'marginLeft' : 'margin-left',
        'marginRight' : 'margin-right',

        // Column 
        'columnCount' : 'column-count',
        'columnGap' : 'column-gap',
        'columnRuleStyle' : 'column-rule-style',
        'columnRuleWidth' : 'column-rule-width',
        'columnRuleColor' : 'column-rule-color'      
    };

    function compIncludeStyle(cmp, element) {
        // apply only on the first level
        if (typeof element === 'undefined') {
            element = $(cmp._el);
        }
        
        if (element) {
            var s = '';
            for (var i in cmp.attr) {
                if (cssAttr[i]) {
                    s += s ? ' ' : '';
                    s += cssAttr[i] + ':' + cmp.attr[i] + ';';
                }
            }
            if (s) {
                var old = element.attr('style');
                if (old) {
                    s  = old + s;
                }
                
                element.attr('style', s);
            }
            if (cmp.childs && cmp.childs.length) {
                for (var j = 0; j < cmp.childs.length; j++) {
                    compIncludeStyle(cmp.childs[j]);
                }
            }
        }
    }

    var TVisualComponent = TComponent.extend({
        _variables: {
            timer: 0,
            lockTimer: false,
            touchDuration: 1000,
        },
        _tag: 'span',
        _createElement: function(parentElement) {
            // NOTE: Added new class name for theme
            // format:
            //   theme-{Component}
            //   theme-Label

            var el = document.createElement(this._tag);
            AM.addClass(el, 'c-' + this._class + ' theme-' + this._class);
            if (this.name) {
                AM.addClass(el, 'n-' + this.name);
            }
            if (parentElement) {
                AM.ACN(parentElement, el);
            }
            this._el = el;
            if (this._onShow) {
                this._onShow();
            }
            return el;
        },
        load: function(o) {
            this.parent(o);
            if (o.data) {
                this.data = o.data;
            }
            var self = this;
            if (this.attr && this.attr['function']) {
                var i = this.attr['function'];
                if (i.f) {
                    i = i || {}
                    i._embed = i._embed || {}
                    i._embed['obj'] = self;
                    if (self.data) {
                        i._embed['data'] = self.data;
                    }
                    self._onDataValue(runFunction(i));
                } else {
                    console.log('Invalid "f" (function name).', i);
                }
            }
        },
        _onDataValue: function(v) { },
        _dataChange: function() {
            var self = this;
            if (this.data) {
                if (this.attr && this.attr.field) {
                    if (this.attr.dataset) {
                        var cttr = this.attr;
                        var lt = _Scope.componentByName(cttr['dataset']);
                        if (lt && cttr['where'] && cttr['where']['tf'] && cttr['where']['rf']) {
                            var vlu = cttr['default'];
                            if (lt.selectBy) {
                                var rslt = lt.selectBy(cttr['where']['tf'], self.data[cttr['where']['rf']], true);
                                if (rslt && rslt[cttr['field']]) {
                                    vlu = rslt[cttr['field']];
                                }
                            }
                            self._onDataValue(vlu);
                        }
                    } else {
                        if (self._onDataValue) {
                            // Get the correct value if have subfield
                            var value = '';
                            var fields = self.attr.field.split(".");
                            for (var ctr in fields) {
                                // Check if value already have value then use it
                                if (value == '') {
                                    value = self.data[fields[ctr]] ? self.data[fields[ctr]] : '';
                                } else {
                                    value = value[fields[ctr]] ? value[fields[ctr]] : '';
                                }
                            }
                            self._onDataValue(value);
                            // self._onDataValue(self.data[self.attr.field]);
                        }
                    }
                }
                if (this.childs && this.childs.length) {
                    AM.map(this.childs, function(i) {
                        i._dataChange();
                    });
                }
            }
        },
        init: function(name, parentElement) {
            this.parent(name);
            this._el = this._createElement(parentElement);
        },
        setAttr: function(attr, w) {
            this.parent(attr, w);
            if (attr['addClass']) {
                AM.addClass(this._el, attr['addClass']);
            }
            if (attr.elAttr) {
                AM.update(this._el, attr.elAttr);
            }

            // Set the background gradient
            if (attr['backgroundGradient']) {
                this._el.style.backgroundImage = attr['backgroundGradient'];
            }

            // Set the background image
            if (attr['backgroundAsset']) {
                this._el.style.backgroundImage = 'url(' + getImageUrl(attr['backgroundAsset']) + ')';
                this._el.style.backgroundRepeat = attr['backgroundRepeat'] || 'no-repeat';
            }
            
            // Set the background of border
            if (attr['borderImageSource']) {
                this._el.style.borderImageSource = 'url(' + getImageUrl(attr['borderImageSource']) + ')';
            }

            // Check if it must be hidden
            var element = $(this._el);
            if (attr['hide']) {
                element.addClass('hide');
            }

            // Check if we need to enable the sortable feature for the component
            if (attr['sortable'] && attr['sortable'] == true) {
                element.addClass('sortable');
            }
        },
        setEvent: function(ev) {
            this.parent(ev);
            var self = this;

            if (ev.click) {
                AM.AEV(this._el, 'click', function(e) {
                    self.doAction(ev.click, self);
                    $.inputClear = true;
                });
            }

            if (ev.scrollBottom) {
                AM.AEV(this._el, 'scroll', function(e) {
                    if (self._el.offsetHeight + self._el.scrollTop + 10 > self._el.scrollHeight) {
                        _doAction(ev.scrollBottom, {
                            'obj': this,
                            'input': self
                        });
                    }
                });
            }
            
            if (ev.scrollTop) {
                AM.AEV(this._el, 'scroll', function(e) {
                    if (self._el.scrollTop == 0) {
                        _doAction(ev.scrollTop, {
                            'obj': this,
                            'input': self
                        });
                    }
                });
            }
            
            if (ev.onScroll) {
                AM.AEV(this._el, 'scroll', function(e) {
                    if (self._el.scrollTop > 0 || (self._el.offsetHeight + self._el.scrollTop + 10 < self._el.scrollHeight)) {
                        _doAction(ev.onScroll, {
                            'obj': this,
                            'input': self
                        });
                    }
                });
            }
            

            if ((ev.press && ev.press.length) || (ev.longPress && ev.longPress.length)) {
                $(this._el).on('touchstart', function(e) {
                    // Press Event 
                    if (ev.press && ev.press.length) {
                        self.doAction(ev.press, self);
                    }
                    // For Long Press Event
                    if (ev.longPress && ev.longPress.length) {
                        if (self._variables.lockTimer) {
                            return;
                        }
                        self._variables.timer = setTimeout(function(){self.doAction(ev.longPress, self)}, self._variables.touchDuration);
                        self._variables.lockTimer = true;
                    }    
                    // Check if click no event
                    if (!ev.click) {
                        e.preventDefault();
                    }                 
                });

                $(this._el).on('touchend', function(e) {
                    // For Long Press Event
                    if (ev.longPress && ev.longPress.length) {
                        if (self._variables.timer) {
                            clearTimeout(self._variables.timer);
                            self._variables.lockTimer = false;
                        }
                    }
                });
            }

            // Sorting release
            if (ev.sortRelease) {
                self._el.sortRelease = {
                    'action': ev.sortRelease,
                    'object': this,
                    'data': self.data
                }
            }
        },
    });
    registerComponent(TVisualComponent, 'TVisualComponent', TComponent);

    var TVisualIcon = TVisualComponent.extend({
        _tag: 'i',
        setAttr: function(attr, w) {
            this.parent(attr, w);
            if (attr['fontSize']) this._el.style.fontSize = attr['fontSize'];
            if (attr['iconClass'].indexOf('eicon') === 0)
                AM.addClass(this._el, 'eicon ' + attr['iconClass'])
            if (attr['iconClass'].indexOf('eicon') === -1)
                AM.addClass(this._el, 'fa ' + attr['iconClass'])
        },
        _onDataValue: function(v) {
            this._el.value = v;
        }
    });
    registerComponent(TVisualIcon, 'TVisualIcon', TVisualComponent);

    /**
     * Package Component
     * Used by the service manager plugin feature of the platform
     */
    var TPackageComponent = TVisualComponent.extend({
        _createElement: function (parentElement) {
            let element = this.createElement();

            // Generate name class
            if (this.name) {
                element.className = 'n-' + this.name;
            }

            // Append to the parent
            if (parentElement) {
                parentElement.appendChild(element);
            }

            // Store the element
            this._el = element;

            return element;
        }
    });
    registerComponent(TPackageComponent, 'TPackageComponent', TVisualComponent);

    var TLabel = TVisualComponent.extend({
        _tag: 'label',
        setAttr: function(attr, w) {
            this.parent(attr, w);
            if (attr['caption']) {
                if (typeof attr['caption'] ==='string') {
                    var xCaption = attr['caption'];
                    var newCaption = xCaption.replace(/\n/g, '<br />');
                    AM.setHTML(this._el, getLangCaption(newCaption));
                } else {
                    AM.setHTML(this._el, getLangCaption(attr['caption']));
                }
            }
        },
        _onDataValue: function(v) {
            if (typeof v === 'string') {
                var newV = v ? v.replace(/\n/g, '<br />'): '';    
                AM.setHTML(this._el, newV);
            } else {
                AM.setHTML(this._el, v); 
            }
        }
    });
    registerComponent(TLabel, 'TLabel', TVisualComponent);

    /**
     * Convert the image to a proper format for the phone to display
     * 
     * @param {string} value
     */
    function convertImageURL(value) {
        if (!value.startsWith('http') && !value.startsWith('file:') && !value.startsWith('data:') && !value.startsWith('ionic:') && !value.startsWith('content')) {
            // Local Files
            value = getImageUrl(value);
        } else {
            // Other type of files
            if (isCordova()) { // Convert for wkwebview
                // Check if it's a file
                if (!value.startsWith('http')) {
                    value = window.Ionic.WebView.convertFileSrc(value);
                }
            }
        }
        return value;
    }

    /**
     * To get the default image value of the system
     */
    function getDefaultImg() {
        return getImageUrl('public/images/default.png');
    }
    
    /**
     * This will get the image url base from the url parameter. 
     * If it has 'public' at the beginning then it will return the image url with the public asset path otherwise the app path
     * 
     * @param {string} url 
     */
    function getImageUrl(url) {
        if (isCordova()) {
            return './asset/' + url;
        } else {
            // remove public from the public asset path because url already has public
            var publicPath = _baseConfig.publicAssetPath.replace(/public\//g, '');

            var baseUrl = url.indexOf('public/') === 0 ? publicPath : _baseConfig.assetPath;
            return baseUrl + url;
        }
    }

    /**
     * Image component
     */
    var TImage = TVisualComponent.extend({
        _tag: 'img',
        setAttr: function(attr, w) {
            this.parent(attr, w);
            if (attr['url']) {
                this._el.src = getImageUrl(attr['url']);
            } else if (attr['externalURL']) {
                this._el.src = attr['externalURL'];
            } else {
                this._el.src = getDefaultImg();
            }

            // Activate zoom
            if (attr['zoom']) {
                var zoom = new Zoom(this._el, {
                    pan: true,
                    rotate: true
                });
                this.attr['zoomObject'] = zoom;   
            }

            _predefImg(this._el);
        },
        _onDataValue: function(value) {
            // Check if any value passed
            if (value) {
                this._el.src = convertImageURL(value);
            } else {
                this._el.src = getDefaultImg();
            }

            // Reset zoom
            if (this.attr['zoomObject']) {
                this.attr['zoomObject'].reset();
            }
        },
        _setAnimationData: function(prm) {
            // add a helper class to avoid cloning multiple elements
            $(this._el).addClass("nOriginal-"+this.name);
            $(this._el).css("opacity", "0");
            $(this._el).css("position", "absolute");
            let clonedImage = $(".nOriginal-"+this.name).clone().insertAfter(".nOriginal-"+this.name).removeClass("nOriginal-"+this.name);
            let startPosition = prm.startPositionY || 0
            let endPosition = prm.endPositionY || 0
            let rotationDegree = prm.rotationDegree || 2
            $.keyframe.define([{
                name: this.name,
                '0%': {
                    'transform': 'translateX(0px) translateY('+startPosition+'px) scale(0) rotate(0deg)',
                    'opacity': '1'
                },
                '25%': {
                    'transform': 'translateX(7px) translateY('+(0.25*endPosition-0.75*startPosition)+'px) scale(1) rotate(-'+rotationDegree+'deg)',
                    'opacity': 0.75
                },
                '50%': {
                    'transform': 'translateX(15px) translateY('+(0.50*endPosition-0.50*startPosition)+'px) scale(1) rotate(0deg)',
                    'opacity': 0.5
                },
                '75%': {
                    'transform': 'translateX(7px) translateY('+(0.75*endPosition-0.25*startPosition)+'px) scale(1) rotate('+rotationDegree+'deg)',
                    'opacity': 0.25
                },
                '100%': {
                    'transform': 'translateX(0px) translateY('+endPosition+'px) scale(1) rotate(0deg)',
                    'opacity': 1,
                }
            }]);
            clonedImage.playKeyframe({
                name: this.name,
                duration: "3.5s",
                timingFunction: 'linear',
                complete: function(){
                    $(this).detach()
                }
            });
        }
    });
    registerComponent(TImage, 'TImage', TVisualComponent);

    /**
     * Edit component class
     */
    var TEdit = TVisualComponent.extend({
        _tag: 'input',
        setAttr: function(attr, w) {
            this.parent(attr, w);
            if (!this._el) {
                return;
            }
            var cttr = {
                'value': 'value',
                'placeHolder': 'placeHolder',
                'type': 'type',
                'minlength': 'min',
                'maxlength': 'max',
                'showCustomKeyboard':'showCustomKeyboard',
                'readonly': 'readonly',
                'disabled': 'disabled',
                'pattern':'',
                'oninput':'this.value=this.value.slice(0,this.maxLength)'
            }
            var self = this;
            AM.map(AM.keys(cttr), function(i) {
                if (attr[cttr[i]]) {
                    self._el.setAttribute(i, attr[cttr[i]]);
                }
                if (i == 'placeHolder') {
                    if (attr[cttr[i]]) {
                        self._el.setAttribute(i, getLangCaption(attr[cttr[i]]) || '');
                    }
                }
                if (i == 'disabled') {
                    if (attr[cttr[i]]) {
                        self._el.setAttribute('disabled', true);
                    }
                }
                if (i == 'oninput' && attr[cttr['maxlength']]) {
                    self._el.setAttribute(i, cttr[i]);
                }
                if (i == 'type' && attr[cttr['type']] == 'number') {
                    self._el.setAttribute('pattern', '\\d*');
                    self._el.setAttribute('step', 'any');
                }
                // Include decimal in the keyboard if iOS 
                if (isCordova()) {
                    if (device.platform == 'iOS' && i == 'type' && attr[cttr['type']] == 'number') {
                        self._el.setAttribute('type', 'text');
                        self._el.setAttribute('pattern', '[0-9]*');
                        self._el.setAttribute('decimal', 'true');
                        self._el.setAttribute('allow-multiple-decimals', 'true');
                    }
                }
            });
            this._el.name = this.name;
            var self = this;
            var sel = self._el;
            if (AM.isIn(attr['type'], ['date', 'datetime', 'datetime-local'])) {
                Object.defineProperty(sel, 'dateTimeValue', {
                    get: function() {
                        var s = sel.value;
                        if (s) {
                            return s.replace('\T', ' ');
                        }
                        return s;
                    }
                });
            }

            // To fix the bug of readonly not working for date and time fields (iOS)
            if(isCordova()){
                if (device.platform == 'iOS' && attr['readonly'] == true && AM.isIn(attr['type'], ['date', 'time', 'datetime-local'])) {
                    $(self._el).on('focus', function(ev) {
                        $(self._el).trigger('blur');
                    });
                }
            }
            // Check if it's date time picker
            if (attr['type'] == 'datetime-picker') {
                // Add datetimepicker class
                AM.addClass(self._el, 'datetimepicker');
                // Set the date time picker for jquery
                $('.datetimepicker').datetimepicker({ format: 'Y-m-d H:i:s' });
            };
        },
        _onDataValue: function(v) {
            this._el.value = v;
        },
        setEvent: function(ev) {
            this.parent(ev);
            var self = this;
            
            if (ev.change) {
                if (self._el.type === 'search') {
                    $(this._el).on('search', function(e) {
                        self.doAction(ev.change, self);
                    });
                } else {
                    $(this._el).on('change', function(e) {
                        self.doAction(ev.change, self);
                    });
                }
            }
  
            if (!self.attr.showCustomKeyboard) {
                // Changing Event
                if (ev.changing) {
                    $(this._el).on('input', function(e) {
                        self.doAction(ev.changing, self);
                    });
                }

                // Enter Event it
                if (ev.enter) {
                    $(this._el).on('keypress', function(e) {
                        // Make sure it's go or next, 9 = next and 13 = go
                        if (e.keyCode == 9 || e.keyCode == 13) {
                            self.doAction(ev.enter, self);
                        }
                    });
                }

                // Focus Event
                if (ev.focus && ev.focus.length) {
                    $(this._el).on('focus', function (e) {
                        self.doAction(ev.focus, self);
                    });
                }

                // Lost Focus Event
                if (ev.lostFocus) {
                    $(this._el).on('blur', function (e) { 
                        self.doAction(ev.lostFocus, self);
                    });
                }
            }

            if (self.attr && self.attr.pattern){
                var thePattern=self.attr.pattern;
                var x ='input[name=' + self.name + ']';
                $(x).bind('keypress', function(e) {
                    var validChars = new RegExp(thePattern);
                   
                    if (!validChars.test(e.key)){
                        return false;
                    }
                    
                });
               
            }
            if (self.attr['showCustomKeyboard']){
                var layout = '';
                if (self._el.type === 'number') {
                    layout = {
                        'normal': [
                            '1 2 3 {accept}',
                            '4 5 6 {bksp}',
                            '7 8 9 {tab}',
                            '{empty} 0 {empty} {empty}'  
                        ]
                    };
                }

                if (layout != '') {
                    $(':input[name=' + self.name + ']').keyboard({
                        language: 'customEn',
                        autoAccept: true,
                        appendLocally: true,
                        tabNavigation: true,
                        usePreview: false,
                        layout: 'custom',
                        customLayout: layout,
                        lockInput: true,
                        keyBinding : 'keyup mousedown touchstart',
                        stayOpen: true,
                        maxLength: (self.attr['max'] ? self.attr['max'] : false),
                        beforeVisible: function(e, keyboard, el) {
                            $('#wrap_' + getHash().p).addClass('page-keyboard-resize');
                            if (isCordova() && cordova) {
                                Keyboard.hide();
                            }
                        },
                        visible: function(e, keyboard, el) {
                            $('#wrap_' + getHash().p).addClass('page-keyboard-resize');
                            el.scrollIntoView(false);
                        },
                        change: function(e, keyboard, el) {
                            if (ev.changing) {
                                self.doAction(ev.changing, self);
                            }
                        },
                        beforeClose: function(e, keyboard, el, accepted, fullClose) {
                            if (fullClose) {
                                $('#wrap_' + getHash().p).removeClass('page-keyboard-resize');                                
                            }
                        },
                        gainFocus: function(e, keyboard, el) {
                            if (ev.focus) {
                                self.doAction(ev.focus, self);
                            }
                        },
                        lostFocus: function(e, keyboard, el) {
                            if (ev.lostFocus) {
                                self.doAction(ev.lostFocus, self);
                            }
                        }
                    });
                }
            }
        },
    });
    registerComponent(TEdit, 'TEdit', TVisualComponent);

    var TRadiobutton = TVisualComponent.extend({
        _tag: 'input',
        setAttr: function(attr, w) {
            this.parent(attr, w);
            if (!this._el) {
                return;
            }
            
            var cttr = {
                'value': 'value'

            }
            var cel = this._el;
            cel.type = 'radio';
            AM.ACN(cel, cel.type);

            var self = this;
            AM.map(AM.keys(cttr), function(i) {
                if (attr[cttr[i]]) {
                    self._el.setAttribute(cttr[i], attr[cttr[i]]);
                }
            });

            // Include a unique field name
            var id = '';
            if (attr.idPrefix && attr.idField) {
                if (this.data) {
                    // Get the correct field if have subfield
                    var field = '';
                    var data = this.attr.idField.split(".");
                    for (var i in data) {
                        // Check if field already have data then use it
                        if (field == '') {
                            field = this.data[data[i]];
                        } else {
                            field = field[data[i]];
                        }
                    }
                    id = this.attr.idPrefix + field;
                }
            }

            this._el.name = this.name + id;
        },
        _onDataValue: function(v) {
            if (v == 'true' || v == true) {
                this._el.checked = true;
            } else {
                this._el.checked = false;
            }
        },
        setEvent: function(ev) {
            this.parent(ev);
            var self = this;
            if (ev.change) {
                $(this._el).on('change', function(){
                    self.doAction(ev.change, self);
                });
            }
        }
    });
    registerComponent(TRadiobutton, 'TRadiobutton', TVisualComponent);

    var TCheckbox = TVisualComponent.extend({
        _tag: 'input',
        setAttr: function(attr, w) {
            this.parent(attr, w);
            if (!this._el) {
                return;
            }
            var cttr = {
                'value': 'value',
                'checked': 'checked',
                'disabled': 'disabled'
            }
            var cel = this._el;
            cel.type = 'checkbox';
            AM.ACN(cel, cel.type);

            var self = this;
            AM.map(AM.keys(cttr), function(i) {
                if (attr[cttr[i]]) {
                    var val = attr[cttr[i]];
                    if (cttr[i] == 'checked') {
                        self._el.checked = (val == 'true' || val == true || val == 'checked') ? true : false;
                    } else {
                        self._el.setAttribute(cttr[i], val);
                    }
                }
            });
            this._el.name = this.name;
        },
        _onDataValue: function(v) {
            if (v == 'true' || v == true) {
                this._el.checked = true;
            } else {
                this._el.checked = false;
            }
        },
        setEvent: function(ev) {
            this.parent(ev);
            var self = this;
            if (ev.change) {
                AM.AEV(this._el, 'change', function(e) {
                    self.doAction(ev.change, self);
                });
            }
        }
    });
    registerComponent(TCheckbox, 'TCheckbox', TVisualComponent);

    //end of aris edit
    var TMemo = TVisualComponent.extend({
        _tag: 'textarea',
        setAttr: function(attr, w) {
            this.parent(attr, w);
            if (!this._el) {
                return;
            }
            var cttr = {
                'value': 'value',
                'placeHolder': 'placeholder',
                'cols': 'cols',
                'rows': 'rows',
                'readonly': 'readonly',
                'disabled': 'disabled',
            }
            for (var i in cttr) {
                if (attr[i]) {
                    this._el[cttr[i]] = attr[i];
                }

                if (i == 'readonly') {
                    if (attr[cttr[i]]) {
                        this._el.setAttribute('readonly', true);
                    }
                }
                if (i == 'disabled') {
                    if (attr[cttr[i]]) {
                        this._el.setAttribute('disabled', true);
                    }
                }
            }
            this._el.name = this.name;
        },
        _onDataValue: function(v) {
            this._el.value = v;
        },
         setEvent: function(ev) {
            this.parent(ev);
            var self = this;
            if (ev.change) {
                AM.AEV(this._el, 'change', function(e) {
                    self.doAction(ev.change, self);
                });
            }

            if (ev.changing) {
                $(this._el).on('input', function(e) {
                    self.doAction(ev.changing, self);
                });
            }

            if (ev.lostFocus) {
                $(this._el).on('blur', function (e) {
                    self.doAction(ev.lostFocus, self);
                });
            }
        }
    });
    registerComponent(TMemo, 'TMemo', TVisualComponent);

    var TComboBox = TVisualComponent.extend({
        _tag: 'select',
        _value: null,
        setAttr: function(attr, w) {
            this.parent(attr, w);
            if (!this._el) {
                return;
            }
            var cttr = {
                'value': 'value',
                'type': 'type'
            }
            var self = this;
            AM.map(AM.keys(cttr), function(i) {
                if (attr[cttr[i]]) {
                    self._el.setAttribute(cttr[i], attr[cttr[i]]);
                }
            });
            this._el.name = this.name;

            if (attr.options) {
                this.options = attr.options;
            }
            this.reload();
            this._el.value = attr.value;
        },
        _onDataValue: function(v) {
            this._value = v;
            for (var i = 0; i < this._el.options.length; i++) {
                if (this._el.options[i].value == v) {
                    this._el.options[i].selected = true;
                } else {
                    this._el.options[i].selected = false;
                }
            }
        },
        reload: function() {
            AM.RCN(this._el);
            var self = this;
            if (this.options) {
                if (AM.isArray(this.options)) {
                    AM.map(this.options, function(i, j) {
                        AM.ACN(self._el, AM.OPTION(i));
                    });
                } else if (AM.isObject(this.options)) {
                    for (var i in this.options) {
                        AM.ACN(this._el, AM.OPTION({
                            value: i
                        }, this.options[i]));
                    }
                }
            }
            AM.AEV(this._el, 'change', function(e) {
                self._value = self._el.value;
            });
        },
        //load:function(o,parentElement){
        //  this.parent(o,parentElement);
        //  if (o.items) {
        //      this.items=o.items;
        //  }
        //  this.reload();
        //},
        setEvent: function(ev) {
            this.parent(ev);
            var self = this;
            if (ev.change) {
                AM.AEV(this._el, 'change', function(e) {
                    self.doAction(ev.change, self);
                });
            }
        },
    });
    registerComponent(TComboBox, 'TComboBox', TVisualComponent);

    var TButton = TVisualComponent.extend({
        _tag: 'a',
        setAttr: function(attr, w) {
            this.parent(attr, w);
            //if(attr['caption']){
            //  AM.setHTML(this._el,attr['caption']);
            //}
            var cel = this._el;
            if (!cel.caption) {
                cel.caption = AM.SPAN({
                    c: 'ca-caption'
                });
                AM.ACN(cel, cel.caption);
            }
            if (attr['icon']) {
                cel.icon = AM.SPAN({
                    c: 'ca-icon'
                });
                AM.addClass(cel.icon, 'icn-' + attr['icon']); //cel.icon.src=_baseConfig.assetPath+cttr['icon'];
                AM.ATT(cel, cel.icon);
            }
            if (attr['iconImg']) {
                cel.icon = AM.IMG({
                    c: 'ca-icon'
                });
                cel.icon.src = getImageUrl(attr['iconImg']);
                if (isCordova() && attr['saveAsset'] == 'iconImg') {
                    cel.icon.src = './asset/' + attr['iconImg'];
                }
                AM.ATT(cel, cel.icon);
                _predefImg(cel.icon);
            }
            if (attr['caption']) {
                AM.setHTML(cel.caption, getLangCaption(attr['caption']));
            }
            if (attr['iconPos']) {
                AM.addClass(cel, 'iconpos-' + attr['iconPos']);
            }
        },
        _onDataValue: function(v){
            // Set the button label
            this._el.innerText = v;
        }
    });
    registerComponent(TButton, 'TButton', TVisualComponent);

    var TTableUploader = TVisualComponent.extend({
        _tag: 'span',
        _cbid: 0,
        autoUpload: false,
        ev: {
            success: [],
            error: []
        },
        setAttr: function(attr, w) {
            var self = this;
            this.parent(attr, w);
            if (!this._cbid) {
                this._cbid = makeId();
            }
            if (attr['autoUpload']) {
                this.autoUpload = attr['autoUpload'];
            }
            if (attr['tableName']) {
                this.tableName = attr['tableName'];
            }
            var cel = this._el;
            if (!cel.form) {
                cel.form = AM.FORM({
                    target: 'ifrm_' + this.name,
                    method: 'post',
                    enctype: 'multipart/form-data',
                    style: 'display:inline-block; width:100%; height:100%; display:none;'
                });
                AM.ACN(cel, cel.form);
                if (!cel.finput) {
                    cel.finput = AM.INPUT({
                        type: 'file',
                        name: 'file',
                        style: 'display:none'
                    });
                    AM.ACN(cel.form, cel.finput);
                }
            }
            if (!cel.vframe) {
                cel.vframe = AM.IFRAME({
                    name: 'ifrm_' + this.name,
                    style: 'position:absolute; border:none; top:-100px;padding:0; margin:0; height:1px; width:0px; overflow:hidden;'
                });
                AM.ACN(cel, cel.vframe);
            }
            if (!cel.caption) {
                cel.caption = AM.SPAN({
                    c: 'ca-caption'
                });
                AM.ACN(cel, cel.caption);
            }
            if (attr['icon']) {
                cel.icon = AM.SPAN({
                    c: 'ca-icon'
                });
                AM.addClass(cel.icon, 'icn-' + attr['icon']); //cel.icon.src=_baseConfig.assetPath+cttr['icon'];
                AM.ATT(cel, cel.icon);
            }
            var rprm = {
                appid: _baseConfig.appid,
                api: 'table',
                a: 'upload',
                tbl_name: this.tableName,
                rslttp: 'js',
                fcb: 'window.top.uplcb' + self._cbid
            };
            cel.vframe.setAttribute('name', 'ifrm_' + this.name);
            //cel.vframe.setAttribute('id','ifrm-'+this.name);
            //cel.form.setAttribute('target','ifrm_'+this.name);
            cel.form.setAttribute('action', _baseConfig.appmainhost + "?" + AM.queryArguments(rprm));
            if (attr['caption']) {
                AM.setHTML(cel.caption, getLangCaption(attr['caption']));
            }
            if (attr['iconPos']) {
                AM.addClass(cel, 'iconpos-' + attr['iconPos']);
            }
            cel.onclick = function() {
                cel.finput.click();
            }
            cel.finput.onchange = function() {
                var fn = cel.finput.value.split(/(\\|\/)/g).pop();
                if (self.autoUpload) {
                    cel.form.submit();
                }
                console.log(fn);
            }
            window['uplcb' + self._cbid] = function(o) {
                self._uploadCb(o);
            }
        },
        upload: function() {
            this._el.form.submit();
        },
        _uploadCb: function(o) {
            var self = this;
            var ebd = {};

            function _success(rslt) {
                if (self.ev.success) {
                    _doAction(self.ev.success, {
                        'obj': self,
                        'input': rslt
                    });
                }
            }

            function _error(e) {
                if (self.ev.error) {
                    _doAction(self.ev.error, {
                        'obj': self,
                        'input': e
                    });
                }
            }
            if (o && o.s) {
                _success(o.dt || {});
            } else if (o && o.err) {
                _error({
                    message: AM.values(o.err).join('. ')
                });
            } else {
                _error({
                    message: 'unknown error'
                });
            }
        }
    });
    registerComponent(TTableUploader, 'TTableUploader', TVisualComponent);

    /**
     *  Chart - Component
     */
    var TChart = TVisualComponent.extend({
        _tag: 'div',
        _chart: null,
        setAttr: function(attr, w) {
            this.parent(attr, w);
            AM.update(this.attr, attr);
        },
        _onDataValue: function(v) {
            this.attr.data = v;
            this.show();
        },
        // Display the Chart
        show: function() {
            var self = this;
            if (!self._el || !self.attr.data || !AM.isObject(self.attr.data)) {
                return;
            }
            var data = self.attr.data;
            data.bindto = self._el;
            self._chart = c3.generate(data);
        }
    });

    registerComponent(TChart, 'TChart', TVisualComponent);

    /**
     *  Generate the chart data
     */
    function chartGenerateData(type, prm) {
        if (!prm.data) {
            return;
        }

        var data = {};
        var ctr, ctr1;
    
        // Fill up the data object
        data.data = {};

        data.data.type = type;

        if (prm.dataCaptions) {
            var captions = dataToArray(prm.dataCaptions);
            var captionsObject = {};
            for (ctr = 0; ctr < captions.length; ctr++) { 
                captionsObject['data' + (ctr + 1)] = captions[ctr];
            }
            data.data.names = captionsObject;
        }

        // Cater for different scenario of data
        if (prm.data) {
            var graphData = dataToArray(prm.data);
            var graphDataObject = [];
            var record = [];
            var singleRecord = [];
            singleRecord.push('data1');
            for (ctr = 0; ctr < graphData.length; ctr++) { 
                if (!AM.isArray(graphData[ctr])) {
                    singleRecord.push(graphData[ctr]);
                    continue;
                }
                record = [];
                record.push('data' + (ctr + 1));
                for (ctr1 = 0; ctr1 < graphData[ctr].length; ctr1++) { 
                    record.push(graphData[ctr][ctr1]);
                }
                graphDataObject.push(record);
            }
            if (singleRecord.length > 1) {
                graphDataObject.push(singleRecord);
            }
            data.data.columns = graphDataObject;
        }

        if (prm.dataColors) {
            var colors = dataToArray(prm.dataColors);
            var colorsObject = {};
            for (ctr = 0; ctr < colors.length; ctr++) { 
                colorsObject['data' + (ctr + 1)] = colors[ctr];
            }
            data.data.colors = colorsObject;
        }

        if (prm.barRatio) {
            data.data.bar = { 'width' : { 'ratio' : prm.barRatio } };
        }

        if (prm.showLabel) {
            data.data.labels = true;
        }

        // Fill up the axis object
        data.axis = {};

        if (prm.xCaption || prm.xCategories) {
            data.axis.x = {};
            if (prm.xCaption) {
                data.axis.x.label = prm.xCaption;
            }
            if (prm.xCategories) { 
                data.axis.x.type = 'category';
                data.axis.x.categories = dataToArray(prm.xCategories);
            }

            if (type == 'scatter') {
                data.axis.x.tick = { 'fit': false };
            }
        }

        if (prm.yCaption) {
            data.axis.y = { 'label' : prm.yCaption };
        }

        // Check for any rotation properties
        if (prm.rotate) {
            data.axis.rotated = true;
        }

        // Fill up the zoom object if enabled
        if (prm.zoom) {
            data.zoom = { 'enabled' : true };
        }

        // Fill up extra
        if (type == 'donut' && prm.title) {
            data.donut = { 'title': prm.title };
        }

        if (type == 'gauge' && prm.title) {
            data.color = {
                pattern: ['#FF0000', '#F97600', '#F6C600', '#60B044'],
                threshold: {
                    values: [30, 60, 90, 100]
                }
            };
        }

        if (prm.height) {
            data.size = { 'height' : prm.height };
        }

        return data;        
    }

    /**
     *  Generate the chart data
     */
    function dataToArray(data) {
        if (AM.isArray(data)) {
            return data;
        } 
        var result = [];
        result.push(data);
        return result;
    }

    /**
     * Generate the barcode
     * @param {canvas} canvas
     * @param {string} prm 
     */
    function drawBarcode(canvas, prm) {
        // Prepare some data for sizing
        const scale = (!isNaN(parseInt(prm.width)) ? parseInt(prm.width) : 2);
        const fontSize = (!isNaN(parseInt(prm.fontSize))? parseInt(prm.fontSize) : 20);
        const mmToPixelFactor = (72 / 25.4) * scale; // 72 dpi / 25.4 mm/in
        const textSizeOffset = fontSize / 5; // to adjust for custom textfont monospace

        // Prepare the barcode type
        let type = (prm.type ? prm.type : "code128");
        type = type.toLowerCase().replace(/-/g, "");

        // Prepare the font options
        var fontOptions = '';
        if (prm.bold) {
            fontOptions += 'bold';
        }
        if (prm.italic) {
            fontOptions += (fontOptions ? ' italic' : 'italic');
        }

        // Prepare the options
        const options = {
            bcid: type,
            text: prm.value, // Text to encode
            textsize:  (fontSize - textSizeOffset) / scale,
            alttext: prm.text ? prm.text : "",
            scale: scale, // Scaling factor
            height: (!isNaN(parseInt(prm.height)) ? parseInt(prm.height) : 100) / mmToPixelFactor, // Bar height, in millimeters
            padding: (!isNaN(parseInt(prm.margin)) ? parseInt(prm.margin) : 10) / scale,
            includetext: (typeof prm.displayText == "boolean" ? prm.displayText : true), // Show human-readable text
            textxalign: (prm.textAlign ? prm.textAlign : 'center'), // Always good to set this
            textfont: fontOptions || 'monospace', // Use the custom font
            backgroundcolor: "FFFFFF",
        }
        bwipjs.toCanvas(canvas, options);
    }

    // Barcode
    var TBarcode = TVisualComponent.extend({
        _tag: 'div',
        getEl: function() {
            var cel = this._el;
            if (!cel.canvas) {
                cel.canvas = document.createElement('canvas');
                if (this.attr.height) {
                    cel.canvas.style.height = this.attr.height;
                }
                if (this.attr.width) {
                    cel.canvas.style.width = this.attr.width;
                }
                AM.ACN(cel, cel.canvas);
            }
            return cel;
        },
        setAttr: function(attr, w) {
            this.parent(attr, w);
            var cel = this.getEl();
            var format = {};
            if (attr['value']) {
                cel.value = attr['value'];
            }
            if (attr['type']) {
                format.type = attr['type'];
            }
            if (attr['fontSize']) {
                format.fontSize = attr['fontSize'];
            }
            if (attr['color']) {
                format.lineColor = attr['color'];
            }
            if (attr['displayText']) {
                format.displayValue = true;
            } else {
                format.displayValue = false;
            }
            cel.format = format;
            this.show();
        },
        _onDataValue: function(v) {
            var cel = this.getEl();
            cel.value = v;
            this.show();
        },
        show: function() {
            var cel = this.getEl();
            var prm = {
                ...cel.format, 
                value: cel.value, 
                displayText: cel.format.displayValue
            };
            var canvas = cel.canvas;

            // Generate barcode
            drawBarcode(canvas, prm);
        }
    });
    registerComponent(TBarcode, 'TBarcode', TVisualComponent);

    var TDatePicker = TVisualComponent.extend({
        _tag: 'input',
        _picker: null,
        setAttr: function(attr, w) {
            this.parent(attr, w);
            if (!this._el) {
                return;
            }
            var cttr = {
                'value': 'value',
                'placeHolder': 'placeHolder',
                'format': 'd-m-Y',
                'minDate': 'minDate',
                'maxDate': 'maxDate',
                'firstDay': 'firstDay',
                'date':'date'
            }
            var self = this;
            AM.map(AM.keys(cttr), function(i) {
                if (attr[cttr[i]]) {
                    self._el.setAttribute(cttr[i], attr[cttr[i]]);
                }
            });
            self._el.setAttribute('id', self.name);
            self._el.name = self.name;

            var fd = self.attr.firstDay ? self.attr.firstDay : true;
            var field = document.getElementById(self._el.id);

            if (!self._picker) {
                self._picker = new Pikaday({
                    firstDay: fd,
                    maxDate: self.attr.maxDate ? emobiqApp.addDate(self.attr.maxDate, new Date()) : null,
                    minDate: self.attr.minDate ? emobiqApp.addDate(self.attr.minDate, new Date()) : null,
                    field: field,
                    onSelect: function() {
                        if (self._picker) {
                            field.date = self._picker._d;
                            if (self.attr && self.attr.format) {
                                field.value = emobiqApp.formatDate(self.attr.format, self._picker._d);
                            } else {
                                field.value = emobiqApp.formatDate('d-m-Y', self._picker._d);
                            }
                        }
                    }
                });
            } else {
                self._picker.setMinDate(self.attr.minDate ? emobiqApp.addDate(self.attr.minDate, new Date()) : null);
                self._picker.setMaxDate(self.attr.maxDate ? emobiqApp.addDate(self.attr.maxDate, new Date()) : null);
            }
        },
        _onDataValue: function(v) {
            var self = this;
            setTimeout(function() {
                if (self.attr && self.attr.format) {
                    self._el.value = emobiqApp.formatDate(self.attr.format, v);
                    self._picker.setDate(v, false);
                } else {
                    self._el.value = emobiqApp.formatDate('d-m-Y', v);
                    self._picker.setDate(v, false);
                }
            }, 100);
        },
        setEvent: function(ev) {
            this.parent(ev);
            var self = this;
            if (ev.change) {
                AM.AEV(this._el, 'change', function(e) {
                    self.doAction(ev.change, self);
                });
            }
        }
    });
    registerComponent(TDatePicker, 'TDatePicker', TVisualComponent);

      var TDateTimePicker = TVisualComponent.extend({
        _tag: 'input',
        setAttr: function(attr, w) {
            this.parent(attr, w);
            if (!this._el) {
                return;
            }
            var cttr = {
                'value': 'value',
                'placeHolder': 'placeHolder',
                'format': 'h:i A',
                'interval':'30',
                'min':null,
                'max':null

                
            }
            var self = this;
            AM.map(AM.keys(cttr), function(i) {
                if (attr[cttr[i]]) {
                    self._el.setAttribute(cttr[i], attr[cttr[i]]);
                }
            });
            self._el.setAttribute('id', this.name);
            this._el.name = this.name;
            var self = this;
            var field = document.getElementById(self._el.id);
            $('#'+this._el.id).pickatime({
                interval:self.attr.interval?self.attr.interval:60,
                format:self.attr.format?self.attr.format:'h:i A',
                max:10
            });
            

            // var picker = new Pikaday({
            //     firstDay: fd,
            //     minDate: self.attr.minDate ? emobiqApp.addDate(self.attr.minDate, new Date()) : null,
            //     field: field,
            //     onSelect: function() {
            //         // console.log(picker._d);
            //         if (self.attr && self.attr.format) {
            //             field.value = emobiqApp.formatDate(self.attr.format, picker._d);
            //         } else {
            //             field.value = emobiqApp.formatDate('d-m-Y', picker._d);
            //         }
            //     }

            // });
            // field.parentNode.insertBefore(picker.el, field.nextSibling);

        },
        _onDataValue: function(v) {
            this._el.value = v;
        },
        setEvent: function(ev) {
            this.parent(ev);
            var self = this;
            if (ev.change) {
                AM.AEV(this._el, 'change', function(e) {
                    self.doAction(ev.change, self);
                });
            }
        }
    });
    registerComponent(TDateTimePicker, 'TDateTimePicker', TVisualComponent);
    
    /**
     * Generate the qr code
     * @param {canvas} canvas
     * @param {string} text 
     * @param {string} logo - base64
     * @param {function} callback 
     */
    function drawQR(canvas, text, logo, callback) {
        // Store the height and width
        let height = canvas.style.height;
        let width = canvas.style.width;

        // Generate the qr code
        qrcodelib.toCanvas(canvas, text, function() {});

        // Update the size
        canvas.style.height = height;
        canvas.style.width = width;

        // Check if logo is needed
        if (!logo) {
            // Check callback
            if(callback) {
                callback(canvas.toDataURL());
            }
            return;
        }

        // Generate the logo in a canvas
        var ctx = canvas.getContext("2d");
        var image = new Image();
        image.onload = function () {
            // Draw the logo in the main canvas
            const logoScale = 0.2
            const logoWidth = canvas.width * logoScale;
            const logoHeight = canvas.height * logoScale;
            ctx.drawImage(image, (canvas.width - logoWidth) / 2, (canvas.height - logoHeight) / 2, logoWidth, logoHeight);

            // Check callback
            if(callback) {
                callback(canvas.toDataURL());
            }
        };
        image.src = logo;
    }

    var TQRCode = TVisualComponent.extend({
        _tag: 'div',
        getEl: function() {
            var cel = this._el;
            if (!cel.canvas) {
                cel.canvas = document.createElement('canvas');
                if (this.attr.height) {
                    cel.canvas.style.height = this.attr.height;
                }
                if (this.attr.width) {
                    cel.canvas.style.width = this.attr.width;
                }
                AM.ACN(cel, cel.canvas);
            }
            return cel; 
        },
        setAttr: function(attr, w) {
            this.parent(attr, w);
            var cel = this.getEl();
            if (attr['value']) {
                cel.value = attr['value'];
            }
            this.show();
        },
        _onDataValue: function(v) {
            var cel = this.getEl();
            cel.value = v;
            this.show();
        },
        show: function() {
            var cel = this.getEl();
            drawQR(cel.canvas, cel.value, this.attr.logo);
        }
    });

    registerComponent(TQRCode, 'TQRCode', TVisualComponent);
    // end of aris edit
    // tWebComponent

    var TWebFrame = TVisualComponent.extend({
        _tag: 'iframe',
        setAttr: function(attr, w) {
            this._el.name = this.name;
            this.parent(attr, w);
            if (attr['url']) {
                this._el.src = attr['url'];
            }
        },
        _onDataValue: function(v) {
            this._el.src = v;
        }
    });
    registerComponent(TWebFrame, 'TWebFrame', TVisualComponent);

    // end of twebcomponent
    
    // TStreamCamera

    var TStreamCamera = TVisualComponent.extend({
        _tag: 'div',
        setAttr: function(attr, w) {
            this.parent(attr, w);
            if (attr['outputUrl']) {
                this._el.value = attr['outputUrl'];
            }
        },
        _onDataValue: function(v) {
            this._el.value = v;
        }
    });
    registerComponent(TStreamCamera, 'TStreamCamera', TVisualComponent);

    // end of TStreamCamera
    
    // TStreamPlayer

    var TStreamPlayer = TVisualComponent.extend({
        _tag: 'div',
        setAttr: function(attr, w) {
            this.parent(attr, w);
            if (attr['inputUrl']) {
                this._el.value = attr['inputUrl'];
            }
        },
        _onDataValue: function(v) {
            this._el.value = v;
        }
    });
    registerComponent(TStreamPlayer, 'TStreamPlayer', TVisualComponent);

    // end of TStreamPlayer

    /* source:lib/components/visual/container.js */

    var containerLoad = function(o, obj, startIdx, childPlace, callback, snippet) {
        startIdx = startIdx || 0;
        childPlace = childPlace || '_el';
        if (obj && !startIdx) {
            obj.attr = obj.attr || {};
            if (o.attr) {
                obj.attr = AM.update(obj.attr, o.attr);
                if (obj.setAttr) {
                    obj.setAttr(o.attr);
                }
            }
            if (o.data) {
                obj.data = o.data;
            }
            if (obj.clearChilds) {
                obj.clearChilds();
            }
        }
        if (o.childs) {
            var pel = obj[childPlace];
            AM.map(o.childs, function(i) {
                if (i.t && _Components[i.t]) {
                    var comp = new _Components[i.t].cf(i.name, pel);
                    comp.data = i.data || o.data || obj.data;
                    comp.loadAttr(i);
                    if (snippet) {
                        comp.snippet = snippet;
                    }
                    if (_Scope && _Scope.addComponent) {
                        _Scope.addComponent(comp);
                    }
                    var el = comp._el || false;
                    if (obj) {
                        obj.childs = obj.childs || [];
                        obj.childs.push(comp);
                    }
                    comp.load(i, el, snippet);
                    comp._dataChange();
                } else if (i.t) {
                    console.log('component "' + i.t + '" not registered');
                } else {
                    console.log('invalid component type (t)', i);
                }
            });
        }
        // Check if it's a dataset
        if (obj._dataset && callback !== undefined) {
            callback(obj._dataset);
        }
    }

    var TContainer = TVisualComponent.extend({
        childs: [],
        load: function(o, parentElement, snippet) {
            this.parent(o);
            //console.log('this.childPlace==>',this.childPlace);
            containerLoad(o, this, 0, this.childPlace || null, undefined, snippet);
        },
        init: function(name, parentElement) {
            this.parent(name, parentElement);
        }
    });
    registerComponent(TContainer, 'TContainer', TVisualComponent);

    var TListContainer = TContainer.extend({
        items: [],
        addOnNextLoad: false,
        setItems: function(dt, add, topScroll, callback) {
            var self = this;
            var updateStart = 0;
            self.items = self.items || [];
            if (add) {
                dt = dt || [];
                updateStart = self.items.length;
                self.items = self.items.concat(dt);
            } else {
                // Set the scroll bar to the top
                if (topScroll) {
                    self._el.scrollTop = 0;                    
                }
                // Set the data
                self.items = dt || [];
            }
            self.preLoad(updateStart, callback);
        },
        preLoad: function(strt, callback) {
            strt = strt || 0;
            var o = {
                childs: []
            };
            var self = this;
            if (self.itemAltAttr) {
                var cla = self.itemAltAttr['class'] || 'odd';
                var modu = parseInt(self.itemAltAttr['mod'] || 2);
            }
            AM.filter(self.items || [], function(i, j) {
                var io = {
                    name: self.name + '-item',
                    childs: self.itemChilds,
                    ev: self.itemEv,
                    t: 'TContainer',
                    data: i
                };
                io.attr = clone(self.itemAttr || {});
                if (self.itemAltAttr && ((j % modu) == (modu - 1))) {
                    io.attr['addClass'] = cla;
                }
                o.childs.push(io);
            }, strt);
            // Check if it contains any snippet
            var snippet = false;
            if (self.snippet) {
                snippet = self.snippet;
            }
            containerLoad(o, self, strt, null, callback, snippet);
            fontObject.fontSizeInit();
        },
        load: function(o, parentElement, snippet) {
            this.parent(o);
            this.clearChilds();
            this.itemChilds = o.itemChilds;
            this.itemAttr = o.itemAttr;
            this.itemAltAttr = o.itemAltAttr;
            this.itemEv = o.itemEv;
            this.addOnNextLoad = o.addOnNextLoad || false;
            if (o.items) {
                this.items = o.items;
            }
            this.preLoad(undefined, undefined, snippet);
        },
        init: function(name, parentElement) {
            this.parent(name, parentElement);
        }
    });
    registerComponent(TListContainer, 'TListContainer', TContainer);

    var TPageList = TListContainer.extend({
        itemChilds: [],
        items: [],
        setAttr: function(attr, w) {
            this.parent(attr, w);
            if (attr['page']) {
                var self = this;
                getService('page_value', {
                    tpl_name: attr['page']
                }, function(oo) {
                    if (oo.dt) {
                        self.items = oo.dt;
                        self.reload();
                    }
                });
            }
        },
        init: function(name, parentElement) {
            this.parent(name, parentElement);
        }
    });
    registerComponent(TPageList, 'TPageList', TListContainer);

    var TRowContainer = TListContainer.extend({
        itemChilds: [],
        items: [],
        _loadTimer: null,
        remove: function() {
            if (this._dataset && this._dataset.removeListener) {
                this._dataset.removeListener(this);
            }
            this.parent();
        },
        setAttr: function(attr, w) {
            this.parent(attr, w);
            var self = this;
            self.autoLoad = attr.autoLoad || false;
            if (attr['dataset']) {
                self.dataset = attr['dataset'];
                var ds = _Scope.componentByName(attr['dataset']);
                if (ds && ds.addListener) {
                    self._dataset = ds;
                    ds.addListener(self);
                    if (attr['datasetParams']) {
                        ds.setParam(attr['datasetParams']);
                    }
                    if (self.autoLoad) {
                        clearTimeout(self._loadTimer);
                        self._loadTimer = setTimeout(function() {
                            self._dataset.loadData();
                        }, 10);
                    }
                }
            }
            if (!attr['sortable'] || !attr['sortable'] == true) {
                $(this._el).addClass('initial-sortable-false');
            }
        },
        init: function(name, parentElement) {
            this.parent(name, parentElement);
            $(this._el).addClass("sortable")
        }
    });
    registerComponent(TRowContainer, 'TRowContainer', TListContainer);

    var TSnippet = TContainer.extend({
        load: function(o, parentElement) {
            this.parent(o);
            // Because snippet is being overwritten @TODO - Fix It
            if (this.attr.loadSnippet) {
                this.attr.snippet = this.attr.loadSnippet;
            }
            this.display();
        },
        init: function(name, parentElement) {
            this.parent(name, parentElement);
        },
        _onDataValue: function(v) {
            this.attr.snippet = v;
            this.attr.loadSnippet = v; // Because snippet is being overwritten @TODO - Fix It
            this.display();
        },
        display: function() {
            var cttr = this.attr;
            var self = this;
            if (cttr['snippet']) {
                if (typeof(_snippet) != 'undefined' && _snippet[cttr['snippet']]) {
                    var odt = clone(_snippet[cttr['snippet']]);
                    self._el.id = 'snippet_' + cttr['snippet'];
                    containerLoad(odt, self);
                }
            }
        }
    });
    registerComponent(TSnippet, 'TSnippet', TContainer);

    var TPanel = TContainer.extend({
        init: function(name, parentElement) {
            this.parent(name, parentElement);
        }
    });
    registerComponent(TPanel, 'TPanel', TContainer, 'Standard');

    var TForm = TContainer.extend({
        _tag: 'form',
        init: function(name, parentElement) {
            this.parent(name, parentElement);
        }
    });
    registerComponent(TForm, 'TForm', TContainer, 'Standard');

    /* source:lib/components/foundation/fcontainer.js */


    //var TFContainer=TVisualComponent.extend({
    //    childs:[],
    //    load:function(o,parentElement){
    //        this.parent(o);
    //        containerLoad(o,this);
    //    },
    //    init:function(name,parentElement){
    //        this.parent(name,parentElement);
    //    }
    //});

    /** foundation 6 start */
    var TCallout = TContainer.extend({
        _tag: 'div',
        init: function(name, parentElement) {
            this.parent(name, parentElement);
        },
        setAttr: function(attr, w) {
            var cel = this._el;
            if (attr['ColoringStyle']) {
                //console.log('==>',attr['ColoringStyle']);
                AM.addClass(cel, attr['ColoringStyle']);
            }
        },
        _createElement: function(parentElement) {
            var el = this.parent(parentElement);
            AM.addClass(el, 'callout');
            return el;
        },
    });
    registerComponent(TCallout, 'TCallout', TCallout, 'FoundationContainer');

    var TFButtonGroup = TContainer.extend({
        _tag: 'div',
        setAttr: function(attr, w) {
            var cel = this._el;
            if (attr['ColoringStyle']) {
                AM.addClass(cel, attr['ColoringStyle']);
            }
            if (attr['Sizing']) {
                AM.addClass(cel, attr['Sizing']);
            }
        },
        init: function(name, parentElement) {
            this.parent(name, parentElement);
        },
        _createElement: function(parentElement) {
            var el = this.parent(parentElement);
            AM.addClass(el, 'button-group');
            return el;
        }
    });
    registerComponent(TFButtonGroup, 'TFButtonGroup', TFButtonGroup, 'FoundationContainer');

    var TButtonChild = TContainer.extend({
        _tag: 'a',
        setAttr: function(attr, w) {
            var cel = this._el;
            if (!cel.caption) {
                cel.caption = AM.SPAN({
                    c: 'ca-caption'
                });
                AM.ACN(cel, cel.caption);
            }
            if (attr['caption']) {
                AM.setHTML(cel.caption, getLangCaption(attr['caption']));
            }
            if (attr['ColoringStyle']) {
                AM.addClass(cel, attr['ColoringStyle']);
            }
        },
        init: function(name, parentElement) {
            this.parent(name, parentElement);
        },
        _createElement: function(parentElement) {
            var el = this.parent(parentElement);
            AM.addClass(el, 'button');
            return el;
        }
    });
    registerComponent(TButtonChild, 'TButtonChild', TButtonChild, 'FoundationContainer');

    var TAccordionItem = TContainer.extend({
        _tag: 'li',
        getEl: function() {
            var cel = this._el;
            if (!cel.ttl) {
                cel.ttl = document.createElement('a');
                AM.ACN(cel, cel.ttl);
                AM.addClass(cel.ttl, 'accordion-title');
                cel.ttl.innerHTML = 'Header';
            }
            //console.log('cell satu=>',cel.cnt);
            if (!cel.cnt) {
                cel.cnt = document.createElement('div');
                AM.addClass(cel.cnt, 'accordion-content');
                cel.cnt.setAttribute('data-tab-content', '');
                //cel.cnt.innerHTML='<div>Ini isinya</div>';
                AM.ACN(cel, cel.cnt);
            }
            //console.log('cell satu=>',cel.cnt);
            this.cnt = cel.cnt;
            return cel;
        },
        childPlace: 'cnt',
        setAttr: function(attr, w) {
            this.parent(attr, w);
            var cel = this.getEl();
            if (attr['title']) {
                cel.ttl.innerHTML = attr['title'];
            }
        },
        init: function(name, parentElement) {
            this.parent(name, parentElement);
        },
        _createElement: function(parentElement) {
            var el = this.parent(parentElement);
            AM.addClass(el, 'accordion-item');
            this.getEl();
            return el;
        }
    });
    registerComponent(TAccordionItem, 'TAccordionItem', TAccordionItem, 'FoundationContainer');

    var TAccordion = TContainer.extend({
        _tag: 'ul',
        init: function(name, parentElement) {
            this.parent(name, parentElement);
        },
        _createElement: function(parentElement) {
            var el = this.parent(parentElement);
            AM.addClass(el, 'accordion');
            el.setAttribute('data-accordion', '');
            el.setAttribute('role', 'tablist');
            return el;
        },
    });
    registerComponent(TAccordion, 'TAccordion', TAccordion, 'FoundationContainer');

    var TFTabs = TContainer.extend({
        _tag: 'div',
        init: function(name, parentElement) {
            this.parent(name, parentElement);
        },
        _createElement: function(parentElement) {
            var el = this.parent(parentElement);
            AM.addClass(el, 'expanded row');
            return el;
        }
    });
    registerComponent(TFTabs, 'TFTabs', TFTabs, 'FoundationContainer');

    var TTabsUl = TContainer.extend({
        _tag: 'ul',
        init: function(name, parentElement) {
            this.parent(name, parentElement);
        },
        _createElement: function(parentElement) {
            var el = this.parent(parentElement);
            AM.addClass(el, 'tabs');
            el.setAttribute('data-tabs', '');
            return el;
        }
    });
    registerComponent(TTabsUl, 'TTabsUl', TTabsUl, 'FoundationContainer');

    var TTabsContent = TContainer.extend({
        _tag: 'div',
        init: function(name, parentElement) {
            this.parent(name, parentElement);
        },
        _createElement: function(parentElement) {
            var el = this.parent(parentElement);
            AM.addClass(el, 'tabs-content');
            el.setAttribute('data-tabs-content', this.name);
            var ul = this._el.parentElement.children[0];
            ul.setAttribute('id', this.name);
            return el;
        }
    });
    registerComponent(TTabsContent, 'TTabsContent', TTabsContent, 'FoundationContainer');

    var TTabsUlItem = TContainer.extend({
        _tag: 'li',
        setEl: function() {
            var cel = this._el;
            if (!cel.ttl) {
                cel.ttl = document.createElement('a');
                cel.ttl.setAttribute('href', '#');
                AM.ACN(cel, cel.ttl);
            }
            this.ttl = cel.ttl;
            return cel;
        },
        setAttr: function(attr, w) {
            this.parent(attr, w);
            var cel = this.setEl();
            if (attr['title']) {
                cel.ttl.innerHTML = attr['title'];
            }
        },
        init: function(name, parentElement) {
            this.parent(name, parentElement);
        },
        _createElement: function(parentElement) {
            var el = this.parent(parentElement);
            AM.addClass(el, 'tabs-title');
            this.setEl();
            return el;
        }
    });
    registerComponent(TTabsUlItem, 'TTabsUlItem', TTabsUlItem, 'FoundationContainer');

    var TTabsContentItem = TContainer.extend({
        _tag: 'div',
        init: function(name, parentElement) {
            this.parent(name, parentElement);
        },
        _createElement: function(parentElement) {
            var el = this.parent(parentElement);
            AM.addClass(el, 'tabs-panel');
            el.setAttribute('id', this.name);
            AM.addClass(parentElement.children[0], 'is-active'); // div item
            AM.addClass(parentElement.parentElement.children[0].children[0], 'is-active'); // li item

            var li = parentElement.parentElement.children[0].children;
            var cnt = this._el.parentElement.children;

            if (li.length == cnt.length) {
                for (var i = 0; i < cnt.length; i++) {
                    li[i].children[0].setAttribute('href', '#' + cnt[i].id);
                }
            }
            return el;
        }
    });
    registerComponent(TTabsContentItem, 'TTabsContentItem', TTabsContentItem, 'FoundationContainer');

    var TGrid = TContainer.extend({
        _tag: 'div',
        init: function(name, parentElement) {
            this.parent(name, parentElement);
        },
        setAttr: function(attr, w) {
            this.parent(attr, w);
            var self = this;
            self.autoLoad = attr.autoLoad || false;

            if (attr['dataset']) {
                self.dataset = attr['dataset'];
                var ds = _Scope.componentByName(attr['dataset']);
                if (ds && ds.addListener) {
                    self._dataset = ds;
                    ds.addListener(self);
                    if (attr['datasetParams']) {
                        ds.setParam(attr['datasetParams']);
                    }
                    if (self.autoLoad) {
                        clearTimeout(self._loadTimer);
                        self._loadTimer = setTimeout(function() {
                            self._dataset.loadData();
                        }, 10);
                    }
                }
            }
        },
        _createElement: function(parentElement) {
            var el = this.parent(parentElement);
            var self = this;

            AM.addClass(el, 'row');
            setTimeout(function() {
                if (self.attr.autoStack !== undefined) {
                    AM.addClass(el, self.attr.autoStack);
                }

                if (self.attr.alignment !== undefined) {
                    AM.addClass(el, self.attr.alignment);
                }
            }, 500);

            return el;
        },
    });
    registerComponent(TGrid, 'TGrid', TContainer, 'FoundationContainer');

    var TGridItem = TContainer.extend({
        _tag: 'div',
        init: function(name, parentElement) {
            this.parent(name, parentElement);
        },
        setAttr: function(attr, w) {
            var self = this;
        },
        _createElement: function(parentElement) {
            var el = this.parent(parentElement);
            var self = this;

            AM.addClass(el, 'columns');
            setTimeout(function() {
                if (self.attr.setSmallCol !== undefined) {
                    AM.addClass(el, self.attr.setSmallCol);
                }

                if (self.attr.setMediumCol !== undefined) {
                    AM.addClass(el, self.attr.setMediumCol);
                }

                if (self.attr.setLargeCol !== undefined) {
                    AM.addClass(el, self.attr.setLargeCol);
                }

                if (self.attr.responsiveAdjustments !== undefined) {
                    AM.addClass(el, self.attr.responsiveAdjustments);
                }

                if (self.attr.shrink === true) {
                    AM.addClass(el, 'shrink');
                }

            }, 500);

            return el;
        },
    });
    registerComponent(TGridItem, 'TGridItem', TContainer, 'FoundationContainer');

    //var TTopBar=TContainer.extend({
    //  _tag:'div',
    //  init:function(name,parentElement){
    //      this.parent(name,parentElement);
    //  },
    //  setAttr:function(attr,w){
    //      console.log('name', attr);
    //  },
    //  _createElement:function(parentElement){
    //        var el=this.parent(parentElement);
    //        var self=this;
    //        setTimeout(function() {
    //          console.log('thissss', self.attr.isSticky);
    //        }, 100);
    //        AM.addClass(el,'top-bar');
    //      return el;
    //  },
    //});
    //registerComponent(TTopBar,'TTopBar',TContainer,'Standard');

    var TTopBar = TContainer.extend({
        _tag: 'div',
        init: function(name, parentElement) {
            this.parent(name, parentElement);
        },
        setAttr: function(attr, w) {
        },
        _createElement: function(parentElement) {
            var el = this.parent(parentElement);
            var self = this;
            setTimeout(function() {
                if (self.attr.isSticky == 'true') {
                    AM.addClass(el, 'top-sticky');
                }
            }, 100);
            AM.addClass(el, 'top-bar');
            return el;
        },
    });
    registerComponent(TTopBar, 'TTopBar', TContainer, 'FoundationContainer');

    var TTopBarCenter = TContainer.extend({
        _tag: 'div',
        init: function(name, parentElement) {
            this.parent(name, parentElement);
        },
        _createElement: function(parentElement) {
            var el = this.parent(parentElement);
            var self = this;
            AM.addClass(el, 'top-bar-center');
            return el;
        },
    });
    registerComponent(TTopBarCenter, 'TTopBarCenter', TContainer, 'FoundationContainer');

    var TTopBarLeft = TContainer.extend({
        _tag: 'div',
        init: function(name, parentElement) {
            this.parent(name, parentElement);
        },
        _createElement: function(parentElement) {
            var el = this.parent(parentElement);
            var self = this;
            AM.addClass(el, 'top-bar-left');
            return el;
        },
    });
    registerComponent(TTopBarLeft, 'TTopBarLeft', TContainer, 'FoundationContainer');

    var TTopBarLeftContentNav = TContainer.extend({
        _tag: 'a',
        init: function(name, parentElement) {
            this.parent(name, parentElement);
        },
        _createElement: function(parentElement) {
            var el = this.parent(parentElement);
            var self = this;
            return el;
        },
    });
    registerComponent(TTopBarLeftContentNav, 'TTopBarLeftContentNav', TContainer, 'FoundationContainer');

    var TTopBarLeftContent = TContainer.extend({
        _tag: 'i',
        init: function(name, parentElement) {
            this.parent(name, parentElement);
        },
        _createElement: function(parentElement) {
            var el = this.parent(parentElement);
            var self = this;
            AM.addClass(el, 'fa fa-bars');
            return el;
        },
    });
    registerComponent(TTopBarLeftContent, 'TTopBarLeftContent', TContainer, 'FoundationContainer');

    /** Perbaiki Panji  */
    var TSliderOutput = TContainer.extend({
        _tag: 'input',
        init: function(name, parentElement) {
            this.parent(name, parentElement);
        },
        setAttr: function(attr, w) {
            var self = this;
        },
        _createElement: function(parentElement) {
            var el = this.parent(parentElement);
            var self = this;
            setTimeout(function() {
                el.setAttribute('type', 'text');
                var elemParent = el.parentElement.parentElement.className;
                var handleId = elemParent.replace(' ', '-');
                el.setAttribute('id', handleId);

            }, 100);
            return el;
        },
    });
    registerComponent(TSliderOutput, 'TSliderOutput', TContainer, 'FoundationContainer');

    var TSliderOutputContainer = TContainer.extend({
        _tag: 'div',
        init: function(name, parentElement) {
            this.parent(name, parentElement);
        },
        setAttr: function(attr, w) {
            var self = this;
        },
        _createElement: function(parentElement) {
            var el = this.parent(parentElement);
            var self = this;
            setTimeout(function() {
                AM.addClass(el, 'small-3 columns');
            }, 100);
            return el;
        },
    });
    registerComponent(TSliderOutputContainer, 'TSliderOutputContainer', TContainer, 'FoundationContainer');

    var TSliderHandle = TContainer.extend({
        _tag: 'span',
        init: function(name, parentElement) {
            this.parent(name, parentElement);
        },
        setAttr: function(attr, w) {
            var self = this;
        },
        _createElement: function(parentElement) {
            var el = this.parent(parentElement);
            var self = this;
            setTimeout(function() {
                AM.addClass(el, 'slider-handle');
                el.setAttribute('data-slider-handle', '');
                el.setAttribute('role', 'slider');
                el.setAttribute('tabindex', '1');

                var elemParent = el.parentElement.parentElement.parentElement.className;
                var handleId = elemParent.replace(' ', '-');

                el.setAttribute('aria-controls', handleId);
            }, 100);
            return el;
        },
    });
    registerComponent(TSliderHandle, 'TSliderHandle', TContainer, 'FoundationContainer');

    var TSliderFill = TContainer.extend({
        _tag: 'span',
        init: function(name, parentElement) {
            this.parent(name, parentElement);
        },
        setAttr: function(attr, w) {
            var self = this;
        },
        _createElement: function(parentElement) {
            var el = this.parent(parentElement);
            var self = this;
            setTimeout(function() {
                AM.addClass(el, 'slider-fill');
                el.setAttribute('data-slider-fill', '');
            }, 100);
            return el;
        },
    });
    registerComponent(TSliderFill, 'TSliderFill', TContainer, 'FoundationContainer');

    var TSliderAreaComponent = TContainer.extend({
        _tag: 'div',
        init: function(name, parentElement) {
            this.parent(name, parentElement);
        },
        _createElement: function(parentElement) {
            var el = this.parent(parentElement);
            var self = this;
            AM.addClass(el, 'slider');
            return el;
        },
    });
    registerComponent(TSliderAreaComponent, 'TSliderAreaComponent', TContainer, 'FoundationContainer');

    var TSliderArea = TContainer.extend({
        _tag: 'div',
        init: function(name, parentElement) {
            this.parent(name, parentElement);
        },
        _createElement: function(parentElement) {
            var el = this.parent(parentElement);
            var self = this;
            AM.addClass(el, 'small-9 columns');
            return el;
        }
    });
    registerComponent(TSliderArea, 'TSliderArea', TContainer, 'FoundationContainer');

    var TSlider = TContainer.extend({
        _tag: 'div',
        init: function(name, parentElement) {
            this.parent(name, parentElement);
        },
        setAttr: function(attr, w) {
            var self = this;

        },
        _createElement: function(parentElement) {
            var el = this.parent(parentElement);
            var self = this;
            setTimeout(function() {

                var childEl = el.firstChild;
                if (childEl == null) {
                }

                if (self.attr.orientation == 'vertical') {
                    AM.addClass(childEl.firstChild, 'vertical');
                }

                if (self.attr.showNumber == 'false') {
                    el.children[1].style.display = 'none';
                    el.children[0].classList.remove('small-9');
                    AM.addClass(el.children[0], 'small-12');
                }

                childEl.firstChild.setAttribute('data-slider', '');
                childEl.firstChild.setAttribute('data-initial-start', self.attr.initialStart);
                childEl.firstChild.setAttribute('data-start', self.attr.dataStart);
                childEl.firstChild.setAttribute('data-end', self.attr.dataEnd);

            }, 100);

            setTimeout(function() {
                reinitFoundation();
            }, 500);

            return el;
        },
    });
    registerComponent(TSlider, 'TSlider', TContainer, 'FoundationContainer');
    /** End Panji */

    var TOrbit = TContainer.extend({
        _tag: 'div',
        init: function(name, parentElement) {
            this.parent(name, parentElement);
        },
        setAttr: function(attr, w) {
            var self = this;

        },
        _createElement: function(parentElement) {
            var el = this.parent(parentElement);
            var self = this;
            el.setAttribute('aria-label', 'Favorite Space Pictures');
            el.setAttribute('data-orbit', '');
            el.setAttribute('data-use-m-u-i', true);
            el.setAttribute('data-options', 'animInFromLeft:fade-in; animInFromRight:fade-in; animOutToLeft:fade-out; animOutToRight:fade-out;');
            AM.addClass(el, 'orbit');

            setTimeout(function() {

            }, 1000);

            return el;
        },
    });
    registerComponent(TOrbit, 'TOrbit', TContainer, 'FoundationContainer');

    var TOrbitContainer = TContainer.extend({
        _tag: 'ul',
        init: function(name, parentElement) {
            this.parent(name, parentElement);
        },
        getEl: function() {
            var cel = this._el;

            if (!cel.btnPrev) {
                cel.btnPrev = AM.BUTTON({
                    c: 'orbit-previous',
                    'aria-label': 'previous'
                });
                AM.ACN(cel, cel.btnPrev);
            }
            if (!cel.btnNext) {
                cel.btnNext = AM.BUTTON({
                    c: 'orbit-next',
                    'aria-label': 'next'
                });
                AM.ACN(cel, cel.btnNext);
            }
            if (!cel.btnPrev.Span) {
                cel.btnPrev.Span = AM.SPAN({
                    c: 'show-for-sr'
                });
                cel.btnPrev.Span.innerHTML = 'Previous Slide';
                AM.ACN(cel.btnPrev, cel.btnPrev.Span);
                cel.btnPrev.innerHTML += '&#9664;';
            }
            if (!cel.btnNext.Span) {
                cel.btnNext.Span = AM.SPAN({
                    c: 'show-for-sr'
                });
                cel.btnNext.Span.innerHTML = 'Next Slide';
                AM.ACN(cel.btnNext, cel.btnNext.Span);
                cel.btnNext.innerHTML += '&#9654;';
            }

            //this.cnt = cel.cnt;
            return cel;
        },
        setAttr: function(attr, w) {
            var self = this;

        },
        _createElement: function(parentElement) {
            var el = this.parent(parentElement);
            var self = this;
            setTimeout(function() {
                AM.addClass(el, 'orbit-container');
            }, 100);
            this.getEl();
            return el;
        },
    });
    registerComponent(TOrbitContainer, 'TOrbitContainer', TContainer, 'FoundationContainer');

    var TOrbitItem = TContainer.extend({
        _tag: 'li',
        init: function(name, parentElement) {
            this.parent(name, parentElement);
        },
        getEl: function() {
            var cel = this._el;
            var self = this;

            if (!cel.orbitCap) {
                cel.orbitCap = AM.DIV({
                    c: 'orbit-caption'
                });
                cel.orbitCap.innerHTML = 'Set Description Here';
                AM.ACN(cel, cel.orbitCap);
            }
            setTimeout(function() {
                if (self.attr.caption !== undefined) {
                    AM.setHTML(cel.orbitCap, self.attr.caption);
                } else {
                    AM.setHTML(cel.orbitCap, 'Set Description Here');
                }
            }, 100);
            //this.cnt = cel.cnt;
            return cel;
        },
        setAttr: function(attr, w) {
            var self = this;

        },
        _createElement: function(parentElement) {
            var el = this.parent(parentElement);
            var self = this;
            AM.addClass(el, 'orbit-slide');
            this.getEl();
            return el;
        },
    });
    registerComponent(TOrbitItem, 'TOrbitItem', TContainer, 'FoundationContainer');

    function reinitFoundation() {
        //$(document).foundation();
    }


    /** foundation 6 end */


    /* source:lib/components/foundation/fvisual.js */
    var TFButton = TVisualComponent.extend({
        _tag: 'a',
        setAttr: function(attr, w) {
            this.parent(attr, w);
            if (attr['addClass']) {
                AM.addClass(this._el, attr['addClass']);
            }
            if (attr.elAttr) {
                AM.update(this._el, attr.elAttr);
            }

            // Set the background gradient
            if (attr['backgroundGradient']) {
                this._el.style.backgroundImage = attr['backgroundGradient'];
            }

            // Set the background image
            if (attr['backgroundAsset']) {
                this._el.style.backgroundImage = 'url(' + getImageUrl(attr['backgroundAsset']) + ')';
                this._el.style.backgroundRepeat = attr['backgroundRepeat'] || 'no-repeat';
            }
            
            // Set the background of border
            if (attr['borderImageSource']) {
                this._el.style.borderImageSource = 'url(' + getImageUrl(attr['borderImageSource']) + ')';
            }

            // Check if it must be hidden
            var element = $(this._el);
            if (attr['hide']) {
                element.addClass('hide');
            }

            var cel = this._el;
            if (!cel.caption) {
                cel.caption = AM.SPAN({
                    c: 'ca-caption'
                });
                AM.ACN(cel, cel.caption);
            }
            if (attr['ColoringStyle']) {
                AM.addClass(cel, attr['ColoringStyle']);
            }
            if (attr['Sizing']) {
                AM.addClass(cel, attr['Sizing']);
            }
            if (attr['caption']) {
                AM.setHTML(cel.caption, getLangCaption(attr['caption']));
            }
        },
        init: function(name, parentElement) {
            this.parent(name, parentElement);
        },
        _createElement: function(parentElement) {
            var el = this.parent(parentElement);
            AM.addClass(el, 'button');
            return el;
        },
        _onDataValue: function(v){
            // Set the button label
            this._el.innerText = v;
        }
    });
    registerComponent(TFButton, 'TFButton', TFButton, 'FoundationContainer');


    var TFLabel = TVisualComponent.extend({
        _tag: 'span',
        setAttr: function(attr, w) {
            var cel = this._el;
            if (attr['caption']) {
                cel.innerText = attr['caption'];
            }
            if (attr['ColoringStyle']) {
                AM.addClass(cel, attr['ColoringStyle']);
            }
        },
        init: function(name, parentElement) {
            this.parent(name, parentElement);
        },
        _createElement: function(parentElement) {
            var el = this.parent(parentElement);
            AM.addClass(el, 'label');
            return el;
        }
    });
    registerComponent(TFLabel, 'TFLabel', TFLabel, 'FoundationContainer');

    var TFBadge = TVisualComponent.extend({
        _tag: 'span',
        setAttr: function(attr, w) {
            var cel = this._el;
            if (attr['caption']) {
                cel.innerText = attr['caption'];
            }
            if (attr['ColoringStyle']) {
                AM.addClass(cel, attr['ColoringStyle']);
            }
        },
        init: function(name, parentElement) {
            this.parent(name, parentElement);
        },
        _createElement: function(parentElement) {
            var el = this.parent(parentElement);
            AM.addClass(el, 'badge');
            return el;
        }
    });
    registerComponent(TFBadge, 'TFBadge', TFBadge, 'FoundationContainer');

    var TFProgressBar = TVisualComponent.extend({
        _tag: 'div',
        setAttr: function(attr, w) {
            var cel = this._el;
            if (attr['valueMin']) {
                cel.setAttribute('aria-valuemin', attr['valueMin']);
            }
            if (attr['valueMax']) {
                cel.setAttribute('aria-valuemax', attr['valueMax']);
            }
        },
        init: function(name, parentElement) {
            this.parent(name, parentElement);
        },
        _createElement: function(parentElement) {
            var el = this.parent(parentElement);
            var progress = function() {
                $(".progress-meter").animate({
                    width: "100%"
                }, 5000, function() {})
            }
            AM.addClass(el, 'progress');
            el.setAttribute('role', 'progressbar');
            el.setAttribute('tabindex', '0');
            el.innerHTML = '<div class="progress-meter" style="width:0%"></div>';
        }
    });
    registerComponent(TFProgressBar, 'TFProgressBar', TFProgressBar, 'FoundationContainer');

    var TFSwitch = TVisualComponent.extend({
        _tag: 'div',
        init: function(name, parentElement) {
            this.parent(name, parentElement);
        },
        setAttr: function(attr, w) {
            var cel = this._el;
            if (attr['labelActive']) {
                var aa = cel.paddle;
                var sp = document.createElement('span');
                AM.addClass(sp, 'switch-active');
                sp.setAttribute('aria-hidden', true);
                sp.innerText = attr['labelActive'];
                aa.appendChild(sp);
            }
            if (attr['labelInActive']) {
                var aa = cel.paddle;
                var sp = document.createElement('span');
                AM.addClass(sp, 'switch-inactive');
                sp.setAttribute('aria-hidden', true);
                sp.innerText = attr['labelInActive'];
                aa.appendChild(sp);
            }
            if (attr['id']) {
                cel.children[0].setAttribute('id', attr['id'] ? attr['id'] : 'switchDefault');
                cel.children[0].setAttribute('name', attr['id'] ? attr['id'] : 'switchDefault');
                cel.children[1].setAttribute('for', attr['id'] ? attr['id'] : 'switchDefault');
            }
            if (attr['Sizing']) {
                AM.addClass(cel, attr['Sizing']);
            }
        },
        _createElement: function(parentElement) {
            var el = this.parent(parentElement);
            AM.addClass(el, 'switch');

            el.input = document.createElement('input');
            el.input.setAttribute('class', 'switch-input');
            el.input.setAttribute('id', 'switchDefault');
            el.input.setAttribute('type', 'checkbox');
            el.input.setAttribute('name', 'switchDefault');
            AM.ACN(el, el.input);

            el.paddle = document.createElement('label');
            el.paddle.setAttribute('class', 'switch-paddle');
            el.paddle.setAttribute('for', 'switchDefault');
            el.paddle.innerHTML = '<span class="show-for-sr"></span>';
            AM.ACN(el, el.paddle);

            return el;
        }
    });
    registerComponent(TFSwitch, 'TFSwitch', TFSwitch, 'FoundationContainer');

    var TFlexVideo = TVisualComponent.extend({
        _tag: 'div',
        setAttr: function(attr, w) {
            if (attr['url']) {
                this._el.frm.setAttribute('src', attr.url);
            }
            this._el.style.height = attr.height + 'px';
            this._el.frm.setAttribute('width', attr.width);
            this._el.frm.setAttribute('height', attr.height);

        },
        init: function(name, parentElement) {
            this.parent(name, parentElement);
        },
        _createElement: function(parentElement) {
            var el = this.parent(parentElement);
            AM.addClass(el, 'flex-video');
            el.frm = document.createElement('iframe');
            AM.ACN(el, el.frm);
            return el;
        }
    });
    registerComponent(TFlexVideo, 'TFlexVideo', TFlexVideo, 'FoundationContainer');

    /* source:lib/components/function/function.js */


    String.prototype.capitalize = function() {
        return this.replace(/(^|\s)([a-z])/g, function(m, p1, p2) {
            return p1 + p2.toUpperCase();
        });
    };

    var _Function = {};
    var _FunctionGroup = {};

    function _isFunction(o) {
        return !!(o && o.f);
    }

    function registerFunction(fprm, group) {
        _Function = AM.update(_Function, fprm);
        group = group || 'General';
        if (!_FunctionGroup[group]) {
            _FunctionGroup[group] = [];
        }
        _FunctionGroup[group] = _FunctionGroup[group].concat(AM.keys(fprm));
    }

    var _embedDetail = {
            "dataField": function(vlu, _embed) {
                if (_embed['data']) {
                    return _embed['data'][vlu];
                } else {
                    return 0;
                }
            },
            "inputField": function(vlu, _embed) {
                if (_embed['input']) {
                    return _embed['input'][vlu];
                } else {
                    return 0;
                }
            },
            "param": function(vlu, _embed) {
                if (_embed['params']) {
                    return _embed['params'][vlu];
                } else {
                    return 0;
                }
            }
        }
        //Aris edit

    function crest(w, h) {
        var xMax = 800,
            yMax = 800;
        var wOutput = w,
            hOutput = h;
        if (w > xMax && w > h) {
            var a = xMax / w;
            wOutput = a * w;
            hOutput = a * h;
        } else if (h > yMax) {
            var b = yMax / h;
            wOutput = b * w;
            hOutput = b * h;
        }
        return {
            w: wOutput,
            h: hOutput
        };
    }
    var cx = null;

    // Open Internal Browser
    function openInternalBrowser(url) {
        // check if the url has 'http://' at the beginning
        if (url.indexOf('http') !== 0) {
            url = 'http://' + url;
        }
        
        if (isCordova()) {
            if (getMobileOperatingSystem() == "Unknown") {
                window.open(url, "_self", "location=no");
            } else {
                cordova.InAppBrowser.open(url, '_blank', 'location=no,hardwareback=no');
            }
        } else {
            window.open(url, "_self", "location=no");
        }
    }

    // Get the operating system of the phone
    function getMobileOperatingSystem() {
        var userAgent = navigator.userAgent || navigator.vendor || window.opera;

        // Windows Phone must come first because its UA also contains "Android"
        if (/windows phone/i.test(userAgent)) {
            return "Windows Phone";
        } else if (/android/i.test(userAgent)) {
            return "Android";
        } else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
            return "iOS";
        }

        return "Unknown";
    }

    // Process the list of image(s) to be converted
    function convertImagesToBase64(prm, cb) {
        var images_base64 = [];

        // Make sure it's stored in an array
        var images = [];
        if (AM.isArray(prm.image)) {
            images = prm.image
        } else {
            images.push(prm.image);
        }

        // Get the number of images
        var images_length = images.length;

        // Create a function to check if all images are all converted
        var checkFinished = function(base64, counter, extra) {
            // Reduce the images per processing
            --images_length;
            // Store the base64 to the array
            images_base64[counter] = base64;
            // Check if there are more files to download
            if (images_length == 0 && cb) {
                // Check if single then just return it directly
                if (images_base64.length == 1) {
                    cb((extra ? {'data' : images_base64[0], 'extra' : extra} : images_base64[0]));
                } else {
                    cb((extra ? {'data' : images_base64, 'extra' : extra} : images_base64) );
                }
            }
        };

        // Loop through the images and convert it to base64
        images.forEach(function(image, counter) {
            convertImageToBase64(image, counter, (prm['extra'] ? prm['extra']: null), checkFinished);
        });
    }

    // Convert the image to base64
    function convertImageToBase64(image, counter, extra, cb) {
        // Make sure the image is converted to a proper data
        image = convertImageURL(image);

        // Get the output format
        var outputFormat = image.split('.').pop();
        // Create the image
        var img = new Image();
        img.crossOrigin = '';
        // Add the onload function trigger for the image
        img.onload = function() {
            // Draw the image
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            var xRest = crest(img.width, img.height);
            canvas.height = xRest.h;
            canvas.width = xRest.w;
            ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, xRest.w, xRest.h);
             // Get the base64 from the canvas
            var dataURL = canvas.toDataURL('image//' + outputFormat);
            cb(dataURL, counter, extra);
        };
        // Set the image path
        img.src = image;
    }

    /**
     * Originally from http://davidwalsh.name/convert-xml-json
     * This is a version that provides a JSON object without the attributes and places textNodes as values
     * rather than an object with the textNode in it.
     * 27/11/2012
     * Ben Chidgey
     *
     * @param xml
     * @return {*}
     */
    function xmlToJson(xml) {

        // Create the return object
        var obj = {};

        // Text node
        if (4 === xml.nodeType) {
            obj = xml.nodeValue;
        }

        if (xml.hasChildNodes()) {
            for (var i = 0; i < xml.childNodes.length; i++) {
                var TEXT_NODE_TYPE_NAME = '#text',
                    item = xml.childNodes.item(i),
                    nodeName = item.nodeName,
                    content;

                if (TEXT_NODE_TYPE_NAME === nodeName) {
                    //single textNode or next sibling has a different name
                    if ((null === xml.nextSibling) || (xml.localName !== xml.nextSibling.localName)) {
                        content = xml.textContent;

                    //we have a sibling with the same name
                    } else if (xml.localName === xml.nextSibling.localName) {
                        //if it is the first node of its parents childNodes, send it back as an array
                        content = (xml.parentElement.childNodes[0] === xml) ? [xml.textContent] : xml.textContent;
                    }
                    return content;
                } else {
                    if ('undefined' === typeof(obj[nodeName])) {
                        obj[nodeName] = xmlToJson(item);
                    } else {
                        // Check if it's an array
                        if (!Array.isArray(obj[nodeName])) {
                            var old = obj[nodeName];
                            obj[nodeName] = [];
                            obj[nodeName].push(old);
                        }

                        obj[nodeName].push(xmlToJson(item));
                    }
                }
            }
        }

        // Check if it's empty
        // Cause it's returning {} instead of blank
        if (Object.keys(obj).length === 0 && obj.constructor === Object) {
            obj = '';
        }

        return obj;
    }

    // function to generate random string
    // chars example: abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ
    function randomString(length, chars) {
        var result = '';
        for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
        return result;
    }

    registerFunction({
        'gotoPage': function(prm) {
            // Store data
            _lastPage = getHash().p;
            setHash(prm);
            return false;
        },
        'getPreviousPage': function(prm) {
            // Return the last page
            return _lastPage;
        },
        'getCurrentPage': function(prm) {
            // Return the current page
            return getHash().p;
        },
        'makeId': function(prm) {
            return makeId(1000000);
        },
        'encodeURI': function(prm) {
            // Handle null values
            if (prm.string) {
                return encodeURIComponent(prm.string);
            }
            return "";
        },
        'jsonEncode': function(prm) {
            if (prm['object']) {
                if (prm['indent']) {
                    var indent = parseInt(prm['indent']);
                    if (isNaN(indent)) {
                        indent = null;
                    }
                    return JSON.stringify(prm['object'], null, indent);
                } else {
                    return AM.serializeJSON(prm['object'])
                }
            }
            return '';
        },
        'jsonDecode': function(prm) {
            if (prm['string']) {
                return AM.evalTxt(prm['string'])
            }
            return '';
        },
        'xmlDecode': function(prm) {
            if (prm['string']) {
                return xmlToJson($.parseXML(prm['string'].replace(/(\r\n|\n|\r)\s+/gm,'')));
            }
            return '';
        },
        "defaultImage": function(prm) {
            return getDefaultImg();
        },
        "openInternalBrowser": function(prm) {
            return openInternalBrowser(prm['url']);
        },
        /**
         * Generate Random Number
         */
        'generateRandomNumber': function(prm) {
            // Get the min and max number
            var min = Math.ceil(prm['min'] || 0),
                max = Math.floor(prm['max'] || 1000000);
            // Generate now the random number
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },
        /**
         * Generate Random Alphabet
         */
        'generateRandomAlphabet': function(prm) {
            // Get the length of the alphabet
            var length = Math.floor(prm['characterLength'] || 10);
            // Generate now the random alphabet
            return randomString(length, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
        },
        /**
         * Generate Random Alphanumeric
         */
        'generateRandomAlphanumeric': function(prm) {
            // Get the length of the alphanumeric
            var length = Math.floor(prm['characterLength'] || 10);
            // Generate now the random alphanumeric
            return randomString(length, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
        }
    }, 'Global');

    registerFunction({
        'valueFromURL': function(prm) {
            // Get all the needed data
            var url = prm['url'];
            var name = prm['parameter'];
            //  Check if no url then get the active one
            if (!url) {
                url = window.location.href;
            }
            // Prepare the name
            name = name.replace(/[\[\]]/g, "\\$&");
            // Prepare the regex
            var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
            // Find the param through regex
            var results = regex.exec(url);

            // Check if it contains data
            if (!results) {
                return null;
            } else if (!results[2]) {
                return '';
            } else {
                return decodeURIComponent(results[2].replace(/\+/g, " "));
            }
        }
    }, 'Browser');

    registerFunction({
        'comment': function(prm) {},
        'console': function(prm) {
            console.log(prm.value);
            return prm.value;
        },
        'getAppVersion': function(prm){
            return _appVersion;
        },
        'getLanguage': function(prm) {
            return getLanguage();
        },
        'getLanguageList': function(prm) {
            // Callback
            var cb = function(o) {
                if (prm.callback){
                    _doAction(prm.callback, AM.update(this||{}, {
                        input: o
                    }));
                }
            };
            // Get the languages
            var result = [];
            result.push({ 
                lang: _Lang.key,
                language: _Lang.key
            });
            AM.map(_Lang.value, function(value) {
                result.push({ 
                    lang: value,
                    language: value
                });
            });
            // Result
            cb(result);
            return result;
        },
        'setLanguage': function(prm) {
            return setLanguage(prm['lang']);
        },
        'languageConvertData': function(prm) {
            return getLangCaption(prm['value'], prm['language']);
        },
        'reload': function(prm) {
            var x = getHash();
            delete x['rnd'];
            setHash(x, true);
            return true;
        },
        /**
         * Display the snippet in a full screen mode 
         */
        'displaySnippet': function(prm) {
            // Prepare all the needed variables from parameters
            var snippetName = prm.snippet,
                show = prm.show || false,
                parentElement = $('#wrap_snippet'),
                holderId = 'wrap_snippet_' + snippetName;

            // Make sure the snippet exist
            if (typeof(_snippet) == 'undefined' && !_snippet[snippetName]) {
                return;
            }

            clearWrapSnippet(snippetName, holderId);

            // Create the element
            if (show) {
                parentElement.append(
                    $('<div>').addClass('hide snippet').attr('id', holderId).css({
                        'position': 'absolute',
                        'z-index': '1000',
                        'height': '100%',
                        'width': '100%'
                    }) 
                );  

                // Get the element
                var element = parentElement.find('#' + holderId);

                // Generate the snippet 
                displaySnippetContent(snippetName, element);
                element.removeClass('hide');
            }

            // Make sure there are visible elements
            if (parentElement.find('.snippet').not('.hide').length > 0) {
                parentElement.removeClass('hide');
            } else {
                parentElement.addClass('hide');
            }
        },
        // Sorting enable
        'sortingEnable': function(prm) {
            $('.sortable').sortable('enable');
            return true;
        },
        // Sorting disable
        'sortingDisable': function(prm) {
            $('.sortable').sortable('disable');
            return true;
        },
        // Convert image(s) to base64
        "convertImageToBase64": function(prm) {
            var ebd = this || {};
            // Make sure there is/are images passed
            if (prm.image) {
                // Call the function that convert image(s) to base64
                convertImagesToBase64(prm, function(x) {
                    _doAction(prm.callback, AM.update(ebd, {
                        input: x
                    }));
                });
                return true;
            } else {
                return false;
            }
        },
        // Animate function for images
        'animate': function(prm) {
            var comp = _getComponent(prm);
            if (comp) {
                comp._setAnimationData(prm);
                return true;
            }
            return false;
        },
    }, 'App');

    /**
     * Chart Functions
     */
    registerFunction({
        'chartPopulateLineData': function(prm) {
            var data = chartGenerateData('line', prm);
            var comp = _getComponent(prm);
            if (comp) {
                comp._onDataValue(data);
            }
            return data;
        },
        'chartPopulateStepData': function(prm) {
            var data = chartGenerateData('step', prm);
            var comp = _getComponent(prm);
            if (comp) {
                comp._onDataValue(data);
            }
            return data;
        },
        'chartPopulateStepAreaData': function(prm) {
            var data = chartGenerateData('area-step', prm);
            var comp = _getComponent(prm);
            if (comp) {
                comp._onDataValue(data);
            }
            return data;
        },
        'chartPopulateBarData': function(prm) {
            var data = chartGenerateData('bar', prm);
            var comp = _getComponent(prm);
            if (comp) {
                comp._onDataValue(data);
            }
            return data;
        },
        'chartPopulatePieData': function(prm) {
            var data = chartGenerateData('pie', prm);
            var comp = _getComponent(prm);
            if (comp) {
                comp._onDataValue(data);
            }
            return data;
        },
        'chartPopulateDonutData': function(prm) {
            var data = chartGenerateData('donut', prm);
            var comp = _getComponent(prm);
            if (comp) {
                comp._onDataValue(data);
            }
            return data;
        },
        'chartPopulateSplineData': function(prm) {
            var data = chartGenerateData('spline', prm);
            var comp = _getComponent(prm);
            if (comp) {
                comp._onDataValue(data);
            }
            return data;
        },
        'chartPopulateAreaData': function(prm) {
            var data = chartGenerateData('area', prm);
            var comp = _getComponent(prm);
            if (comp) {
                comp._onDataValue(data);
            }
            return data;
        },
        'chartPopulateAreaSplineData': function(prm) {
            var data = chartGenerateData('area-spline', prm);
            var comp = _getComponent(prm);
            if (comp) {
                comp._onDataValue(data);
            }
            return data;
        },
        'chartPopulateScatterPlotData': function(prm) {
            var data = chartGenerateData('scatter', prm);
            var comp = _getComponent(prm);
            if (comp) {
                comp._onDataValue(data);
            }
            return data;
        },
        'chartPopulateGaugeData': function(prm) {
            var data = chartGenerateData('gauge', prm);
            var comp = _getComponent(prm);
            if (comp) {
                comp._onDataValue(data);
            }
            return data;
        }
    }, 'Chart');

    /**
     * PDF Functions
     */
    registerFunction({
        'pdfGenerate': function(prm) {
            var element = this || {};
            var extra = prm['extra'];

            // Only cater for mobile device
            if (!isCordova()) {
                callback(element, prm.errorCallback, 'This function only works in mobile.', extra);
                return false;
            }

            // Check if plugin is included
            if (!pdf) {
                callback(element, prm.errorCallback, 'PDF plugin was not initialized.', extra);
                return false;
            }

            // Prepare the data to be used
            var type = prm['type'] || 'url';
            var value = prm['value'];
            var options = {
                type: (prm['result'] || 'base64'),
                documentSize: (prm['size'] || 'A4'),
                landscape: (prm['orientation'] || 'portrait'),
                fileName: prm['fileName']
            }

            // Check the function to trigger in the pdf plugin
            if (type == 'html') { // html
                pdf.fromData(value, options)
                    .then(function(data) {
                        callback(element, prm.callback, data, extra);
                    })
                    .catch(function(error) {
                        callback(element, prm.errorCallback, error, extra);
                    });
                return true;
            }       

            // Trigger the default type which is url
            pdf.fromURL(value, options)
                .then(function(data) {
                    callback(element, prm.callback, data, extra);
                })
                .catch(function(error) {
                    callback(element, prm.errorCallback, error, extra);
                });
            return true;
        }
    }, 'PDF');

    registerFunction({
        'increment': function(prm) {
            if (!prm.string || !prm.by) {
                return false;
            }
            // Use base36
            // Default is true
            var useBase36 = prm.useBase36 === undefined ? true : prm.useBase36;
            if (useBase36) {
                return ((parseInt(prm.string, 36) + prm.by).toString(36)).replace(/[0-1]/g,'a');
            } else {
                return prm.string.replace(/(\d+)+/g, function(match, num){
                    return stringPad(parseInt(num) + prm.by, '0', 'right', num.length);
                });
            }
        },
        'lowerCase': function(prm) {
            return (prm.string ? prm.string.toLowerCase() : '');
        },
        'upperCase': function(prm) {
            return (prm.string ? prm.string.toUpperCase() : '');
        },
        'capitalize': function(prm) {
            return (prm.string ? prm.string.capitalize() : '');
        },
        'trim': function(prm) {
            var result = '';
            // Check if it's trimmable
            var string = prm['string'] || '';
            if (typeof string === 'string' || string instanceof String) {
                result = string.trim();
            }
            return result;
        },
        'left': function(prm) {
            // Default length value
            prm.length = prm.length || 0;
            prm.length = parseInt(prm.length);
            // Check if necessary to count it based on language format
            if (prm.byLanguageFormat && prm.string) {
                var length = 0;
                var tmpLength = 0;
                for (var counter = 0; counter < prm.string.length; counter ++) {
                    // Get the character code
                    var charCode = prm.string.charCodeAt(counter);

                    // For now if outside this range assume that it is within 255 byte range for 1 letter
                    // Tested only for chinese
                    var charLength = (((charCode >= 0) && (charCode <= 255)) ? 1 : 2);

                    // Validate if it is more than the specified length
                    // stop the loop
                    if ((tmpLength + charLength) > prm.length) {
                        break;
                    }

                    // Append the length
                    tmpLength += charLength;
                    length += 1;
                }

                return prm.string.substr(0, length);
            }
            return (prm.string ? prm.string.substr(0, prm.length) : '');
        },
        'right': function(prm) {
            // Default length value
            prm.length = prm.length || 0;
            prm.length = parseInt(prm.length);

            // Check if necessary to count it based on language format
            if (prm.byLanguageFormat && prm.string) {
                var length = 0;
                var tmpLength = 0;
                for (var counter = (prm.string.length - 1); counter >= 0; counter --) {
                    // Get the character code
                    var charCode = prm.string.charCodeAt(counter);

                    // For now if outside this range assume that it is within 255 byte range for 1 letter
                    // Tested only for chinese
                    var charLength = (((charCode >= 0) && (charCode <= 255)) ? 1 : 2);

                    // Validate if it is more than the specified length
                    // stop the loop
                    if ((tmpLength + charLength) > prm.length) {
                        break;
                    }

                    // Append the length
                    tmpLength += charLength;
                    length += 1;
                }

                return prm.string.substr(-length);
            }

            return (prm.string ? prm.string.substr(-prm.length) : '');
        },
        'mid': function(prm) {
            // Default length value
            prm.start = prm.start || 0;
            prm.start = parseInt(prm.start);
            prm.length = prm.length || 0;
            prm.length = parseInt(prm.length);

            return (prm.string ? prm.string.substr(prm.start, prm.length) : '');
        },
        'concat': function(prm) {
            prm['length'] = prm['length'] || 10;
            var s = '';
            for (var i = 1; i <= prm['length']; i++) {
                if (!((typeof(prm['string' + i]) === 'undefined') || (prm['string' + i] === null))) {
                    s += (getLangCaption(prm['string' + i].toString()) || '');
                }
            }
            return s;
        },
        'findIndex': function(prm) {
            prm.find = prm.find || 10;
            return (prm.string ? prm.string.indexOf(prm.find) : '');
        },
        'replace': function(prm) {
            // Check if replace have value
            if (!prm['string']) {
                return prm['string'];
            }

            // Check if regular expression or normal string
            if (prm['regExp'] == 'true') {
                // Convert the string into a proper regex
                var match = prm['replace'].match(new RegExp('^/(.*?)/([gimy]*)$'));
                // Run the regex
                return prm['string'].replace(new RegExp(match[1], match[2]), prm['replacement'] || '');
            } else {
                return prm['string'].replace(new RegExp(prm['replace'], "g"), prm['replacement'] || '');
            }
        },
        'length': function(prm) {
            // Check if necessary to count it based on language format
            if (prm.byLanguageFormat && prm.string) {
                var length = 0;
                for (var counter = 0; counter < prm.string.length; counter ++) {
                    // For now if outside this range assume that it is within 255 byte range for 1 letter
                    // Tested only for chinese
                    if ((prm.string.charCodeAt(counter) >= 0) && (prm.string.charCodeAt(counter) <= 255)) {
                        length += 1;
                        continue;
                    }
                    length += 2;
                }
                return length;
            }
            // Normal length
            return (prm.string ? prm.string.length : 0);
        },
        'padString': function(prm) {
            return stringPad(prm['string'], prm['char'], prm['type'], prm['len']);
        },
        'encodeBase64String': function(prm) {
            prm.string = prm.string || '';
            return btoa(encodeURIComponent(prm.string).replace(/%([0-9A-F]{2})/g, function(match, p1) {
                return String.fromCharCode('0x' + p1);
            }));
        },
        'decodeBase64String': function(prm) {
            prm.string = prm.string || '';
            return decodeURIComponent(Array.prototype.map.call(atob(prm.string), function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
        },
        'hashingFunction': function(prm){
            var type=prm.type||'md5';
            if (prm.value) {
                switch(type) {
                    case 'md5':
                        var hash = md5.create();
                        hash.update(prm.value);
                        return hash.hex();
                        break;
                    case 'sha256':
                        var hash = sha256.create();
                        hash.update(prm.value);
                        return hash.hex();
                        break;
                    default:
                        return 'Invalid Hash Type';
                }
            } else {
                return 'No Value';
            }
        },
        'encrypt': function(prm){
            var type = prm.type || 'aes';
            if (prm.value) {
                switch(type) {
                    case 'aes':
                        return CryptoJS.AES.encrypt(prm.value, prm.key).toString();
                        break
                    case 'aes256':
                        return CryptoJS.AES.encrypt(prm.value, prm.key, { iv: prm.iv }).toString();
                        break;
                    default:
                        return 'Invalid Encryption Type';
                }
            } else {
                return 'No Value';
            }
        },
        'decrypt': function(prm){
            var type = prm.type || 'aes';
            if (prm.value) {
                switch(type) {
                    case 'aes':
                        return CryptoJS.AES.decrypt(prm.value, prm.key).toString(CryptoJS.enc.Utf8);
                        break
                    case 'aes256':
                        return CryptoJS.AES.decrypt(prm.value, prm.key, { iv: prm.iv }).toString(CryptoJS.enc.Utf8);
                        break;
                    default:
                        return 'Invalid Decryption Type';
                }
            } else {
                return 'No Value';
            }
        }
    }, 'String');

    function isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }
    registerFunction({
        'multi': function(prm) {
            var x1 = prm.value1 !== undefined ? prm.value1 : 0
            var x2 = prm.value2 !== undefined ? prm.value2 : 0;
            var x = isNumber(x1) ? x1.toString() : x1;
            var y = isNumber(x2) ? x2.toString() : x2;
            return parseFloat(x.replace(/,/g, '')) * parseFloat(y.replace(/,/g, ''));
        },
        'div': function(prm) {
            if (prm && prm.integer) {
                return (prm.value2 ? parseInt(prm.value1 / prm.value2) : undefined);
            } else {
                return (prm.value2 ? (prm.value1 / prm.value2) : undefined);
            }
        },
        'mod': function(prm) {
            prm.value1 = prm.value1 || 0;
            prm.value2 = prm.value2 || 0;
            return prm.value1 % prm.value2;
        },
        'add': function(prm) {
            return parseFloat(prm.value1) + parseFloat(prm.value2);
        },
        'sub': function(prm) {
            return parseFloat(prm.value1) - parseFloat(prm.value2);
        },
        'sqr': function(prm) {
            return parseFloat(prm.value) * parseFloat(prm.value);
        },
        'sqrt': function(prm) {
            return Math.sqrt(parseFloat(prm.value));
        },
        'pow': function(prm) {
            return Math.pow(parseFloat(prm.base), parseFloat(prm.exponent));
        },
        'absolute': function(prm) {
            return Math.abs(parseFloat(prm.value));
        },
        'atan2': function(prm) {
            return Math.atan2(parseFloat(prm.y), parseFloat(prm.x));
        },
        'sin': function(prm) {
            return Math.sin(parseFloat(prm.value));
        },
        'tan': function(prm) {
            return Math.tan(parseFloat(prm.value));
        },
        'cos': function(prm) {
            return Math.cos(parseFloat(prm.value));
        },
        'pi': function(prm) {
            return Math.PI;
        },
        'ceil': function(prm) { 
            return Math.ceil(parseFloat(prm.value));
        },
        'floor': function(prm) { 
            return Math.floor(parseFloat(prm.value));
        },
        'min': function(prm) {
            if ($.isArray(prm.value)) {
                return Math.min.apply(null, prm.value);
            } else {
                return "Value should be an array";
            }
        },
        'max': function(prm) { 
            if ($.isArray(prm.value)) {
                return Math.max.apply(null, prm.value);
            } else {
                return "Value should be an array";
            }
        }
    }, 'Math');

    /**
     * Get the radius for the lat/long
     * @param {*} degree 
     */
    function degreeToRadius(degree) {
        return degree * (Math.PI/180);
    }

    /**
     * Formula Functions
     */
    registerFunction({
        'locationDistance': function(prm) {
            // Make sure there are valid values for the latitude and longitude 
            if (!prm.latitudeA || !prm.longitudeA || !prm.latitudeB || !prm.longitudeB) {
                return "Missing parameters."
            }

            // Make sure the value passed are valid numbers
            if (!isNumber(prm.latitudeA) || !isNumber(prm.longitudeA) || !isNumber(prm.latitudeB) || !isNumber(prm.longitudeB)) {
                return "Some values are invalid.";
            }  

            // Prepare the variables and convert to float to be safe
            var latA = parseFloat(prm.latitudeA);
            var longA = parseFloat(prm.longitudeA);
            var latB = parseFloat(prm.latitudeB);
            var longB = parseFloat(prm.longitudeB);

            // Caclulate the distance
            var result = 0;
            var earthRadius = 6371; // Radius of the earth in km
            var distanceLat = degreeToRadius(latA - latB);
            var distanceLong = degreeToRadius(longA - longB); 
            
            result = Math.sin(distanceLat / 2) * Math.sin(distanceLat / 2) + Math.cos(degreeToRadius(latA)) * Math.cos(degreeToRadius(latB)) * Math.sin(distanceLong / 2) * Math.sin(distanceLong / 2);
            result = 2 * Math.atan2(Math.sqrt(result), Math.sqrt(1 - result)); 
            result = earthRadius * result; // Distance in km

            return result;
        }
    }, 'Formula');

    registerFunction({
        'sum': function(prm) {
            var x = 0;
            for (var i = 0; i < prm.values.length; i++) {
                x += parseFloat(prm.values[i]);
            }
            return x;
        },
        'count': function(prm) {
            if (prm.values && prm.values.length) {
                return prm.values.length;
            }
            return 0;
        },
        'avg': function(prm) {
            var x = 0;
            for (var i = 0; i < prm.values.length; i++) {
                x += parseFloat(prm.values[i]);
            }
            return x / prm.values.length;
        },
        'sort': function(prm) {
            prm['desc'] = prm['desc'] || false;
            if (prm['desc']) {
                return prm.values.sort(function(a, b) {
                    return a < b;
                });
            } else {
                return prm.values.sort(function(a, b) {
                    return b > a;
                });
            }
        },
        'newArray': function(prm) {
            _GVar[prm['var']] = [];
            return _GVar[prm['var']];
        },
        'newObject': function(prm) {
            _GVar[prm['var']] = {};
            return _GVar[prm['var']];
        },
        'push': function(prm) {
            _GVar[prm['var']].push(prm['value']);
            return _GVar[prm['var']];
        },
        'pushObject': function(prm) {
            _GVar[prm['var']][prm['key']] = prm['value'];
            return _GVar[prm['var']];
        },
        'removeObject': function(prm) {
            if (typeof _GVar[prm['var']] !== 'undefined') {
                delete _GVar[prm['var']][prm['key']];
            }
            return _GVar[prm['var']];
        },
        'pop': function(prm) {
            _GVar[prm['var']].pop();
            return _GVar[prm['var']];
        },
        'unshift': function(prm) {
            // Check if var exist then prioritize this 
            if (prm['var']) {
                _GVar[prm['var']].unshift(prm['value']);
                return _GVar[prm['var']];
            }

            // It's not using the global variable
            // Make sure it is an array
            var data = prm['data'];
            if (!AM.isArray(data)) {
                data = [data];
            }
            data.unshift(prm['value']);
            return data;
        },
        'shift': function(prm) {
            _GVar[prm['var']].shift();
            return _GVar[prm['var']];
        },
        'findArrayIndex':function(prm){
            if (prm['var']) {
                if (_GVar[prm['var']].indexOf(prm['value'])===-1){
                    return false;
                }else{
                    return true;
                }
                
            };
            return false;
        }
    }, 'Array');

    registerFunction({
        'toString': function(prm) {
            return (prm.value).toString();
        },
        'toBoolean': function(prm) {
            if (AM.isString(prm.value)) {
                var x = (prm.value).toLowerCase().trim();
                return !(x == 'false' || x == '0' || x == 'no')
            }
            return !!(prm.value);
        },
        'toInteger': function(prm) {
            return parseInt(prm.value);
        },
        'toFloat': function(prm) {
            var x = isNumber(prm.value) ? prm.value.toString() : '0';
            return parseFloat(x.replace(/,/g, ''));
        },
        'round': function(prm) {
            var x = isNumber(prm.value) ? prm.value.toString() : prm.value;
            return Math.round(x * 100) / 100;
        },
        'join': function(prm) {
            return (prm.value).join(prm.separator);
        },
        'split': function(prm) {
            // Set a default empty string for the separator
            var separator = prm.separator || "";
            // Make sure the value is string
            if (typeof prm.value == "string") {
                return prm.value.split(separator);
            }
            // No value return blank
            return prm.value;
        },
        'generateQRCode': function(prm) {
            prm = prm || {};

            // Prepare the callback function
            var element = this;
            var callbackWrap = function(data) {
                callback(element, prm.callback, data, prm.extra)
            }

            // Generate the qr code
            var canvas = document.createElement("canvas");
            canvas.style.width = prm.imageSize + "px";
            canvas.style.height = prm.imageSize + "px";
            drawQR(canvas, prm.value, prm.logo, function(data){
                // Create the return value
                var result = {};
                result.data = data;
                // if have extra data then include it
                if (prm.extra) {
                    result.extra = prm.extra;
                }
                // Trigger callback
                callbackWrap(result);
            });

            return true;
        },
        'generateBarcode': function(prm) {
            prm = prm || {};

            if (prm.value) {
                // Generate the bardode
                var canvas = document.createElement("canvas");

                // Generate barcode
                drawBarcode(canvas, prm);

                // Retrieve base64
                return canvas.toDataURL();
            }

            return '';
        }
    }, 'Conversion');

    registerFunction({
        'not': function(prm) {
            return !prm.value;
        },
        'or': function(prm) {
            return !!(prm.value1 || prm.value2);
        },
        'and': function(prm) {
            return !!(prm.value1 && prm.value2);
        },
        'xor': function(prm) {
            var x = prm.value1;
            var y = prm.value2;
            return (x && !y) || (!x && y);
        }
    }, 'Logical');

    registerFunction({
        'equal': function(prm) {
            return prm.value1 == prm.value2;
        },
        'notEqual': function(prm) {
            return prm.value1 != prm.value2;
        },
        'greater': function(prm) {
            return prm.value1 > prm.value2;
        },
        'less': function(prm) {
            return prm.value1 < prm.value2;
        },
        'equalOrGreater': function(prm) {
            return prm.value1 >= prm.value2;
        },
        'equalOrLess': function(prm) {
            return prm.value1 <= prm.value2;
        }
    }, 'Comparation');

    registerFunction({
        'isArray': function(prm) {
            return Array.isArray(prm.value);
        },
        'isNumber': function(prm) {
            return isNumber(prm.value);
        },
        'isEmail': function(prm) {
            var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return (prm.value.match(mailformat) ? true : false);
        }
    }, 'Validation');

    registerFunction({
        'objectKeys': function(prm) {
            prm.object = prm.object || {};
            return AM.keys(prm.object);
        },
        'objectValues': function(prm) {
            prm.object = prm.object || {};
            return AM.values(prm.object);
        },
        'dbDate': function(prm) {
            var withTime = prm['withTime'] || false;
            var add = prm['add'] || 0;
            var type = prm['type'] || 'days';
            return dbDate(addDate(add, null, type), withTime);
        },
        'addDate': function(prm) {
            var date = prm['date'] || new Date();
            var add = prm['add'] || 0;
            var type = prm['type'] || 'days';
        
            // Convert the string to date if not date type
            if (AM.isString(date)) {
                date = strToDate(date);
            }

            // Check if time is needed
            var withTime = false;
            if (type != 'days' && type != 'day') {
                withTime = true;
            }
            
            return dbDate(addDate(add, date, type), withTime);
        },
        'formatDate': function(prm) {
            if (!prm['date']) {
                return emobiqApp.formatDate(prm['format'], new Date());
            }
            if (!(prm['date'] instanceof Date)) {
                var date = prm['date'];
                // Resolving iOS date format for UTC
                if (!((date.includes('T')) && date.includes('Z'))) {
                    // Replace the first two '-' to / for iOS (within the date)
                    date = date.replace(/-/, '/');
                    date = date.replace(/-/, '/');
                }
                // Remove the milliseconds if have
                if (date.indexOf('.') > -1) {
                    date = date.substring(0, date.indexOf('.'));
                }
                // Get the timezone 
                return emobiqApp.formatDate(prm['format'], new Date(date));
            }
            return emobiqApp.formatDate(prm['format'], prm['date']);
        },
        'convertTimezoneDate': function(prm) {
            // Prepare the date object
            var date = new Date();

            // Get the date based on the parameter passed
            if (prm['date']) {
                date = new Date(prm['date']);
            }

            // Prepare the options
            var options = {};

            // Convert to timezone
            // if blank use local timezone
            if (prm['timezone']) {
                options.timeZone = prm['timezone'];
            }

            // Convert the date timezone
            return date.toLocaleString('en-US', options);
        },
        'strToDate': function(prm) {
            if (!prm['date']) {
                if (prm['date']==null){
                    return null;
                }else{
                    return strToDate(new Date());
                }
                
            }
            if (!(prm['date'] instanceof Date)) {
                // Get the timezone 
                return strToDate(prm['date']);
            }

        },
        'formatNumber': function(prm) {
            var num = prm['value'] || 0;
            var decimals = (prm['decimals'] + '') || '0';
            var decimalSep = prm['decimalSep'] || '.';
            var thousandSep = prm['thousandSep'] || '';
            return curFormat(num, decimals, decimalSep, thousandSep);
        },
        'dateDiff': function(prm) {
            var date1 = prm['value1'] || new Date();
            var date2 = prm['value2'] || new Date();
            if (AM.isString(date1)) {
                date1 = strToDate(date1);
            }
            if (AM.isString(date2)) {
                date2 = strToDate(date2);
            }
            var interval = prm['interval'] || 'days';
            return cDateDiff(date1, date2, interval);
        }
    }, 'Object');

    (function() {
        var s = ('9 horizontalTab,20 space,A lineFeed,D carriageReturn,1B escape,1B esc').split(',');
        var obj = {};
        AM.map(s, function(v) {
            var x = v.split(' ');
            obj['sc_' + x[1]] = function() {
                return String.fromCharCode(parseInt(x[0], 16));
                //return eval('"\\u'+pad(x[0],4)+'"');
            }
        });
        registerFunction(obj, 'SpecialCharacter');
    }());

    function regiterDefinedFunction(dt) {
        function fx(dti) {
            return function(prm) {
                var ebd = this || {};
                ebd.params = prm;
                _doAction(dti.process, ebd);
                if (dti.result) {
                    return _GVar[dti.result] || '';
                }
                return false;
            }
        }

        dt = dt || [];
        if (!AM.isArray(dt)) {
            dt = [dt];
        }
        var obj = {};
        for (var i = 0; i < dt.length; i++) {
            var dti = dt[i];
            if (dti.f && dti.process && AM.isArray(dti.process) && dti.process.length) {
                obj[dti.f] = fx(dti)
            }

        }
        registerFunction(obj, 'UserDefined');
    }

    /* source:lib/components/function/flow.js */


    registerFunction({
        'conditional': function(prm) {
            // Get the current action
            var ebd = this || {};
            if (prm.condition && typeof prm.condition != 'undefined') {
                if (prm.yesCallback) {
                    if (AM.isArray(prm.yesCallback)) {
                        _doAction(prm.yesCallback, AM.update(ebd, {
                            extra: prm['extra']
                        }));
                    } else {
                        runFunction(prm.yesCallback);
                    }
                }
                if (prm.yesValue) {
                    return prm.yesValue;
                }else{
                    if (typeof prm.yesValue != 'undefined'){
                        return prm.yesValue;
                    } else {
                        return '';
                    }
                }
            } else {
                if (prm.noCallback) {
                    if (AM.isArray(prm.noCallback)) {
                        _doAction(prm.noCallback, AM.update(ebd, {
                            extra: prm['extra']
                        }));
                    } else {
                        runFunction(prm.noCallback);
                    }
                }
                if (typeof prm.noValue != 'undefined') {
                    return prm.noValue;
                } else {
                    return '';
                }
            }
        },
        // Loop through the values
        'map': function(prm) {
            // Get the current action
            var ebd = this || {};
            // Check if value and callback is existing
            if (prm.values && prm.callback) {
                AM.map(prm.values, function(i, j) {
                    _doAction(prm.callback, AM.update(ebd, {
                        input: i,
                        extra: prm['extra']
                    }));
                })
                return true;
            }
            return false;
        },
        // For loop function
        'forLoop': function(prm) {
            // Get the current action
            var ebd = this || {};
            // Check if there is start and end values
            if (prm.start && prm.end) {
                // Loop through it
                for (var i = prm.start; i <= prm.end; i++) { 
                    _doAction(prm.callback, AM.update(ebd, {
                        input: i
                    }));
                }
            }
        }
    }, 'Flow');

    /**
     * Global Variables within emobiqApp javascript
     */
    var _GVar = {};
    var _lastPage = '';

    /**
     * Clearing all the timeouts/intervals that must be cleared
     */
    var gTimeouts = [];
    var gIntervals = [];
    function clearAllTimeoutAndInterval() {
        // timeouts
        for (var i = 0; i < gTimeouts.length; i++) {
            clearTimeout(gTimeouts[i]);
        }
        gTimeouts = [];

        // Intervals
        for (var i = 0; i < gIntervals.length; i++) {
            clearInterval(gIntervals[i]);
        }
        gIntervals = [];
    }

    function _getComponent(prm) {
        var comp = false;
        prm = prm || {};
        if (prm['componentId']) {
            comp = _Scope.componentById(prm['componentId']);
        } else if (prm['component']) {
            comp = _Scope.componentByName(prm['component']);
        }
        return comp || false;
    }

    registerFunction({
        'setVar': function(prm) {
            _GVar[prm['var']] = prm['value'];
            return _GVar[prm['var']];
        },
        'getVar': function(prm) {
            // Check if there is value
            if (!(typeof _GVar[prm['var']] === 'undefined') && _GVar[prm['var']] !== '') {
                return _GVar[prm['var']];
            }
            return prm['default'];
        },
        'getVarAttr': function(prm) {
            if (_GVar[prm['var']]) {
                if (_GVar[prm['var']][prm['attr']] !== null && _GVar[prm['var']][prm['attr']] !== undefined) {
                    // Make sure it's not a empty string if yes, go to default
                    if (_GVar[prm['var']][prm['attr']] !== '') {
                        return _GVar[prm['var']][prm['attr']];
                    }
                }
            }
            return prm['default'];
        },
        'clearAllVar': function(prm) {
            // Prepare the exception filter 
            var exceptionList = (prm['except'] ? prm['except'] : []);
            if (!$.isArray(exceptionList)) {
                exceptionList = [exceptionList];
            }

            // Loop through all the variables
            for (var variable in _GVar) {
                // Validate the variable name
                if ($.inArray(variable, exceptionList) == -1) {
                    delete _GVar[variable];
                }                
            }
            return true;
        },
        'getComponent': function(prm) {
            return _getComponent(prm);
        },
        'componentMethod': function(prm) {
            var comp = _getComponent(prm);
            if (comp && comp[prm['method']]) {
                return comp[prm['method']].apply(comp, prm['arguments'] || []);
            }
            return false;
        },
        // Enable the current page
        'enablePage': function(prm) {
            $('#pageDisable').hide();
            return true;
        },
        // Disable the current page
        'disablePage': function(prm) {
            $('#pageDisable').show();
            return true;
        },
        // Check if element is hidden or displayed
        'isElementShown': function(prm) {
            // Get the component details
            var comp = _getComponent(prm);
            if (comp._el) {
                return !$(comp._el).hasClass('hide');
            }
            return false;
        },
        // Hide the element either it's a component or snippet
        'hideElement': function(prm) {
            // Get the component details
            var comp = _getComponent(prm);
            if (comp._el) {
                $(comp._el).addClass('hide');
                return true;
            }
            return false;
        },
        // Show the element either it's a component or snippet
        'showElement': function(prm) {
            // Get the component details
            var comp = _getComponent(prm);
            // Check if the component is existing
            if (comp._el) {
                // Display the component
                $(comp._el).removeClass('hide');
                return true;
            }
            return false;
        },
        'setComponentValue': function(prm) {
            var comp = _getComponent(prm);
            if (comp && comp._onDataValue) {
                if (typeof(prm.value) === 'number' || comp._el.tagName == 'SELECT') {
                    comp._onDataValue(prm.value || 0);
                } else {
                    return comp._onDataValue(getLangCaption(prm['value']) || '');
                }
            }
            return false;
        },
        'setComponentLink': function(prm) {
            var comp = _getComponent(prm);
            if (comp && comp._el) {
                comp._el.onclick = function() {
                    window.open(prm['link']);
                }
                return true;
            }
            return false;
        },
        'openLink': function(prm) {
            if (prm['link']) {
                window.open((prm['link']), '_system');
                return true;
            }
            return false;
        },
        'setComponentAttr': function(prm) {
            var comp = _getComponent(prm);
            if (comp && comp.setAttr) {
                var obj = {};
                obj[prm['attr']] = prm['value'];
                comp.setAttr(obj);
                return true;
            }
            //if (comp && comp[prm['attr']]) { return comp[prm['attr']]=prm['value']; }
            return false;
        },
        'setComponentFocus': function(prm) {
            // Set timeout
            setTimeout(function() {
                // Get the component
                var comp = _getComponent(prm);
                if (comp) {
                    // See if it's an A component
                    if (comp._el.tagName == 'A' || comp._el.tagName == 'SPAN') {
                        comp._el.scrollIntoView();
                        return true;
                    } 
                    // Set the highlight text
                    if (prm['selectAllText'] == 'true') {
                        if (isCordova() && device.platform == 'iOS') {
                            comp._el.setSelectionRange(0, comp._el.value.length);
                        } else {
                            comp._el.select();
                        }                       
                    } else {
                        comp._el.focus();
                    }
                    // Set the keyboard display
                    setTimeout(function() {
                        if (!prm['hideKeyboard']) {
                            if (isCordova() && Keyboard) {
                                Keyboard.show();
                            }
                        } else {
                            if (isCordova() && Keyboard) {
                                Keyboard.hide();
                            }
                        }
                        return true;
                    }, 50);
                }
                return false;
            }, 100);
        },
        'componentValue': function(prm) {
            var comp = _getComponent(prm);
            if (comp) {
                if (comp._el.tagName == 'IMG') {
                    return comp._el['src'];
                } else if (comp._el.tagName == 'LABEL') {
                    return comp._el['innerText'];
                } else {
                    if (comp._picker) {
                        return comp._picker.toString('Y-m-d');
                    }
                    return comp._el['value'];                    
                }
            }
            return false;
        },
        'componentElement': function(prm) {
            var comp = _getComponent(prm);
            if (comp) {
                return comp._el;
            }
            return false;
        },
        'componentElAttr': function(prm) {
            var comp = _getComponent(prm);
            if (comp && prm['attr']) {
                if (prm['attr'] == 'value') {
                    if (comp._picker) {
                        return comp._picker.toString('Y-m-d');
                    }
                }
                return comp._el[prm['attr']];
            }
            return false;
        },
        'componentAttr': function(prm) {
            var comp = _getComponent(prm);
            if (comp && prm['attr']) {
                return comp.attr[prm['attr']];
            }
            return false;
        },
        'setComponentElAttr': function(prm) {
            var comp = _getComponent(prm);
            if (comp && prm['attr'] && prm['value']) {
                // Check if it's attribute or property
                if ($.inArray(prm['attr'], ['value', 'src']) > -1) {
                    if (typeof(prm.value) === 'number' || comp._el.tagName == 'SELECT') {
                        return comp._onDataValue(prm.value || 0);
                    } else {
                        return comp._onDataValue(getLangCaption(prm['value']) || '');
                    }
                } else if ($.inArray(prm['attr'], ['innerText']) > -1) {
                    if (typeof(prm.value) === 'number' || comp._el.tagName == 'SELECT') {
                        return comp._el[prm['attr']] = (prm['value'] || 0);
                    } else {
                        return comp._el[prm['attr']] = (getLangCaption(prm['value']) || '');
                    }
                } else {
                    return comp._el.setAttribute([prm['attr']], prm['value']);
                }
            }
            return false;
        },
        'remComponentElAttr': function(prm) {
            var comp = _getComponent(prm);
            if (comp && prm['attr']) {
                comp._el.removeAttribute(prm['attr']);
                return true;
            }
            return false;
        },
        // Scroll the scroll component to a specified child component
        'scroll': function(prm) {
            // Get the scroll component
            var compScroll = _getComponent({
                "component": prm['component'],
                "componentId": prm['componentId']
            });
            // Get the child component
            var compChild = _getComponent({
                "component": prm['toComponent'],
                "componentId": prm['toComponentId']
            });
            // Check if both scroll and child components are existing
            if (compScroll && compChild) {
                // Scroll to the specific component
                compChild._el.scrollIntoView();
                return true;
            }
            return false;
        },
        'objectAttr': function(prm) {
            if (prm['object']) {
                return prm['object'][prm['attr']];
            }
            return false;
        },
        'setObjectAttr': function(prm) {
            //if (prm['object'] && prm['attr'] && prm['value']) {
            if (prm['object'] && prm['attr'] && prm['value'] !== undefined) {
                prm['object'][prm['attr']] = prm['value'];
                return true;
            }
            return false;
        },
        'toArray': function(prm) {
            var a = [];
            prm['length'] = prm['length'] || 10;
            if (prm['length']) {
                for (var i = 1; i <= prm['length']; i++) {
                    if (typeof(prm['value' + i]) != 'undefined' && prm['value' + i]) {
                        a.push(prm['value' + i]);
                    }
                }
            }
            return a;
        },
        'toObject': function(prm) {
            return prm;
        },
        'setTimeout': function(prm) {
            // Make sure there is callback
            if (!prm['callback']) {
                return false;
            }

            // Set the default values
            var element = this;
            var timeout = prm['timeout'] || 0;
            var persistent = prm['persistent'] || false;
            
            var timeoutId = setTimeout(function() {
                callback(element, prm['callback'], null, prm['extra']);
            }, timeout);

            // Check if persistent then don't store
            if (!persistent) {
                gTimeouts.push(timeoutId);
            }

            return true;
        },
        'setInterval': function(prm) {
            // Make sure there is callback
            if (!prm['callback']) {
                return false;
            }

            // Set the default values
            var delay = prm['delay'] || 1000;
            var timeout = prm['timeout'] || 0;
            var persistent = prm['persistent'] || false;

            // Start time for triggering the event
            var intervalStartDate = new Date();

            var intervalId = setInterval(function() {
                // Check first if the timeout was reached
                if (timeout !== 0) {
                    if (timeout < (Math.abs(new Date() - intervalStartDate))) {
                        // Stop the action looping
                        clearInterval(intervalId);
                        return;
                    }
                }

                _doAction(prm['callback']);
            }, delay);

            // Check if persistent then don't store
            if (!persistent) {
                gIntervals.push(intervalId);
            }

            return intervalId;
        },
        'clearInterval': function(prm) {
            // Set the default values
            var intervalId = prm['intervalId'];

            // Check if there is id passed 
            if (intervalId) {
                clearInterval(intervalId);
                return true;
            }

            return false;
        },
        /**
         * Callback action to trigger a flow of actions 
         */
        'callback': function(prm) {
            // Trigger the callback if have
            if (prm.callback) {
                _doAction(prm.callback, AM.update(this, {
                    input: false,
                    extra: prm['extra']
                }));
            }

            // Return the value
            return prm.value;
        },
        'renderTemplate': function(prm) {
            prm['data'] = prm['data'] || {};
            prm['strip'] = prm['strip'] || false;
            if (prm['template']) {
                if (prm['strip']) {
                    var x = TE.template(prm['template']);
                    return x(prm['data']);
                } else {
                    var x = TE2.template(prm['template']);
                    return x(prm['data']);
                }
            } else {
                return false;
            }
        },
        'pullToRefresh':function(prm){
            var maxT=prm.maxTime?parseInt(prm.maxTime):2000;
            PullToRefresh.init({
                mainElement: '.' + prm.class, // above which element?
                onRefresh: function (cb) {
                    _doAction(prm.onRefresh, AM.update(self, {}));
                  setTimeout(function () {
                        cb();
                    
                  }, maxT);
                }
            });
        },
        /**
         * Function to trigger a inactivity timeout 
         */
        'inactivityTimeout':function(prm){
            var currentPage = getHash().p,
                useTime = new Date().getTime() / 1000,
                signOutTime = prm['timeout'] / 1000,
                currentPageOnly = prm['currentPageOnly'] || false;

            // Prepare the events to update the time usage
            $(document).on('touchmove mousemove keypress', function() {
                useTime = new Date().getTime() / 1000;
            });
                     
            // Start the timeout activity
            var signOutInterval = setInterval(function() {
                // Check the current time difference
                var diff = (new Date().getTime() / 1000) - useTime;

                // If need to disable if different page 
                if (currentPageOnly && currentPage != getHash().p){
                    clearInterval(signOutInterval);
                    return;
                }

                // Make the difference between use time with current time
                if (diff > signOutTime){
                    if (prm['callback'] && prm['callback'].length) {
                        _doAction(prm['callback']);
                        clearInterval(signOutInterval);
                    }                
                }
            }, 1000);
        },
        /**
         * Share the information to external application
         * cordova plugin add cordova-plugin-x-socialsharing
         */
        'share':function(prm) {
            // Store itself in a variable
            var element = this;
            
            // Generate the options based on the parameters passsed
            var options = {};
            options.subject = prm.subject || '';
            options.message = prm.message || '';

            // Just include if user passed the information
            if (prm.url) { 
                options.url = prm.url; 
            }
            if (prm.chooserTitle) { 
                options.chooserTitle = prm.chooserTitle; 
            }
            if (prm.appPackageName) {
                options.appPackageName = prm.appPackageName; 
            }
            if (prm.iPadCoordinates) {
                options.iPadCoordinates = prm.iPadCoordinates; 
            }

            // If it's files make sure it's in array mode
            if (prm.files) { 
                options.files = ($.isArray(prm.files) ? prm.files : [prm.files]); 
            }
            
            // Trigger the sharing function now
            window.plugins.socialsharing.shareWithOptions(options, 
                function(data) {
                    callback(element, prm.callback, data, prm['extra']);
                }, 
                function(error) {
                    callback(element, prm.errorCallback, error, prm['extra']);
                }
            );
        }
    }, 'App');

    registerFunction({
       'selectAll': function (prm) {
            var ebd = this || {};
            if (prm['dataset']) {
                var cmp = _Scope.componentByName(prm['dataset']);
                if (cmp && cmp.selectAll) {
                    return cmp.selectAll(function (dt) {
                        callback(ebd, prm.callback, dt, prm['extra']);
                    }, function (err) {
                        callback(ebd, prm.errCallback, err, prm['extra']);
                    });     
                }
            }
        },
        'selectBy': function (prm) {
            var ebd = this || {};
            if (prm['dataset']) {
                var cmp = _Scope.componentByName(prm['dataset']);
                if (cmp && cmp.selectBy) {
                    return cmp.selectBy(prm['by'], prm['value'], prm['first'], prm['operator'], function (dt) {
                        callback(ebd, prm.callback, dt, prm['extra']);
                    }, function (err) {
                        callback(ebd, prm.errCallback, err, prm['extra']);
                    });
                } 
            }
        },
        'filterData': function(prm) {
            var ebd = this || {};
            if (prm['dataset']) {
                var cmp = _Scope.componentByName(prm['dataset']);
                var first = prm['first'] || false;
                var or = prm['or'] || false;
                var lng = prm['length'] || 10;
                if (cmp && cmp.filter) {
                    var flt = [];
                    for (var i = 1; i <= lng; i++) {
                        if (prm['criteria' + i]) {
                            flt.push(prm['criteria' + i]);
                        }
                    }
                    return cmp.filter(flt, first, or, function (dt) {
                        callback(ebd, prm.callback, dt);
                    }, function (err) {
                        callback(ebd, prm.errCallback, err);
                    });
                }
            }
        },
       'updateBy': function (prm) {
            var ebd = this || {};
            if (prm['dataset']) {
                var cmp = _Scope.componentByName(prm['dataset']);
                if (cmp && cmp.updateBy) {
                    return cmp.updateBy(prm['by'], prm['value'], prm['data'], prm['operator'], prm['first'], function (dt) {
                        callback(ebd, prm.callback, dt, prm['extra']);
                    }, function (err) {
                        callback(ebd, prm.errCallback, err, prm['extra']);
                    });
                }
            }
        },
        'deleteBy': function (prm) {
            var ebd = this || {};
            if (prm['dataset']) {
                var cmp = _Scope.componentByName(prm['dataset']);
                if (cmp && cmp.deleteBy) {
                    return cmp.deleteBy(prm['by'], prm['value'], prm['operator'], prm['first'], function (dt) {
                        callback(ebd, prm.callback, dt, prm['extra']);
                    }, function (err) {
                        callback(ebd, prm.errCallback, err, prm['extra']);
                    });
                }
            }            
        },
        'insert': function (prm) {
            var ebd = this || {};
            if (prm['dataset']) {
                var cmp = _Scope.componentByName(prm['dataset']);
                if (cmp && cmp.insert) {
                    return cmp.insert(prm['dt'], function (dt) {
                        callback(ebd, prm.callback, dt, prm['extra']);
                    }, function (err) {
                        callback(ebd, prm.errCallback, err, prm['extra']);
                    });
                }
            }
        },
        'selectByMulti': function (prm) {
            var ebd = this || {};
            if (prm['dataset']) {
                var cmp = _Scope.componentByName(prm['dataset']);
                if (cmp && cmp.selectBy) {
                    return cmp.selectByMulti(prm, function (dt) {
                        callback(ebd, prm.callback, dt, prm['extra']);
                    }, function (err) {
                        callback(ebd, prm.errCallback, err, prm['extra']);    
                    });
                } 
            }
        },
        'updateByMulti': function (prm) {
            var ebd = this || {};
            if (prm['dataset']) {
                var cmp = _Scope.componentByName(prm['dataset']);
                if (cmp && cmp.updateByMulti) {
                    return cmp.updateByMulti(prm, function (dt) {
                        callback(ebd, prm.callback, dt, prm['extra']);
                    }, function (err) {
                        callback(ebd, prm.errCallback, err, prm['extra']);
                    });
                }
            }
        },
        'deleteByMulti': function (prm) {
            var ebd = this || {};
            if (prm['dataset']) {
                var cmp = _Scope.componentByName(prm['dataset']);
                if (cmp && cmp.deleteByMulti) {
                    return cmp.deleteByMulti(prm, function (dt) {
                        callback(ebd, prm.callback, dt, prm['extra']);
                    }, function (err) {
                        callback(ebd, prm.errCallback, err, prm['extra']);
                    });
                }
            }
        },
        'query': function (prm) {
            var ebd = this || {};
            var connector = prm['connector'] || prm['dataset'] || null;

            // Prepare the callbacks
            var successCallback = function (dt) {
                callback(ebd, prm.callback, dt, prm['extra']);
            }
            var errorCallback = function (err) {
                callback(ebd, prm.errCallback, err, prm['extra']);
            }

            // Check if have connector
            if (connector) {
                var cmp = _Scope.componentByName(connector);
                if (cmp && cmp.query) {
                    return cmp.query(prm['query'], successCallback, errorCallback);
                }
                return;
            }

            // If no valid connector use the sqlite as default
            // legacy stuff
            querySQLiteExecute(prm['query'], successCallback, errorCallback);
        },
        'dataToString': function(prm) {
            if (prm['dataset']) {
                var cmp = _Scope.componentByName(prm['dataset']);
                if (cmp && cmp.dataToString) {
                    return cmp.dataToString();
                }
            }
            return false;
        },
        'dataFromString': function(prm) {
            var ebd = this || {};
            if (prm['dataset']) {
                var cmp = _Scope.componentByName(prm['dataset']);
                if (cmp && cmp.dataFromString && prm['string']) {
                    return cmp.dataFromString(prm['string'], prm['append'] || false, function (dt) {
                        callback(ebd, prm.callback, dt, prm['extra']);
                    }, function (err) {
                        callback(ebd, prm.errCallback, err, prm['extra']);
                    });
                }
            }
        },
        'clearData': function(prm) {
            var ebd = this || {};
            if (prm['dataset']) {
                var cmp = _Scope.componentByName(prm['dataset']);
                if (cmp && cmp.clear) {
                    return cmp.clear(function (dt) {
                        callback(ebd, prm.callback, dt, prm['extra']);
                    }, function (err) {
                        callback(ebd, prm.errCallback, err, prm['extra']);
                    });
                }
            }
            return false;
        },
        'clearAllData': function(prm) {
            // Get all the connector components of the project
            var connComponents = _Scope._comps;

            // Prepare the exception filter 
            var exceptionList = (prm['except'] ? prm['except'] : []);
            if (!$.isArray(exceptionList)) {
                exceptionList = [exceptionList];
            }

            // Go through all components
            for (var i = 0; i < connComponents.length; i++) {
                // Validate the component and function
                if ($.inArray(connComponents[i]['name'], exceptionList) == -1 && connComponents[i].clear) {
                    connComponents[i].clear();
                }
            }
            return true;
        },
        'dataFieldToArray': function(prm) {
            if (prm['dataset']) {
                var cmp = _Scope.componentByName(prm['dataset']);
                if (prm['field']) {
                    return cmp.dataFieldToArray(prm['field']);
                }
            }
            return [];
        },
        'loadData': function(prm) {
            if (prm['dataset']) {
                var cmp = _Scope.componentByName(prm['dataset']);
                if (cmp && cmp.loadData) {
                    var ebd = this || {};
                    var cfg = prm.config || {};
                    cfg.parameter = cfg.parameter || {};
                    if (prm['fields']) {
                        cfg.parameter['fields'] = prm['fields'];
                    }
                    if (prm['limit']) {
                        cfg.parameter['limit'] = prm['limit'];
                    }
                    if (prm['page']) {
                        cfg.parameter['page'] = prm['page'];
                    }
                    if (prm['expand']) {
                        cfg.parameter['expand'] = prm['expand'];
                    }
                    if (prm['filter']) {
                        cfg.parameter['filter'] = prm['filter'];
                    }
                    if (prm['orFilter']) {
                        cfg.parameter['orFilter'] = prm['orFilter'];
                    }
                    if (prm['order']) {
                        cfg.parameter['order'] = prm['order'];
                    }
                    if (prm['extra']) {
                        cfg.parameter['extra'] = prm['extra'];
                    }

                    return cmp.loadData(function(dt) {
                        callback(ebd, prm.callback, dt, prm['extra']);
                    }, function(err) {
                        callback(ebd, prm.errCallback, err, prm['extra']);
                    }, cfg);
                }
            }
            return false;
        },
        'loadNext': function(prm) {
            if (prm['dataset']) {
                var cmp = _Scope.componentByName(prm['dataset']);
                if (cmp && cmp.loadNext) {
                    // If it contains a display dataset
                    if (prm['datasetDisplay']) {
                        // Set the display dataset load next to true
                        _Scope.componentByName(prm['datasetDisplay'])._topScroll = false;
                    }
                    // Trigger the load next
                    return cmp.loadNext(this, prm.beforeCallback);
                }
            }
            return false;
        },
        'insertData': function(prm) {
            if (prm['dataset']) {
                var ebd = this;
                var cmp = _Scope.componentByName(prm['dataset']);
                if (cmp && cmp.insertData) {

                    // Create the callback
                    var cba = function(o) {
                        if (prm.callback) {
                            _doAction(prm.callback, AM.update(ebd, {
                                input: o.dt
                            }));
                        }
                    }

                    var dtParam = [];
                    if (prm['param']) {
                        dtParam['fields'] = JSON.stringify(prm['param']);
                    }
                    if (dtParam) {
                        cmp.insertData(dtParam, cba);
                        return true;
                    }
                    return false;
                }
            }
            return false;
        },
        'updateData': function(prm) {
            if (prm['dataset']) {
                var ebd = this;
                var cmp = _Scope.componentByName(prm['dataset']);
                if (cmp && cmp.updateData) {

                    // Create the callback
                    var cba = function(o) {
                        if (prm.callback) {
                            _doAction(prm.callback, AM.update(ebd, {
                                input: o.dt
                            }));
                        }
                    }

                    var _id = prm['_id'] || null;
                    var dtParam = [];
                    if (prm['param']) {
                        dtParam['fields'] = JSON.stringify(prm['param']);
                    }
                    if (_id && dtParam) {
                        cmp.updateData(_id, dtParam, cba);
                        return true;
                    }
                    return false;
                }
            }
            return false;
        },
        'deleteData': function(prm) {
            if (prm['dataset']) {
                var ebd = this;
                var cmp = _Scope.componentByName(prm['dataset']);
                if (cmp && cmp.updateData) {

                    // Create the callback
                    var cba = function(o) {
                        if (prm.callback) {
                            _doAction(prm.callback, AM.update(ebd, {
                                input: o.dt
                            }));
                        }
                    }

                    var dtParam = null;
                    var _id = prm['_id'] || null;
                    if (_id) {
                        cmp.deleteData(_id, cba);
                        return true;
                    }
                    return false;
                }
            }
            return false;
        },
        // Raw connection to any http/https call
        'rawCall': function(prm) {
            // Check if the required parameters ar available
            if (prm['connector'] && prm['path']) {
                var ebd = this;
                var conn = _Scope.componentByName(prm['connector']);
                // Check if connector is valid
                if (conn) {
                    // Prepare the callback functions
                    var cba = function(o) {
                        if (prm.callback) {
                            console.log(o);
                            _doAction(prm.callback, AM.update(ebd, {
                                input: o.dt,
                                extra: prm['extra']
                            }));
                        }
                    }
                    var ecba = function(o) {
                        if (prm.errCallback) {
                            _doAction(prm.errCallback, AM.update(ebd, {
                                input: o,
                                extra: prm['extra']
                            }));
                        }
                    }
                    // Run the request
                    conn.request(prm, cba, ecba);
                } else {
                    if (prm.errCallback) {
                        _doAction(prm.errCallback, AM.update(this, {
                            input: {
                                err: 'Connector is not existing.'
                            }
                        }));
                    }
                }
            } else {
                if (prm.errCallback) {
                    _doAction(prm.errCallback, AM.update(this, {
                        input: {
                            err: 'No connector and path.'
                        }
                    }));
                }
            }
        },
        'crmCall': function(prm) {
            if (prm['connector'] && prm['ent'] && prm['data']) {
                var ebd = this;
                var conn = _Scope.componentByName(prm['connector']);
                if (conn) {
                    var cba = function(o) {
                        if (prm.callback) {
                            //prm.callback._embed={input:o.dt};
                            _doAction(prm.callback, AM.update(ebd, {
                                input: o.dt
                            }));
                            //runFunction(prm.callback);
                        }
                    }
                    var ecba = function(o) {
                        if (prm.errCallback) {
                            //prm.errCallback._embed={input:o};
                            _doAction(prm.errCallback, AM.update(ebd, {
                                input: o
                            }));
                            //runFunction(prm.errCallback);
                        }
                    }
                    var xprm = {
                        'api': 'data',
                        'ent': prm['ent'],
                        'a': 'call'
                    };
                    if (prm['function']) {
                        xprm = AM.update(xprm, {
                            'function': prm['function']
                        });
                    }
                    conn.request(xprm, {
                        'data': prm['data']
                    }, cba, ecba);
                }

            }
        },
        // Acumatica Call
        'acumaticaCall': function(prm) {
            // Make sure there is value for connector
            if (prm['connector']) {
                // Generate and get the needed variables
                var ebd = this;
                var conn = _Scope.componentByName(prm['connector']);

                // Make sure it's a valid connector
                if (conn) {
                    // Prepare the callbacks
                    var cba = function(o, extra) {
                        if (prm.callback) {
                            _doAction(prm.callback, AM.update(ebd, {
                                input: o.dt,
                                extra: extra
                            }));
                        }
                    }
                    var ecba = function(o, extra) {
                        if (prm.errCallback) {
                            _doAction(prm.errCallback, AM.update(ebd, {
                                input: o,
                                extra: extra
                            }));
                        }
                    }

                    // Prepare the parameters to be passed
                    var xprm = {
                        'api': 'data',
                        'a': 'call',
                        'entity': prm['ent'],
                        'function': prm['function']
                    };

                    // Include extra in the main parameter
                    if (prm['extra']) {
                        xprm['extra'] = prm['extra'];
                    }

                    // Trigger the request
                    conn.request(xprm, {
                        'data': prm['data'],
                        'files': prm['files']
                    }, cba, ecba);
                }
            }
        },
        // NAV Call
        'navCall': function(prm) {
            if (prm['connector']) {
                var ebd = this;
                var conn = _Scope.componentByName(prm['connector']);
                if (conn) {
                    var cba = function(o, extra) {
                        if (prm.callback) {
                            //prm.callback._embed={input:o.dt};
                            _doAction(prm.callback, AM.update(ebd, {
                                input: o.dt,
                                extra: extra
                            }));
                            //runFunction(prm.callback);
                        }
                    }
                    var ecba = function(o, extra) {
                        if (prm.errCallback) {
                            //prm.errCallback._embed={input:o};
                            _doAction(prm.errCallback, AM.update(ebd, {
                                input: o,
                                extra: extra
                            }));
                            //runFunction(prm.errCallback);
                        }
                    }

                    // Check if param have type then set it
                    var type = 'data';
                    var a = 'call';
                    var subpath;

                    if (prm['type']) {
                        // Check if it's an api type or nav path
                        switch(prm['type'].toLowerCase()) {
                            case 'page':
                            subpath = 'Page';
                            break;
                          case 'codeunit':
                            subpath = 'Codeunit';
                            break;
                          default:
                            type = prm['type'];
                            a = 'get';
                        }
                    }

                    var xprm = {
                        'api': type,
                        'ent': prm['ent'],
                        'a': a,
                    };

                    if (subpath) {
                        xprm['subpath'] = subpath;
                    }

                    if (conn.services[prm['ent']] && conn.services[prm['ent']]['sp']) {
                        xprm['subpath'] = conn.services[prm['ent']]['sp'];
                    }

                    if (prm['function']) {
                        xprm = AM.update(xprm, {
                            'function': prm['function']
                        });
                    }

                    // Include extra in the main parameter
                    if (prm['extra']) {
                        xprm['extra'] = prm['extra'];
                    }
                    
                    // Check if this is a batch call
                    // this is for oData
                    if (prm['batch']) {
                        xprm['batch'] = prm['batch'];
                    }

                    if (prm['subfunction']) {
                        conn.request(xprm, {
                            'subfunction': prm['subfunction'],
                            'data': prm['data']
                        }, cba, ecba);
                    } else {
                        conn.request(xprm, {
                            'data': prm['data']
                        }, cba, ecba);
                    }

                }

            }
        },
        // Dynamcis GP Call
        'dynamicsGPCall': function(prm) {
            // Check if all the required parameters are passed
            if (prm['connector'] && prm['function']) {
                // Prepare the variables to be used
                var ebd = this;
                var conn = _Scope.componentByName(prm['connector']);
                // Check if the connector is existing
                if (conn) {
                    // Prepare the callbacks
                    var cba = function(o) {
                        if (prm.callback) {
                            _doAction(prm.callback, AM.update(ebd, {
                                input: o.dt
                            }));
                        }
                    }
                    var ecba = function(o) {
                        if (prm.errCallback) {
                            _doAction(prm.errCallback, AM.update(ebd, {
                                input: o
                            }));
                        }
                    }
                    // Prepare the main parameter
                    var xprm = {
                        'api': 'data',
                        'function': prm['function'],
                        'a': 'call'
                    };
                    // Send the request
                    conn.request(xprm, {'data': prm['data']}, cba, ecba);
                }
            }
        },
        // crm 365 call,
        'crm365Call': function(prm) {
            // Check if all the required parameters are passed
            if (prm['connector'] && prm['function']) {
                // Prepare the variables to be used
                var ebd = this;
                var conn = _Scope.componentByName(prm['connector']);
                // Check if the connector is existing
                if (conn) {
                    // Prepare the callbacks
                    var cba = function(o) {
                        if (prm.callback) {
                            _doAction(prm.callback, AM.update(ebd, {
                                input: o.dt
                            }));
                        }
                    }
                    var ecba = function(o) {
                        if (prm.errCallback) {
                            _doAction(prm.errCallback, AM.update(ebd, {
                                input: o
                            }));
                        }
                    }
                    // Prepare the main parameter
                    var xprm = {
                        'a': prm['function']
                    };
                    // Send the request
                    var dt = conn.attr;
                    if (typeof prm['data']=='object'){
                        dt.data =JSON.stringify(prm['data']);
                    }else{
                        dt.data =prm['data'];
                    }
                    
                    
                    conn.request(xprm,dt, cba, ecba);
                }
            }
        },
        // SAGE Call
        'sageCall': function(prm) {
            // Make sure there is value for connector
            if (prm['connector']) {
                // Generate and get the needed variables
                var ebd = this;
                var conn = _Scope.componentByName(prm['connector']);

                // Make sure it's a valid connector
                if (conn) {
                    // Prepare the callbacks
                    var cba = function(o) {
                        if (prm.callback) {
                            _doAction(prm.callback, AM.update(ebd, {
                                input: o.dt
                            }));
                        }
                    }
                    var ecba = function(o) {
                        if (prm.errCallback) {
                            _doAction(prm.errCallback, AM.update(ebd, {
                                input: o
                            }));
                        }
                    }

                    // Prepare the parameters to be passed
                    var xprm = {
                        'api': 'data',
                        'a': 'call',
                        'entity': prm['ent'],
                        'function': prm['function']
                    };

                    // Include extra in the main parameter
                    if (prm['extra']) {
                        xprm['extra'] = prm['extra'];
                    }

                    // Trigger the request
                    conn.request(xprm, {
                        'data': prm['data']
                    }, cba, ecba);
                }
            }
        },
        // SAP B1 Call
        'sapB1Call': function(prm) {
            // Check if all the required parameters are passed
            if (prm['connector'] && prm['function']) {
                // Prepare the variables to be used
                var ebd = this;
                var conn = _Scope.componentByName(prm['connector']);
                // Check if the connector is existing
                if (conn) {
                    // Prepare the callbacks
                    var cba = function(o) {
                        if (prm.callback) {
                            _doAction(prm.callback, AM.update(ebd, {
                                input: o.dt
                            }));
                        }
                    }
                    var ecba = function(o) {
                        if (prm.errCallback) {
                            _doAction(prm.errCallback, AM.update(ebd, {
                                input: o
                            }));
                        }
                    }
                    // Prepare the main parameter
                    var xprm = {
                        'api': 'data',
                        'function': prm['function'],
                        'a': 'call'
                    };
                    // Include extra in the main parameter
                    if (prm['extra']) {
                        xprm['extra'] = prm['extra'];
                    }
                    // Send the request
                    conn.request(xprm, {'data': prm['data']}, cba, ecba);
                }
            }
        },
        // SOAP Call
        'soapCall': function(prm) {
            // Check if all the required parameters are passed
            if (prm['connector'] && prm['function']) {
                // Prepare the variables to be used
                var ebd = this;
                var conn = _Scope.componentByName(prm['connector']);
                // Check if the connector is existing
                if (conn) {
                    // Prepare the callbacks
                    var cba = function(o) {
                        if (prm.callback) {
                            _doAction(prm.callback, AM.update(ebd, {
                                input: o.dt
                            }));
                        }
                    }
                    var ecba = function(o) {
                        if (prm.errCallback) {
                            _doAction(prm.errCallback, AM.update(ebd, {
                                input: o
                            }));
                        }
                    }
                    // Prepare the main parameter
                    var xprm = {
                        'api': 'data',
                        'function': prm['function'],
                        'a': 'call'
                    };
                    // Send the request
                    conn.request(xprm, {'data': prm['data']}, cba, ecba);
                }
            }
        },
        'axCall': function(prm) {
            if (prm['connector'] && prm['ent'] && prm['data']) {
                var ebd = this;
                var conn = _Scope.componentByName(prm['connector']);
                if (conn) {
                    var cba = function(o) {
                        if (prm.callback) {
                            //prm.callback._embed={input:o.dt};
                            _doAction(prm.callback, AM.update(ebd, {
                                input: o.dt
                            }));
                            //runFunction(prm.callback);
                        }
                    }
                    var ecba = function(o) {
                        if (prm.errCallback) {
                            //prm.errCallback._embed={input:o};
                            _doAction(prm.errCallback, AM.update(ebd, {
                                input: o
                            }));
                            //runFunction(prm.errCallback);
                        }
                    }
                    var xprm = {
                        'api': 'data',
                        'ent': prm['ent'],
                        'a': 'call'
                    };
                    if (prm['function']) {
                        xprm = AM.update(xprm, {
                            'function': prm['function']
                        });
                    }
                    conn.request(xprm, {
                        'data': prm['data']
                    }, cba, ecba);
                }

            }
        },
        'mssqlCall': function(prm) {
            if (prm['connector'] && prm['ent'] && prm['data']) {
                var ebd = this;
                var conn = _Scope.componentByName(prm['connector']);
                if (conn) {
                    var cba = function(o) {
                        if (prm.callback) {
                            _doAction(prm.callback, AM.update(ebd, {
                                input: o.dt
                            }));
                        }
                    }
                    var ecba = function(o) {
                        if (prm.errCallback) {
                            _doAction(prm.errCallback, AM.update(ebd, {
                                input: o
                            }));
                        }
                    }

                    var xprm = {
                        'api': 'data',
                        'ent': prm['ent'],
                        'a': 'call'
                    };
                    if (prm['function']) {
                        xprm = AM.update(xprm, {
                            'function': prm['function']
                        });
                    }

                    var req = {};
                    if (prm['data']) {
                        req = AM.update(req, {
                            'data': prm['data']
                        });
                    }
                    if (prm['filter']) {
                        req = AM.update(req, {
                            'filter': prm['filter']
                        });
                    }

                    conn.request(xprm, req, cba, ecba);
                }

            }
        },
        // Execute the mssql query
        'mssqlQuery': function(prm) {
            // Make sure required parameters are passed
            if (prm['connector'] && prm['query']) {
                // Prepare the needed variables for this function
                var ebd = this;
                var conn = _Scope.componentByName(prm['connector']);
                // Check if the connection is existing
                if (conn) {
                    // Success callback
                    var cba = function(o) {
                        if (prm.callback) {
                            _doAction(prm.callback, AM.update(ebd, {
                                input: o.dt
                            }));
                        }
                    }
                    // Fail callback
                    var ecba = function(o) {
                        if (prm.errCallback) {
                            _doAction(prm.errCallback, AM.update(ebd, {
                                input: o
                            }));
                        }
                    }
                    // Prepare the main parameters
                    var xprm = {
                        'api': 'data',
                        'ent': prm['ent'],
                        'a': 'query'
                    };
                    // Prepare the data parameters
                    var req = {};
                    if (prm['query']) {
                        req = AM.update(req, {
                            'query': prm['query']
                        });
                    }
                    // Trigger the request
                    conn.request(xprm, req, cba, ecba);
                }
            } 
        },
        'setComboOptions': function(prm) {
            if (prm['combo']) {
                var cmp = _Scope.componentByName(prm['combo']);
            } else if (prm['comboId']) {
                var cmp = _Scope.componentById(prm['comboId']);
            }

            if (cmp && cmp._el) {
                if (prm['data'] && AM.isArray(prm['data']) && prm['valueField']) {
                    AM.RCN(cmp._el);

                    // Loop through the data
                    for (var i = 0; i < prm['data'].length; i++) {

                        // Generic variables
                        var fields;

                        // Get the current record
                        var record = prm['data'][i];
                        
                        // function to check if the value is json
                        var isJson = function(str) {
                            try {
                                JSON.parse(str);
                            } catch (e) {
                                return false;
                            }
                            return true;
                        }
                        
                        var value = '';
                        // if value is json then apply separator
                        if(isJson(prm['valueField'])){
                            var separator = prm['valueSeparator'] ? prm['valueSeparator'] : "-"
                            var valueFieldArray = JSON.parse(prm['valueField'])
                            for(var index=0; index<valueFieldArray.length; index++){
                                if(index>0){
                                    value+=separator
                                }
                                // Get the correct value if have subfield
                                fields = valueFieldArray[index].split(".");
                                var tempValue = ""
                                for (var ctr in fields) {
                                    // Check if value already have value then use it
                                    if (tempValue == '') {
                                        tempValue = record[fields[ctr]];
                                    } else {
                                        tempValue = tempValue[fields[ctr]];
                                    }
                                }
                                value+=tempValue
                            }
                        }else{
                            fields = prm['valueField'].split(".");
                            for (var ctr in fields) {
                                // Check if value already have value then use it
                                if (value == '') {
                                    value = record[fields[ctr]];
                                } else {
                                    value = value[fields[ctr]];
                                }
                            }
                        }

                        var display = '';
                        // if value is json then apply separator
                        if(isJson(prm['displayField'])){
                            var separator = prm['displaySeparator'] ? prm['displaySeparator'] : "-"
                            var displayFieldArray = JSON.parse(prm['displayField'])
                            for(var index = 0; index<displayFieldArray.length; index++){
                                if(index>0){
                                    display+=separator
                                }
                                // Get the correct value if have subfield
                                fields = displayFieldArray[index].split(".");
                                var tempDisplay = ""
                                for (var ctr in fields) {
                                    // Check if display already have value then use it
                                    if (tempDisplay == '') {
                                        tempDisplay = record[fields[ctr]];
                                    } else {
                                        tempDisplay = tempDisplay[fields[ctr]];
                                    }
                                }
                                display+=tempDisplay
                            }
                        }else{
                            fields = prm['displayField'].split(".");
                            for (var ctr in fields) {
                                // Check if display already have value then use it
                                if (display == '') {
                                    display = record[fields[ctr]];
                                } else {
                                    display = display[fields[ctr]];
                                }
                            }
                        }

                        AM.ACN(cmp._el, AM.OPTION({ value: value }, getLangCaption(display)));
                    }

                    cmp._onDataValue(cmp._value);
                    return true;
                }
            }

            return false;
        }
    }, 'Dataset');


    registerFunction({
        'canvasToDataURL': function(prm) {
            // Set the canvas if it exists
            if (prm['canvas']) {
                prm['component'] = prm['canvas'];
            }
            // Convert the canvas
            if (prm['component'] || prm['componentId']) {
                var cmp = _getComponent(prm);
                if (cmp && cmp._el && cmp._el.canvas) {
                    return cmp._el.canvas.toDataURL();
                }
            }
            return false;
        },
        'canvasToImage': function(prm) {
            if (prm['canvas']) {
                var cmp = _Scope.componentByName(prm['canvas']);
                var img = _Scope.componentByName(prm['image']);
                if (cmp && cmp._el && cmp._el.canvas && img && img._el && img._el.src) {
                    img._el.src = cmp._el.canvas.toDataURL();
                    return true;
                }
            }
            return false;
        },
        // Generate canvas from some values
        'canvasGenerateFrom': function(prm) {
            var type = prm['type'] || 'base64';
            var value = prm['value'] || '';
            var fileType = prm['fileType'] || 'image';
            var documentSize = prm['documentSize'] || '';

            var element = this;
            var extra = prm['extra'];

            // Prepare the canvas
            var canvas = document.createElement('canvas');
            canvas.height = 0;
            canvas.width = 0;
            var context = canvas.getContext("2d");

            // Check what type is to be converted to canvas
            switch(type.toLowerCase()) {
                case 'base64': // Base 64
                    // Check the file type
                    switch(fileType.toLowerCase()) {
                        case 'image': // Base 64 - Image
                            // Use Image class to generate it
                            var data = "data:image/png;base64," + value;
                            var image = new Image();
                            image.onload = function() {
                                canvas.height = this.height;
                                canvas.width = this.width;
                                ctx.drawImage(image, 0, 0);

                                // Return the canvas
                                callback(element, prm.callback, canvas, extra);
                            };
                            image.src = data;
                            break;
                        case 'pdf': // Base 64 - PDF
                            // Use PDFJS to generate it
                            var data = atob(value);

                            pdfjsLib.GlobalWorkerOptions.workerSrc = "script/vendor/pdfjs/pdf.worker.js";

                            var loadingTask = pdfjsLib.getDocument({data: data});
                            loadingTask.promise.then(
                                function(pdf) {     
                                    // Prepare the default value
                                    var processedPages = 1;
                                    var scale = 1.0;

                                    // Generate all the pages
                                    renderPage(processedPages);

                                    // Render PDF Page
                                    function renderPage(pageNo) {
                                        // Process the page
                                        pdf.getPage(pageNo).then(function(page) {
                                            // Check if scaling need to be adjusted if have document size
                                            if (documentSize) {
                                                switch (documentSize.toLowerCase()) {
                                                    case 'a4':
                                                        // scale = 1490 / page.getViewport({scale: 1.0}).width; // PPI (180)
                                                        scale = 1480 / page.getViewport({scale: 1.0}).width; // TEMPORARY, relates to ppi - Brother Printer
                                                        break
                                                    default:
                                                        scale = parseInt(documentSize) / page.getViewport({scale: 1.0}).width;
                                                }
                                            }

                                            // Check if the value of scale is NaN then set to default
                                            if (isNaN(scale)) {
                                                scale = 1.0;
                                            }

                                            var viewport = page.getViewport({ scale: scale, });

                                            // Prepare canvas using PDF page dimensions
                                            var pdfCanvas = document.createElement('canvas');
                                            var pdfContext = pdfCanvas.getContext('2d');
                                            pdfCanvas.height = viewport.height;
                                            pdfCanvas.width = viewport.width;

                                            // Render PDF page into canvas context
                                            var renderContext = {
                                                canvasContext: pdfContext,
                                                viewport: viewport
                                            };
                                            var renderTask = page.render(renderContext);
                                            renderTask.promise.then(function () {
                                                // Copy the current canvas data
                                                var oldCanvas = document.createElement('canvas');
                                                var oldContext = oldCanvas.getContext('2d');
                                                oldCanvas.width = canvas.width;
                                                oldCanvas.height = canvas.height;
                                                if (canvas.height != 0) {
                                                    oldContext.drawImage(canvas, 0, 0);
                                                }

                                                // Resize the canvas and redraw the images
                                                canvas.height += pdfCanvas.height;
                                                canvas.width = (pdfCanvas.width > canvas.width ? pdfCanvas.width : canvas.width);
                                                if (oldCanvas.height != 0) {
                                                    context.drawImage(oldCanvas, 0, 0);
                                                }
                                                context.drawImage(pdfCanvas, 0, oldCanvas.height);
                                            
                                                // Check if already the last one else continue to render
                                                processedPages++;
                                                if (processedPages <= pdf.numPages) {
                                                    renderPage(processedPages);
                                                } else {
                                                    // Return the canvas
                                                    callback(element, prm.callback, canvas, extra);
                                                }
                                            });
                                        });
                                    }
                                }, function(error) {
                                    callback(element, prm.errorCallback, error, extra);
                                }
                            );
                            break;
                        default: // Base 64 - Not Supported
                            callback(element, prm.errorCallback, "Base64 File Type passed is not valid.", extra);
                            return false;
                    }
                    break; 
                default: // Not Supported
                    callback(element, prm.errorCallback, "Type passed is not valid.", extra);
                    return false;
            }
            return true;
        },
        // Resize canvas
        'canvasResize': function(prm) { 
            // Prepare the standard variables
            var element = this;
            var extra = prm.extra;

            // Validate if it contains a valid canvas
            if (!prm.canvas || !(prm.canvas instanceof HTMLCanvasElement)) {
                callback(element, prm.errorCallback, 'The passed canvas is invalid.', extra);
                return false;
            }

            // Get the expected width and height but if nothing get the default size
            var canvasWidth = prm.canvasWidth || prm.canvas.width;
            var canvasHeight = prm.canvasHeight || prm.canvas.height;

            // Prepare the new canvas
            var canvas = document.createElement('canvas');
            canvas.height = canvasHeight;
            canvas.width = canvasWidth;

            // Get the canvas context
            var context = canvas.getContext('2d');

            // Set the default background color
            context.fillStyle = 'white';
            context.fillRect(0, 0, canvasWidth, canvasHeight);

            // Draw the passed canvas on top of the new canvas
            context.drawImage(prm.canvas, 0, 0);

            // Return the new canvas
            callback(element, prm.callback, canvas, extra);
            return true;
        }
    }, 'App');

    /** SNS Panji */
    // aris add 25 november 2016
    // aris update 
    var checkTokenDevice=function (res,token,attr,prm,cb){
        var attr=attr;
        var topicName = attr.TopicSubscribe;
        var urlSource = attr.apiUrl;
        var devId = attr.devId||null;
        
        var oldToken = localStorage.getItem('devicetoken') || null;
        localStorage.setItem('devicetoken', token);
        var data = {};
        data.token = token;
        
        if (oldToken) {
            data.old_token = oldToken
        } else {
            data.old_token = token
        };;

        if (prm['userId']) {
            data.username = prm['userId']
        }else{

            var rsp=res?JSON.parse(res):{};
            if (rsp && rsp.user_name){
                data.username= rsp.user_name;
            }
           
        };
      
        
        var dtTopic={
            token: token,
            topic: topicName
        };
        if (devId){
            dtTopic.devel_id=devId
        }

        new PushAjax({
            url: urlSource + '/api/device',
            data: data,
            method: 'POST',
            header: function (req) {
                req.setRequestHeader("Authorization", "Basic " + btoa(attr.user + ":" + attr.password));
                req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            },
            success: function (res, req) {
                var dataResponse = JSON.parse(res);
                setTimeout(function () {
                    new PushAjax({
                        url: urlSource + '/api/topic',
                        data: dtTopic,
                        method: 'POST',
                        header: function (req) {
                            req.setRequestHeader("Authorization", "Basic " + btoa(attr.user + ":" + attr.password));
                            req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                        },
                        success: function (res, req) {
                            var subResponse = JSON.parse(res);
                            cb(null,res);
                            console.log('Response topic ' + topicName, subResponse);


                        },
                        error: function (res, req) {
                            cb(res);
                            
                        }
                    });
                }, 500);
            },
            error: function (res, req) {
                console.log('error', res);
                cb(res);
            }
        })
    };



    var beaconRegion=null;
    var beaconStart=false;
    var createBeaconRegion = function (identifier, uuid) {
        var beaconRegion = new cordova.plugins.locationManager.BeaconRegion(identifier, uuid);
        return beaconRegion;
        
    };

    registerFunction({
        'HNSPushNotification': function (prm) {
            // Take the information from the component
            if (prm['pushNotif']) {
                var self = this;
                var conn = _Scope.componentByName(prm['pushNotif']);
                var attr = conn.attr;
            }

            // Make sure it's mobile
            if (!isCordova()) {
                if (prm.errorCallback) {
                    _doAction(prm.errorCallback, AM.update(self, {
                        input: 'This is not a mobile device.'
                    }));
                }
                return false;
            }

            // Check if the connector and function is existing
            if (conn && typeof FCMPlugin !== "undefined") {
                var topicName = attr.TopicSubscribe;
                var urlSource = attr.apiUrl;

                FCMPlugin.getToken(function (token) {
                    if (token) {
                        new PushAjax({
                            url: urlSource + '/api/device/' + token,
                            method: 'GET',
                            header: function (req) {
                                req.setRequestHeader("Authorization", "Basic " + btoa(attr.user + ":" + attr.password));
                                req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                            },
                            success: function (res, req) {
                                var result = JSON.parse(res);
                                checkTokenDevice(res,token,attr,prm,function(e,o){
                                    console.log('Error--->',e);
                                    console.log('Success--->',o);
                                })
                            },
                            error: function (res, req) {
                                var res =JSON.parse(res);
                                checkTokenDevice(res,token,attr,prm,function(e,o){
                                    console.log('Error--->',e);
                                    console.log('Success--->',o);
                                })
                            }
                        });
                    };
                });

                var ebd = self;
                ebd = ebd || {};
                FCMPlugin.onNotification(function (data) {
                    console.log('data push recevice------', data);
                    if (data.wasTapped) {
                        // Notification was received on device tray and tapped by the user.
                        if (prm.onTap) {
                            _doAction(prm.onTap, AM.update(self, {
                                input: data
                            }));
                        }
                    } else {
                        // Notification was received in foreground. Maybe the user needs to be notified.
                        if (prm.onReceive) {
                            _doAction(prm.onReceive, AM.update(self, {
                                input: data
                            }));
                        }
                    }
                });
            } else {
                if (prm.errorCallback) {
                    _doAction(prm.errorCallback, AM.update(self, {
                        input: 'The connector is not existing or the push notification is disabled.'
                    }));
                }
                return false;
            }
        },
        'HNSPublishMessage': function (prm) {
            // Take the information from the component
            if (prm['pushNotif']) {
                var self = this;
                var conn = _Scope.componentByName(prm['pushNotif']);
                var attr = conn.attr;
            }

            // Check if the connector
            if (conn) {
                if (prm['topic']) {
                    var topicName = prm['topic'];
                } else {
                    var topicName = attr.TopicSubscribe;
                }
                var urlSource = attr.apiUrl;
                var devId = attr.devId||null;
                var token = localStorage.getItem('devicetoken');
                var dtSend = {
                    "topic": topicName,
                    "token": token,
                    "payload[notification][title]": prm['title'],
                    "payload[notification][body]": prm['message'],
                    "payload[notification][sound]":"default",
                    "payload[data][title]": prm['title'],
                    "payload[data][message]": prm['message'],
                    "payload[data][data]": prm['data'] || "",
                    "payload[notification][click_action]":'FCM_PLUGIN_ACTIVITY'
                };
                if (devId){
                    dtSend.devel_id=devId;
                }
                if (token !== undefined || token != null) {
                    new PushAjax({
                        url: urlSource + '/api/publish',
                        data: dtSend,
                        method: 'POST',
                        header: function (req) {
                            req.setRequestHeader("Authorization", "Basic " + btoa(attr.user + ":" + attr.password));
                            req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                        },
                        success: function (res, req) {
                            _doAction(prm.callback, AM.update(self, {
                                input: JSON.parse(res)
                            }));
                        },
                        error: function (res, req) {
                            _doAction(prm.errorCallback, AM.update(self, {
                                input: JSON.parse(res)
                            }));
                        }
                    });
                }
            } else {
                if (prm.errorCallback) {
                    _doAction(prm.errorCallback, AM.update(self, {
                        input: 'The connector is not existing or the push notification is disabled.'
                    }));
                }
                return false;
            }
        },
        'HNSPushMessageByUserId': function (prm) {
            // Take the information from the component
            if (prm['pushNotif']) {
                var self = this;
                var conn = _Scope.componentByName(prm['pushNotif']);
                var attr = conn.attr;
            }

            // Check if the connector
            if (conn) {
                var urlSource = attr.apiUrl;
                var devId = attr.devId||null;
                var dtSend = {
                    "username": prm['userId'],
                    "payload[notification][title]": prm['title'],
                    "payload[notification][body]": prm['message'],
                    "payload[notification][sound]":"default",
                    "payload[data][title]": prm['title'],
                    "payload[data][message]": prm['message'],
                    "payload[data][data]": prm['data'] || "",
                    "payload[notification][click_action]":'FCM_PLUGIN_ACTIVITY'
                };
                if (devId){
                    dtSend.devel_id=devId;
                }
                new PushAjax({
                    url: urlSource + '/api/push',
                    data: dtSend,
                    method: 'POST',
                    header: function (req) {
                        req.setRequestHeader("Authorization", "Basic " + btoa(attr.user + ":" + attr.password));
                        req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                    },
                    success: function (res, req) {
                        if (prm.callback) {
                            _doAction(prm.callback, AM.update(self, {
                                input: JSON.parse(res)
                            }));
                        }
                    },
                    error: function (res, req) {
                        if (prm.errorCallback) {
                            var ebd = self;
                            ebd = ebd || {};
                            _doAction(prm.errorCallback, AM.update(ebd, {
                                input: JSON.parse(res)
                            }));
                        }
                    }
                });
            } else {
                if (prm.errorCallback) {
                    _doAction(prm.errorCallback, AM.update(self, {
                        input: 'The connector is not existing or the push notification is disabled.'
                    }));
                }
                return false;
            }
        },
        'HNSPushList': function (prm) {
            // Take the information from the component
            if (prm['pushNotif']) {
                var self = this;
                var conn = _Scope.componentByName(prm['pushNotif']);
                var attr = conn.attr;
            }

            // Check if the connector
            if (conn) {
                var token = localStorage.getItem('devicetoken');
                var urlRequest = attr.apiUrl;
                new PushAjax({
                    url: urlRequest + '/publish?from_token=' + token + '&limit=30&page1',

                    method: 'GET',
                    header: function (req) {
                        req.setRequestHeader("Authorization", "Basic " + btoa(attr.user + ":" + attr.password));
                        req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                    },
                    success: function (res, req) {
                        var result = JSON.parse(res);
                        _doAction(prm.callback, AM.update(self, {
                            input: result
                        }));
                    },
                    error: function (res, req) {
                        _doAction(prm.errorCallback, AM.update(self, {
                            input: res
                        }));
                    }
                });
            } else {
                if (prm.errorCallback) {
                    _doAction(prm.errorCallback, AM.update(self, {
                        input: 'The connector is not existing or the push notification is disabled.'
                    }));
                }
                return false;
            }
        },
        'HNSRegisterUser':function(prm){
            // Prepare the callback
            var errorCallback=function(d){
                if (prm.errorCallback) {
                    _doAction(prm.errorCallback, AM.update(ebd, {
                        input: data
                    }));
                }
            };

            if (prm['pushNotif']) {
                var self = this;
                var conn = _Scope.componentByName(prm['pushNotif']);
                var attr = conn.attr;
            } else {
                return errorCallback('no Pushnotification active');
            };

            if (!prm['userId']) {
                return errorCallback('No User fill in');
            } else {
                var userName = prm['userId'];
            };

            if (conn) {
                var urlSource = attr.apiUrl;
                var token = localStorage.getItem('devicetoken');
                new PushAjax({
                    url: urlSource + '/api/device',
                    data: {
                        token:token,
                        old_token:token,
                        username:userName

                    },
                    method: 'POST',
                    header: function (req) {
                        req.setRequestHeader("Authorization", "Basic " + btoa(attr.user + ":" + attr.password));
                        req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                    },
                    success: function (res, req) {
                        var dataResponse = JSON.parse(res);
                        _doAction(prm.callback, AM.update(self, {
                            input: dataResponse
                        }));
                        
                    },
                    error: function (res, req) {
                        return errorCallback(res);
                    }
                })
            } else {
               return errorCallback('no Pushnotification active');
            }
        },
        'HNSSubscribeTopic':function(prm){
            // Prepare the callback
            var errorCallback=function(d){
                if (prm.errorCallback) {
                    _doAction(prm.errorCallback, AM.update(ebd, {
                        input: data
                    }));
                }
            };

            if (prm['pushNotif']) {
                var self = this;
                var conn = _Scope.componentByName(prm['pushNotif']);
                var attr = conn.attr;
            } else {
                return errorCallback('no Pushnotification active');
            }

            if (!prm['topic']) {
                return errorCallback('No topic fill in');
            } else {
                var topic = prm['topic'];
            }
            
            if (conn){
                var urlSource = attr.apiUrl;
                var devId = attr.devId||null;
                var token = localStorage.getItem('devicetoken');
                var dtSend = {
                        token:token,
                        topic:topic
                };
                if (devId){
                    dtSend.devel_id=devId;
                };
                new PushAjax({
                    url: urlSource + '/api/topic',
                    data: dtSend,
                    method: 'POST',
                    header: function (req) {
                        req.setRequestHeader("Authorization", "Basic " + btoa(attr.user + ":" + attr.password));
                        req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                    },
                    success: function (res, req) {
                        var dataResponse = JSON.parse(res);
                        _doAction(prm.callback, AM.update(self, {
                            input: dataResponse
                        }));
                    },
                    error: function (res, req) {
                        return errorCallback(res);
                    }
                })
            } else {
               return errorCallback('no Pushnotification active');
            }
        },

        //cordova plugin add https://github.com/petermetz/cordova-plugin-ibeacon.git
        'startBeaconMonitoring': function(prm) {
            var ebd = this || {};
            var callback = function(s) {
                // console.log(s);
                _doAction(prm.callback, AM.update(ebd, {
                    input: s
                }));
            };
            var errorCallback = function(e) {
                _doAction(prm.errorCallback, AM.update(ebd, {
                    input: e
                }));
            };

            if (isCordova()) {
                cordova.plugins.locationManager.isBluetoothEnabled()
                .then(function (isEnabled) {
                    console.log("isEnabled: " + isEnabled);
                    if (!isEnabled) {
                        cordova.plugins.locationManager.enableBluetooth();
                    }
                })
                .fail(function (e) {
                    console.error(e);
                })
                .done();

                // define the beacon-regon
                var uuid = prm.uuid || '00000000-0000-0000-0000-000000000000';
                var identifier = prm.identifier || 'eMobiQ';
                beaconRegion = createBeaconRegion(identifier, uuid);

                // init and assign the delegate for beacon-monitoring
                //delegate's didDetermineStateForRegion will return the response via success callback
                /* where response looks like this,
                    input = {
                        didDetermineStateForRegion: {
                            eventType: "didDetermineStateForRegion",
                            region: {
                                identifier:"EXAMPLE_BEACON",
                                uuid:"b5b182c7-eab1-4988-aa99-b5c1517008d9"
                                typeName: "BeaconRegion",
                            },
                            state: "CLRegionStateInside"
                        }
                    }
                */
                // lookout for value of didDetermineStateForRegion.state = CLRegionStateInside/CLRegionStateOutside
                // where CLRegionStateInside = user is outside of beacon-region's range and vice-versa
                // note: didDetermineStateForRegion.state's value will switch between inside/outside before settling
                var delegate = new cordova.plugins.locationManager.Delegate();
                delegate.didDetermineStateForRegion = function (pluginResult) {
                    callback({'didDetermineStateForRegion': pluginResult});
                };
                cordova.plugins.locationManager.setDelegate(delegate);

                // request for user-location permission
                cordova.plugins.locationManager.requestWhenInUseAuthorization();

                // start monitoring for beacon-region
                // note: this happens after requestWhenInUseAuthorization
                setTimeout( function() {
                    beaconStart=true;
                    cordova.plugins.locationManager.startMonitoringForRegion(beaconRegion)
                    .fail()
                    .done()
                }, 500);

              
            }
        },

        'stopBeaconMonitoring': function(prm) {
            var ebd = this || {};
            var callback = function(s) {
                // console.log(s);
                _doAction(prm.callback, AM.update(ebd, {
                    input: s
                }));
            };
            var errorCallback = function(e) {
                _doAction(prm.errorCallback, AM.update(ebd, {
                    input: e
                }));
            };

            var uuid = prm.uuid || null;
            var identifier = prm.identifier || 'emobiqBeacon';
            var minor = prm.minor || 0;
            var major = prm.major || 0;
            var beaconRegion = new cordova.plugins.locationManager.BeaconRegion(identifier, uuid, major, minor);

            cordova.plugins.locationManager.stopMonitoringForRegion(beaconRegion)
            .fail(function (e) {
                if (prm.errorCallback){
                    return errorCallback(e);
                }
            })
            .done(function(o) {
                console.log('stoping beacon-monitoring done');
                beaconStart=false;
                if (prm.callback) {
                    return callback(o);
                }
            });
            
            setTimeout(function(){
                cordova.plugins.locationManager.disableBluetooth();
            },500)
        },

        'startBeacon': function(prm) {
            var ebd = this || {};
            var callback = function(s) {
                _doAction(prm.callback, AM.update(ebd, {
                    input: s
                }));
            };
            var errorCallback = function(e) {
                _doAction(prm.errorCallback, AM.update(ebd, {
                    input: e
                }));
            };

            if (isCordova()) {
                cordova.plugins.locationManager.isBluetoothEnabled()
                .then(function (isEnabled) {
                    console.log("isEnabled: " + isEnabled);
                    if (!isEnabled) {
                        // cordova.plugins.locationManager.disableBluetooth();
                        cordova.plugins.locationManager.enableBluetooth();
                    }
                })
                .fail(function (e) {
                    console.error(e);
                })
                .done();
                
                var uuid = prm.uuid || '00000000-0000-0000-0000-000000000000';
                var identifier = prm.identifier || 'eMobiQ';
                beaconRegion = createBeaconRegion(identifier, uuid);
                
                setTimeout( function() {
                    beaconStart=true;
                    cordova.plugins.locationManager.startRangingBeaconsInRegion(beaconRegion)
                    .fail()
                    .done()
                }, 500);
               
                var delegate = new cordova.plugins.locationManager.Delegate();
                delegate.didRangeBeaconsInRegion = function (pluginResult) {
                    if (beaconStart){
                        callback({'didRangeBeaconsInRegion': pluginResult});
                    }
                };

                cordova.plugins.locationManager.setDelegate(delegate);
                cordova.plugins.locationManager.requestWhenInUseAuthorization();
            }
        },

        'stopBeacon': function(prm) {
            var ebd = this || {};
            var callback = function(s) {
                // console.log(s);
                _doAction(prm.callback, AM.update(ebd, {
                    input: s
                }));
            };
            var errorCallback = function(e) {
                _doAction(prm.errorCallback, AM.update(ebd, {
                    input: e
                }));
            };

            var uuid = prm.uuid || null;
            var identifier = prm.identifier || 'emobiqBeacon';
            var minor = prm.minor || 0;
            var major = prm.major || 0;
            var beaconRegion = new cordova.plugins.locationManager.BeaconRegion(identifier, uuid, major, minor);

            cordova.plugins.locationManager.stopRangingBeaconsInRegion(beaconRegion)
            .fail(function (e) {
                if (prm.errorCallback){
                    return errorCallback(e);
                }
            })
            .done(function(o){
                console.log('stoping done');
                beaconStart=false;
                if (prm.callback){
                    return callback(o);
                }
            });
            cordova.plugins.locationManager.stopMonitoringForRegion(beaconRegion)
            .fail(function(e) { console.error(e); })
            .done();

            setTimeout(function(){
                cordova.plugins.locationManager.disableBluetooth();
            }, 500)
        }
    }, 'Device');

    /**
     * Get Storage Function
     */
    function getStorage(storage, callback, errorCallback) {
        // Default storage ~ internal cache
        var storageCordova = cordova.file.cacheDirectory;

        // Check if the storage was specified
        if (storage) {
            switch (storage) {
                case 'cache':
                    // Internal app specific cache storage
                    storageCordova = cordova.file.cacheDirectory;
                    break;
                case 'data':
                    // Internal app specific storage
                    storageCordova = cordova.file.dataDirectory;
                    break;
                case 'external':
                    // External app root storage
                    storageCordova = (device.platform == 'iOS' ? cordova.file.documentsDirectory : cordova.file.externalRootDirectory);
                    break;
                case 'external data':
                    // External app specific storage
                    storageCordova = (device.platform == 'iOS' ? cordova.file.documentsDirectory : cordova.file.externalDataDirectory);
                    break;
                case 'external cache':
                    // External app specific cache storage
                    storageCordova = (device.platform == 'iOS' ? cordova.file.tempDirectory : cordova.file.externalCacheDirectory);
                    break;
            }
        }

        // Open the directory based on the storage specified
        window.resolveLocalFileSystemURL(storageCordova, 
            function (dirEntry) {
                callback(dirEntry);
            }, function (error) {
                errorCallback(error);
            });
    }

    /**
     * Get Directory Function
     */
    function getDirectory(folderPath, rootDirEntry, callback, errorCallback) {
        // Check if there is any path given
        if (!folderPath) {
            callback(rootDirEntry);
        } 

        // Seperate the path by folders
        var folders = folderPath.split('/');

        // Create the directory
        createDir(rootDirEntry, folders, callback, errorCallback)
    }

    /**
     * Get Directory Function
     */
    function createDir(rootDirEntry, folders, callback, errorCallback) {
        // Don't allow to use './' or '/'
        if (folders[0] == '.' || folders[0] == '') {
            folders = folders.slice(1);
        }

        // Check if it's the last directory
        if (!folders[0]) {
            // Return the final directory
            callback(rootDirEntry);
        } else {
            // Create the directory
            rootDirEntry.getDirectory(folders[0], {create: true}, 
                function(dirEntry) {
                    // Recursively add the new subfolder (if we still have another to create).
                    if (folders.length) {
                        createDir(dirEntry, folders.slice(1), callback, errorCallback);
                    }
                }, function(error) {
                    errorCallback(error);
                });
        }
    };

    /**
     * Convert a base64 string in a Blob according to the data and contentType.
     * 
     * @param b64Data {String} Pure base64 string without contentType
     * @param contentType {String} the content type of the file i.e (image/jpeg - image/png - text/plain)
     * @param sliceSize {Int} SliceSize to process the byteCharacters
     * @see http://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
     * @return Blob
     */
    function b64toBlob(b64Data, contentType, sliceSize) {
        contentType = contentType || '';
        sliceSize = sliceSize || 512;

        var byteCharacters = atob(b64Data);
        var byteArrays = [];

        for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            var slice = byteCharacters.slice(offset, offset + sliceSize);

            var byteNumbers = new Array(slice.length);
            for (var i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            var byteArray = new Uint8Array(byteNumbers);

            byteArrays.push(byteArray);
        }

        var blob = new Blob(byteArrays, {type: contentType});
        return blob;
    }

    /**
     * File Functions
     */
    registerFunction({
        // Download file from a url
        'download': function(prm) {
            // Check if it's cordova or browser
            if (isCordova()) {
                // Make sure the required parameter is passed
                if (prm['fileName'] && prm['url']) {
                    // Prepare the callback functions
                    var ebd = this;
                    var callback = function(data) {
                        if (prm.callback) {
                            _doAction(prm.callback, AM.update(ebd, {
                                input: data
                            }));
                        }
                    }
                    var errorCallback = function(data) {
                        if (prm.errorCallback) {
                            _doAction(prm.errorCallback, AM.update(ebd, {
                                input: data
                            }));
                        }
                    }
                    // Execute the directory function
                    getStorage(prm['storage'],
                        function(dirEntry) {
                            // Get the folder
                            getDirectory(prm['folderPath'], dirEntry,
                                function(dirEntry) {
                                    // Get or create the file
                                    dirEntry.getFile(prm['fileName'], { create: true, exclusive: false },
                                        function(fileEntry) {
                                            // Prepare the headers to be passed
                                            var headers = {};
                                            if (prm['headers']) {
                                                headers = prm['headers'];
                                            }
                                            // Prepare the needed objects
                                            var fileURL = fileEntry.toURL();
                                            // Dowload the file
                                            cordova.plugin.http.downloadFile(prm['url'], {}, headers, fileURL, function(fileEntry) {
                                                // Include the uri path in the file entry
                                                fileEntry.path = fileEntry.toURL();
                                                // if have extra data then include it
                                                if (prm['extra']) {
                                                    fileEntry.extra = prm['extra'];
                                                }
                                                // Pass the file entry to the callback
                                                callback(fileEntry);
                                            }, function(response) {
                                                errorCallback(response.error);
                                            });
                                        }, function(error) {
                                            errorCallback(error);
                                        });
                                },
                                function(error) {
                                    errorCallback(error);
                                });
                        },
                        function(error) {
                            errorCallback(error);
                        });
                }
            }
        },
        // Read the file entered that will result to a binary
        'read': function(prm) {
            // Make sure the required parameter is passed
            if (prm['file']) {
                // Store itself in a variable
                var element = this;
                
                // Generate the requested data based on it's type
                var type = prm['dataType'] || 'blob';
                type = type.toLowerCase();

                // Find the file then read it
                window.resolveLocalFileSystemURL(
                    prm['file'],
                    function (fileEntry) {
                        fileEntry.file(
                            function (file) {
                                var reader = new FileReader();

                                reader.onloadend = function() {
                                    var data;
                                    if (type == 'base64' || type == 'arraybuffer' || type == 'text') {
                                        data = this.result;
                                    } else if (type == 'uint8array') {
                                        data = new Uint8Array(this.result);
                                    } else {
                                        data = new Blob([new Uint8Array(this.result)], {});
                                    }

                                    callback(element, prm.callback, data, prm['extra'])
                                };

                                if (type == 'base64') {
                                    reader.readAsDataURL(file);
                                } else if (type == 'text') {
                                    reader.readAsText(file);
                                } else {
                                    reader.readAsArrayBuffer(file);
                                }
                            }, 
                            function(error) {
                                callback(element, prm.errorCallback, error, prm['extra']);
                            }   
                        );
                    }, 
                    function(error) {
                        callback(element, prm.errorCallback, error, prm['extra']);
                    }
                );
            }
        },
        // Create file from data
        'write': function(prm) {
            // Check if it's cordova or browser
            if (isCordova()) {
                // Make sure the required parameter is passed
                if (prm['fileName'] && prm['data']) {
                    // Prepare the callback functions
                    var ebd = this;
                    var callback = function(data) {
                        if (prm.callback) {
                            _doAction(prm.callback, AM.update(ebd, {
                                input: data
                            }));
                        }
                    }
                    var errorCallback = function(data) {
                        if (prm.errorCallback) {
                            _doAction(prm.errorCallback, AM.update(ebd, {
                                input: data
                            }));
                        }
                    }

                    // Generate the file based on it's type
                    prm['dataType'] = prm['dataType'] || 'text';
                    if (prm['dataType'].toLowerCase() == 'base64') {
                        prm['data'] = b64toBlob(prm['data'], '');
                    }
                    // Execute the directory function
                    getStorage(prm['storage'],
                        function(dirEntry) {
                            // Get the folder
                            getDirectory(prm['folderPath'], dirEntry,
                                function(dirEntry) {
                                    // Get or create the file
                                    dirEntry.getFile(prm['fileName'], { create: true, exclusive: false },
                                        function(fileEntry) {
                                            // Create a FileWriter object for our FileEntry
                                            fileEntry.createWriter(function(fileWriter) {
                                                // Return the path file once it is successfull
                                                fileWriter.onwriteend = function() {
                                                    // Include the uri path in the file entry
                                                    fileEntry.path = fileEntry.toURL();
                                                    // if have extra data then include it
                                                    if (prm['extra']) {
                                                        fileEntry.extra = prm['extra'];
                                                    }
                                                    // Pass the file entry to the callback
                                                    callback(fileEntry);
                                                };
                                                // If something happened return the error
                                                fileWriter.onerror = function (error) {
                                                    // Failed to download
                                                    errorCallback(error);
                                                };
                                                // Write the data to the file
                                                fileWriter.write(prm['data']);
                                            });
                                        }, function(error){
                                            errorCallback(error);
                                        });
                                },
                                function(error) {
                                    errorCallback(error);
                                });
                        },
                        function(error) {
                            errorCallback(error);
                        });
                }
            }
        },
        // Copy file
        'copy': function(prm) {
            // Make sure the required parameter is passed
            if (prm['fileName'] && prm['copyFile']) {
                // Prepare the callback functions
                var ebd = this;
                var callback = function(data) {
                    if (prm.callback) {
                        _doAction(prm.callback, AM.update(ebd, {
                            input: data
                        }));
                    }
                }
                var errorCallback = function(data) {
                    if (prm.errorCallback) {
                        _doAction(prm.errorCallback, AM.update(ebd, {
                            input: data
                        }));
                    }
                }
                // Execute the directory function
                getStorage(prm['storage'],
                    function(dirEntry) {
                        // Get the folder
                        getDirectory(prm['folderPath'], dirEntry,
                            function(dirEntry) {
                                // Get the file to be copied
                                window.resolveLocalFileSystemURL(prm['copyFile'],
                                    function(copyFile) {
                                        copyFile.copyTo(dirEntry, prm['fileName'],
                                            function(fileEntry) {
                                                // Include the uri path in the file entry
                                                fileEntry.path = fileEntry.toURL();
                                                // Pass the file entry to the callback
                                                callback(fileEntry);
                                            },
                                            function(error){
                                                errorCallback(error);
                                            });
                                    },
                                    function(error) {
                                        errorCallback(error);
                                    });
                            },
                            function(error) {
                                errorCallback(error);
                            });
                    },
                    function(error) {
                        errorCallback(error);
                    });
            }
        },
        // Delete the file(s) from the application storage
        'delete': function(prm) {
            // Make sure the required parameter is passed
            if (!prm['all'] || !prm['fileName']) {
                // Prepare the callback functions
                var ebd = this;
                var callback = function(data) {
                    if (prm.callback) {
                        _doAction(prm.callback, AM.update(ebd, {
                            input: data
                        }));
                    }
                }
                var errorCallback = function(data) {
                    if (prm.errorCallback) {
                        _doAction(prm.errorCallback, AM.update(ebd, {
                            input: data
                        }));
                    }
                }
                // Execute the directory function
                getStorage(prm['storage'],
                    function(dirEntry) {
                        // Get the folder
                        getDirectory(prm['folderPath'], dirEntry,
                            function(dirEntry) {
                                // Check if it's to clear all or specific file
                                if (prm['all'] == true) {
                                    // Delete the folder
                                    dirEntry.removeRecursively(function() {
                                        callback('Directory and files removed.')
                                    }, function() {
                                        errorCallback('Failed in deleting the directory.')
                                    });
                                } else if (prm['fileName']) {
                                    // Get or create the file
                                    dirEntry.getFile(prm['fileName'], { create: false, exclusive: false }, function(fileEntry) {
                                        // Delete the file
                                        fileEntry.remove(function() {
                                            callback('Successfully deleted the file.');
                                        }, function(error) {
                                            errorCallback(error);
                                        }, function() {
                                            errorCallback('File not found.');
                                        });
                                    }, function(error) {
                                        errorCallback(error);
                                    });
                                }
                            },
                            function(error) {
                                errorCallback(error);
                            });
                    },
                    function(error) {
                        errorCallback(error);
                    });
            }
        },
        // Get the storage path
        'storagePath': function(prm) {
            // Get the storage value
            var storage = prm['storage'] || '';

            // Default storage ~ internal cache
            var storageCordova = cordova.file.cacheDirectory;

            // Check if the storage was specified
            if (storage) {
                switch (storage) {
                    case 'cache':
                        // Internal app specific cache storage
                        storageCordova = cordova.file.cacheDirectory;
                        break;
                    case 'data':
                        // Internal app specific storage
                        storageCordova = cordova.file.dataDirectory;
                        break;
                    case 'external':
                        // External app root storage
                        storageCordova = (device.platform == 'iOS' ? cordova.file.documentsDirectory : cordova.file.externalRootDirectory);
                        break;
                    case 'external data':
                        // External app specific storage
                        storageCordova = (device.platform == 'iOS' ? cordova.file.documentsDirectory : cordova.file.externalDataDirectory);
                        break;
                    case 'external cache':
                        // External app specific cache storage
                        storageCordova = (device.platform == 'iOS' ? cordova.file.tempDirectory : cordova.file.externalCacheDirectory);
                        break;
                }
            }

            return storageCordova;
        },
        // Save base64 to gallery
        'saveBase64ToGallery': function(prm) {
            // Prepare the callback functions
            var element = this;

            // Check if have base64 
            if (!prm.base64) {
                return false;
            }

            // Prepare the options
            var options = {
                data: prm.base64
            }

            // Check if have quality
            if (prm.quality) {
                options.quality = prm.quality;
            }

            // Check if there's prefix
            if (prm.prefix) {
                options.prefix = prm.prefix;
            }

            // Save the image
            window.imageSaver.saveBase64Image(
                options,
                function (filePath) {
                    callback(element, prm.callback, filePath);
                },
                function (error) {
                    callback(element, prm.errorCallback, error);
                }
            );

            return true;
        },
        // Backup SQLite database file
        'backupSqlite': function(prm) {
            if (!isCordova()) {
                return;
            }

            // Make sure the storage is passed
            if (prm.storage) {
                // Prepare the callback functions
                var ebd = this;
                var callback = function(data) {
                    if (prm.callback) {
                        _doAction(prm.callback, AM.update(ebd, {
                            input: data
                        }));
                    }
                }
                var errorCallback = function(data) {
                    if (prm.errorCallback) {
                        _doAction(prm.errorCallback, AM.update(ebd, {
                            input: data
                        }));
                    }
                }

                // Get the location of the sqlite db file
                var sqliteFile = cordova.file.applicationStorageDirectory;

                if (device.platform == 'iOS') {
                    sqliteFile += 'Library/LocalDatabase/';
                } else {
                    sqliteFile += '/databases/';
                }

                sqliteFile += _baseConfig.appname + '.db';

                // Get the filename
                var fileName = prm.fileName ? prm.fileName : _baseConfig.appname;

                // Execute the directory function
                getStorage(prm.storage,
                    function(dirEntry) {
                        // Get the file to be copied
                        window.resolveLocalFileSystemURL(sqliteFile,
                            function(fileEntry) {
                                // Get the extension of the file
                                var fileSplit = fileEntry.name.split('.');
                                var fileExtension = fileSplit[fileSplit.length - 1];

                                // Copy the file
                                fileEntry.copyTo(dirEntry, fileName + '.' + fileExtension,
                                    function(fileEntry) {
                                        // Include the uri path in the file entry
                                        fileEntry.path = fileEntry.toURL();
                                        // Pass the file entry to the callback
                                        callback(fileEntry);
                                    },
                                    function(error){
                                        errorCallback(error);
                                    }
                                );
                            },
                            function(error) {
                                errorCallback(error);
                            }
                        );
                    },
                    function(error) {
                        errorCallback(error);
                    }
                );
            }
        },
        // Restore the SQLite database file
        'restoreSqlite': function(prm) {
            if (!isCordova()) {
                return;
            }
            
            // Make sure the required parameter is passed
            if (prm.file) {
                // Prepare the callback functions
                var ebd = this;
                var callback = function(data) {
                    if (prm.callback) {
                        _doAction(prm.callback, AM.update(ebd, {
                            input: data
                        }));
                    }
                }
                var errorCallback = function(data) {
                    if (prm.errorCallback) {
                        _doAction(prm.errorCallback, AM.update(ebd, {
                            input: data
                        }));
                    }
                }

                // Get the location of the sqlite db file
                var sqliteFileDir = cordova.file.applicationStorageDirectory;

                if (device.platform == 'iOS') {
                    sqliteFileDir += 'Library/LocalDatabase/';
                } else {
                    sqliteFileDir += '/databases/';
                }

                var sqliteFileName = _baseConfig.appname + '.db';

                // Open the directory of the sqlite
                window.resolveLocalFileSystemURL(sqliteFileDir, 
                function (dirEntry) {
                    // Get the file to be copied
                    window.resolveLocalFileSystemURL(prm.file,
                        function(copyFile) {
                            // Copy the file
                            copyFile.copyTo(dirEntry, sqliteFileName,
                                function(fileEntry) {
                                    // Include the uri path in the file entry
                                    fileEntry.path = fileEntry.toURL();
                                    // Pass the file entry to the callback
                                    callback(fileEntry);
                                },
                                function(error){
                                    errorCallback(error);
                                });
                        },
                        function(error) {
                            errorCallback(error);
                        }
                    ); 
                }, function (error) {
                    errorCallback(error);
                });       
            }
        }
    }, 'File');

    /**
     * Firebase Functions
     */
    registerFunction({
        // Upload file to the firebase storage
        'firebaseStorageUpload': function(prm) {
            // Make sure the needed details are passed
            if (prm['fileName'] && prm['fileType'] && prm['file']) {
                // Prepare the callback functions
                var element = this;
                var callback = function(data) {
                    if (prm.callback) {
                        _doAction(prm.callback, AM.update(element, {
                            input: data
                        }));
                    }
                }
                var errorCallback = function(data) {
                    if (prm.errorCallback) {
                        _doAction(prm.errorCallback, AM.update(element, {
                            input: data
                        }));
                    }
                }

                // Create a root reference
                var storageRef = firebase.storage().ref();

                // Create a reference to file
                var fileRef = storageRef.child((prm['filePath'] ? prm['filePath'] + '/' : '' ) + prm['fileName']);

                // Upload the file base on the type
                var type = prm['fileType'];
                var file = prm['file'];
                var uploadTask = '';
                if (type == 'blob' || type == 'file') {
                    uploadTask = fileRef.put(file);
                } else if (type == 'string') {
                    uploadTask = fileRef.putString(file);
                } else {
                    uploadTask = fileRef.putString(file, type);
                }

                // Handle the processing / callbacks
                if (uploadTask) {
                    uploadTask.on('state_changed', function(snapshot) {}, 
                        function(error) {
                            errorCallback(error);
                        }, function() {
                            callback(uploadTask.snapshot.downloadURL);
                        }
                    );
                }
            } 
        },
        // Get the file url from the firebase storage
        'firebaseStorageURL': function(prm) {
            // Make sure the needed details are passed
            if (prm['fileName']) {
                // Prepare the callback functions
                var element = this;
                var callback = function(data) {
                    if (prm.callback) {
                        _doAction(prm.callback, AM.update(element, {
                            input: data
                        }));
                    }
                }
                var errorCallback = function(data) {
                    if (prm.errorCallback) {
                        _doAction(prm.errorCallback, AM.update(element, {
                            input: data
                        }));
                    }
                }

                // Create a root reference
                var storageRef = firebase.storage().ref();

                // Create a reference to file
                var fileRef = storageRef.child((prm['filePath'] ? prm['filePath'] + '/' : '' ) + prm['fileName']);

                // Get the download URL
                fileRef.getDownloadURL()
                    .then(
                        function(url) {
                            callback(url);
                        }
                    ).catch(
                        function(error) {
                            errorCallback(error.code);
                        }
                    );
            }
        },
        // Delete the file in the firebase storage
        'firebaseStorageDelete': function(prm) {
            // Make sure the needed details are passed
            if (prm['fileName']) {
                // Prepare the callback functions
                var element = this;
                var callback = function(data) {
                    if (prm.callback) {
                        _doAction(prm.callback, AM.update(element, {
                            input: data
                        }));
                    }
                }
                var errorCallback = function(data) {
                    if (prm.errorCallback) {
                        _doAction(prm.errorCallback, AM.update(element, {
                            input: data
                        }));
                    }
                }

                // Create a root reference
                var storageRef = firebase.storage().ref();

                // Create a reference to file
                var fileRef = storageRef.child((prm['filePath'] ? prm['filePath'] + '/' : '' ) + prm['fileName']);

                // Get the download URL
                fileRef.delete()
                    .then(
                        function() {
                            callback('File deleted.');
                        }
                    ).catch(
                        function(error) {
                            errorCallback(error);
                        }
                    );
            }
        }
    }, 'Firebase');

    /********** 
     * Global reusable funtions within the app
     **********/

    /**
     * Directly trigger a callback for the platform
     * 
     * @param element - main object/caller
     * @param callback - the callback to be triggered
     * @param data - the data to be passed to input field
     * @param extra - the data to be passed to extra field
     *
     * @return 
     */
    function callback(element, callback, data, extra) {
        // Prepare the additional data
        let options = {};
        if (typeof data !== 'undefined') {
            options.input = data;
        }
        if (typeof extra !== 'undefined') {
            options.extra = extra;
        }
        // Check if callback exists
        if (callback) {
            _doAction(callback, AM.update(element, options));
        }
    }

    /**
     * Check if the processsing is already done
     * 
     * @param total - total expected processing
     * @param completed - completed processing
     * @param callback - the callback to be triggered
     *
     * @return none
     */
    function processIsFinished(total, completed, cb) {
        // Check if there are more files to download
        if (total === completed) {
            cb();
        }
    };

    /**
     * Prepare the function that triggers callbacks
     * 
     * @param object - main object/caller
     * @param callback - the callback to be triggered
     *
     * @return 
     */
    function platformCallback(object, callback) {
        var result = function(data) {
            if (callback) {
                _doAction(callback, AM.update(object, {
                    input: data
                }));
            }
        }
        return result;
    }

    /********** 
     * Service manager plugin purposed functions
     **********/

    /**
     * Handles plugin request 
     * to trigger a callback for the platform.
     * 
     * @param {object} element - main object/caller
     * @param {functionList} functionList - the callback to be triggered
     * @param {object} parameters  - the additonal data that are passed through the callback
     * @param {any} parameters.input - the data to be passed to input field
     * @param {any} parameters.extra - the data to be passed to extra field
     *
     * @return {void}
     */
    function pluginCallback(element, functionList, parameters) {
        // Trigger another function that is used internally
        callback(element, functionList, parameters.input, parameters.extra);
    }

    /**
     * Handles plugin request 
     * to retrieve a specific component.
     * 
     * @param {string} identifier - the component id or name,
     *                              it will prioritize id before name.
     *
     * @return {object} component - the component object itself or null
     */
    function pluginGetComponent(identifier) {
        let component;

        // Retrieve by id first
        component = _Scope.componentById(identifier);

        // Retrieve by name if it is empty
        if (!component) {
            component = _Scope.componentByName(identifier);
        }

        return component || null;
    }

    /**
     * Handles plugin request 
     * to trigger an event to a specific component.
     * 
     * @param {object} element - main object/caller
     * @param {string} eventName - the component event name, only works if it is defined
     * @param {object} parameters  - the additonal data that are passed through the callback
     * @param {any} parameters.input - the data to be passed to input field
     * @param {any} parameters.extra - the data to be passed to extra field
     * 
     * @return {void}
     */
    function pluginEvent(element, eventName, parameters) {
        // Make sure the event functions exist
        if (!element.ev[eventName]) {
            return;
        }
        // Trigger another function that is used internally
        callback(element, element.ev[eventName], parameters.input, parameters.extra);
    }
        
    /********** 
     * Functions
     **********/

    /**
     * Payment Functions
     */
    registerFunction({
        // MCP Authenticate
        'mcpAuthenticate': function(prm) {
            // Validate the connector
            var conn = _Scope.componentByName(prm['connector']);
            if (conn) {
                // Prepare the callback
                var ebd = this;
                var cba = function(data) { callback(ebd, prm.callback, data); }
                var ecba = function(data) { callback(ebd, prm.errorCallback, data); }
                // Trigger the action
                conn.authenticate(prm, cba, ecba);
                return true;
            }
            return false;
        },
        // MCP Transact Sales
        'mcpTransactSales': function(prm) {
            // Validate the connector
            var conn = _Scope.componentByName(prm['connector']);
            if (conn) {
                // Prepare the callback
                var ebd = this;
                var cba = function(data) { callback(ebd, prm.callback, data); }
                var ecba = function(data) { callback(ebd, prm.errorCallback, data); }
                // Trigger the action
                conn.transactSales(prm, cba, ecba);
                return true;
            }
            return false;
        },
        // MCP Transact Void
        'mcpTransactVoid': function(prm) {
            // Validate the connector
            var conn = _Scope.componentByName(prm['connector']);
            if (conn) {
                // Prepare the callback
                var ebd = this;
                var cba = function(data) { callback(ebd, prm.callback, data); }
                var ecba = function(data) { callback(ebd, prm.errorCallback, data); }
                // Trigger the action
                conn.transactVoid(prm, cba, ecba);
                return true;
            }
            return false;
        },
        // MCP Transact Refund
        'mcpTransactRefund': function(prm) {
            // Validate the connector
            var conn = _Scope.componentByName(prm['connector']);
            if (conn) {
                // Prepare the callback
                var ebd = this;
                var cba = function(data) { callback(ebd, prm.callback, data); }
                var ecba = function(data) { callback(ebd, prm.errorCallback, data); }
                // Trigger the action
                conn.transactRefund(prm, cba, ecba);
                return true;
            }
            return false;
        },
        // MCP Get Transaction List
        'mcpGetTransactions': function(prm) {
            // Validate the connector
            var conn = _Scope.componentByName(prm['connector']);
            if (conn) {
                // Prepare the callback
                var ebd = this;
                var cba = function(data) { callback(ebd, prm.callback, data); }
                var ecba = function(data) { callback(ebd, prm.errorCallback, data); }
                // Trigger the action
                conn.getTransactions(prm, cba, ecba);
                return true;
            }
            return false;
        },
        // MCP Get Transaction Details
        'mcpGetTransactionDetails': function(prm) {
             // Validate the connector
             var conn = _Scope.componentByName(prm['connector']);
             if (conn) {
                 // Prepare the callback
                 var ebd = this;
                 var cba = function(data) { callback(ebd, prm.callback, data); }
                 var ecba = function(data) { callback(ebd, prm.errorCallback, data); }
                 // Trigger the action
                 conn.getTransactionDetails(prm, cba, ecba);
                 return true;
             }
             return false;
        },
        // MCP EWallet Quick Pay
        'mcpEWalletQuickPay': function(prm) {
            // Validate the connector
            var conn = _Scope.componentByName(prm['connector']);
            if (conn) {
                // Prepare the callback
                var ebd = this;
                var cba = function(data) { callback(ebd, prm.callback, data); }
                var ecba = function(data) { callback(ebd, prm.errorCallback, data); }
                // Trigger the action
                conn.eWalletQuickPay(prm, cba, ecba);
                return true;
            }
            return false;
       },
       // MCP EWallet Unified Order
       'mcpEWalletUnifiedOrder': function(prm) {
            // Validate the connector
            var conn = _Scope.componentByName(prm['connector']);
            if (conn) {
                // Prepare the callback
                var ebd = this;
                var cba = function(data) { callback(ebd, prm.callback, data); }
                var ecba = function(data) { callback(ebd, prm.errorCallback, data); }
                // Trigger the action
                conn.eWalletUnifiedOrder(prm, cba, ecba);
                return true;
            }
            return false;
        },

        // eNETS Payment Request
        'eNetsPaymentRequest': function(prm) {
            // Validate the connector
            var conn = _Scope.componentByName(prm['connector']);
            if (conn) {
                // Prepare the callback
                var ebd = this;
                var cba = function(data) { callback(ebd, prm.callback, data); }
                var ecba = function(data) { callback(ebd, prm.errorCallback, data); }
                // Trigger the action
                conn.paymentRequest(prm, cba, ecba);
                return true;
            }
            return false;
        },

        // 2C2P Payment Request
        '2c2pPaymentRequest': function(prm) {
            // Validate the connector
            var conn = _Scope.componentByName(prm['connector']);
            if (conn) {
                // Prepare the callback
                var ebd = this;
                var cba = function(data) { callback(ebd, prm.callback, data); }
                var ecba = function(data) { callback(ebd, prm.errorCallback, data); }
                // Trigger the action
                conn.paymentRequest(prm, cba, ecba);
                return true;
            }
            return false;
        },

        // Generate Paynow QR Code
        'generatePaynowQR': function(prm) {
            // Prepare the element
            var element = this;

            // Make sure the required parameter is passed
            if (!prm['formatIndicator'] || !prm['initiationMethod'] || !prm['accountIdentifier']
                || !prm['accountProxyType'] || !prm['accountProxyValue'] || !prm['editableAmountIndicator']
                || !prm['qrExpiryDate'] || !prm['merchantCategoryCode'] || !prm['transactionCurrency']
                || !prm['transactionAmount'] || !prm['countryCode'] || !prm['merchantName']
                || !prm['merchantCity'] || !prm['billNumber']) {
                    callback(element, prm.errorCallback, 'Missing one of the required parameters.', prm.extra);
                    return;
            }

            // Generate the proper value for the paynow
            var value = paynowGenerateQRText(prm);

            // Generate the qr
            var canvas = document.createElement('canvas');
            drawQR(canvas, value, prm.logo, function(data){
                // Create the return value
                var result = {};
                result.data = data;
                // If have extra data then include it
                if (prm.extra) {
                    result.extra = prm.extra;
                }

                // Trigger the callback
                callback(element, prm.callback, result, prm.extra);
            });
        },
        'paypalGenerateButton': function(prm) {
            // prepare the callbacks
            var callback = platformCallback(this, prm.callback);
            var errorCallback = platformCallback(this, prm.errorCallback);
            
            if (!prm.component) {
                errorCallback('Missing parameter component.');
                return;
            }
            
            var comp = _Scope.componentByName(prm.component);
            comp.render({
                amount: parseFloat(prm.amount),
                first_name: prm.first_name,
                last_name: prm.last_name,
                company: prm.company,
                address_line1: prm.address_line1,
                address_line2: prm.address_line2,
                city: prm.city,
                region: prm.region,
                country_code: prm.country_code,
                postal_code: prm.postal_code
            }, callback, errorCallback);
        }
    }, 'Payment');

    /**
     * Generate Paynow Text for the QR Code
     */
     function paynowGenerateQRText(parameters) {
        var result = '';

        // Payload format indicator
        result += '00' + stringPad(parameters['formatIndicator'].length, '0', 'right', 2) + parameters['formatIndicator'];
        // Point of initiation method
        result += '01' + stringPad(parameters['initiationMethod'].length, '0', 'right', 2) + parameters['initiationMethod'];
        
        // Merchant account information
        var merchantAccountInfo = '';
        // ~ Globally unique identifier
        merchantAccountInfo += '00' + stringPad(parameters['accountIdentifier'].length, '0', 'right', 2) + parameters['accountIdentifier'];
        // ~ Proxy type 
        merchantAccountInfo += '01' + stringPad(parameters['accountProxyType'].length, '0', 'right', 2) + parameters['accountProxyType'];
        // ~ Proxy value
        merchantAccountInfo += '02' + stringPad(parameters['accountProxyValue'].length, '0', 'right', 2) + parameters['accountProxyValue'];
        // ~ Editable transaction amount indicator
        merchantAccountInfo += '03' + stringPad(parameters['editableAmountIndicator'].length, '0', 'right', 2) + parameters['editableAmountIndicator'];
        // ~ QR expiry date
        merchantAccountInfo += '04' + stringPad(parameters['qrExpiryDate'].length, '0', 'right', 2) + parameters['qrExpiryDate'];
        result += '26' + stringPad(merchantAccountInfo.length, '0', 'right', 2) + merchantAccountInfo;

        // Merchant category code
        result += '52' + stringPad(parameters['merchantCategoryCode'].length, '0', 'right', 2) + parameters['merchantCategoryCode'];
        // Transaction currency
        result += '53' + stringPad(parameters['transactionCurrency'].length, '0', 'right', 2) + parameters['transactionCurrency'];
        // Transaction amount
        result += '54' + stringPad(parameters['transactionAmount'].length, '0', 'right', 2) + parameters['transactionAmount'];
        // Country code
        result += '58' + stringPad(parameters['countryCode'].length, '0', 'right', 2) + parameters['countryCode'];
        // Merchant name
        result += '59' + stringPad(parameters['merchantName'].length, '0', 'right', 2) + parameters['merchantName'];
        // Merchant city
        result += '60' + stringPad(parameters['merchantCity'].length, '0', 'right', 2) + parameters['merchantCity'];

        // Additional Field Template
        var addFieldTemplate = '';
        // ~ Bill number
        addFieldTemplate += '01' + stringPad(parameters['billNumber'].length, '0', 'right', 2) + parameters['billNumber'];
        result += '62' + stringPad(addFieldTemplate.length, '0', 'right', 2) + addFieldTemplate;

        // CRC
        result += '6304';
        var crcValue = CRC.calculateCRC(result, 'string', 16, 'CRC16_CCITT_FALSE');
        result += crcValue.substring(crcValue.length - 4);
        
        return result;
     };

    /**
     * Create a padding function for string
     */
    function stringPad(value, char, type, length) {
        // Create a string repeater function
        function stringRepeater(char, length) {
            var value = '';
            for (var i = 0; i < length; i++) {
                value += char;
            }
            return value;
        }

        // Prepare the default values
        value = value || '';
        value = value.toString();
        char = char || ' ';
        type = type || 'right';
        length = length || 0;
        length = parseInt(length);

        // Skip this function if negative length was passed
        if (length <= 0) {
            return value;
        }

        // Prepare the value
        var result = [];
        var data = [];

        // Seperate the data by new line first
        data = value.split('\n');

        // Go through the data first
        for (var i in data) {
            var record = data[i];

            // Reitirate the process to handle longer padding length
            var finished = false;
            var includeNewLine = false;
            do {
                // Prepare the value to be appended
                var finalValue = record;

                // Check if it's the last value
                if (record.length <= length) {
                    // Complete the process
                    finished = true;
                }

                // Check if the string is more than the padding length
                if (record.length > length) {
                    // Add new line whenever it's stored
                    includeNewLine = true;

                    // Get the value that is within the length
                    finalValue = record.substr(0, length);

                    // Check if there are words that can be seperated
                    var spaceIndex = finalValue.lastIndexOf(' '),
                        extraSpace = 0;
                    if (spaceIndex >= 0) {
                        // Seperate the space
                        finalValue = record.substring(0, spaceIndex);
                        extraSpace++;
                    }
                    
                    // Update the record data
                    record = record.substr(finalValue.length + extraSpace);
                }

                // Get the pad length
                var padLength = (length - finalValue.length);

                // Generate the string based on the type (position)
                if (type == 'left') {
                    result.push(finalValue + stringRepeater(char, padLength));
                } else if (type == 'center') {
                    var padLengthHalf = Math.floor(padLength / 2);
                    result.push(stringRepeater(char, padLengthHalf) + finalValue + stringRepeater(char, padLength - padLengthHalf));
                } else {
                    result.push(stringRepeater(char, padLength) + finalValue);
                }

                // Check if need to add new line
                if (includeNewLine && !finished) {
                    result.push('\n');
                }
            } while (finished != true);
        }
        
        // Return the result
        return result.join('');
     };

    registerFunction({
        'intentSMS': function(prm) {
            if (prm['phone']) {
                if (prm['message']) {
                    window.location.href = 'sms:' + prm['phone'] + ';' + encodeURIComponent(prm['message']);
                } else {
                    window.location.href = 'sms:' + prm['phone'];
                }
                return true;
            }
            return false;
        },
        'intentPhoneCall': function(prm) {
            if (prm['phone']) {
                window.location.href = 'tel:' + prm['phone'];
                return true;
            }
            return false;
        },
        'intentSendEmail': function(prm) {
            if (prm['email']) {
                var s = 'mailto:' + prm['email'] + (prm['subject'] ? ('?subject=' + encodeURIComponent(prm['subject']) + (prm['body'] ? '&body=' + encodeURIComponent(prm['body']) : '')) : '');
                window.location.href = s;
                return s;
            }
            return false;
        },
        'intentMaps': function(prm) {
            // Prepare the type of the os
            var deviceOS = device.platform;
            var result = (deviceOS == 'iOS' ? 'maps:' : 'geo:');
            
            // Prepare the information
            var latLong = (prm['latLng'] ? prm['latLng'].replace(/\s+/g, '') : '');
            var search = prm['search'];
            var label = prm['label'];
            
            // Make sure it there are data passed
            if (!latLong && !search) {
                return false;
            }
            
            // Check if only search data
            if (!latLong && search) {
                result += '0,0?q=' + encodeURIComponent(search);
            }
            
            // If both have info
            if (latLong) {
                if (label) {
                    result += (deviceOS == 'iOS' ? 'll=' : '0,0?q=');
                    result += latLong;
                    result += '(' + encodeURIComponent(label) + ')';
                } else {
                    result += (deviceOS == 'iOS' ? 'sll=' : '');
                    result += latLong;
                    if (search) {
                        result += '&q=' + encodeURIComponent(search);
                    }
                }
            }

            window.location.href = result;
            return result;
        },
        'intentNavigation': function(prm) {
            // Prepare the type of the os
            var deviceOS = device.platform;
            var result = (deviceOS == 'iOS' ? 'maps:' : 'google.navigation:');

            // Make sure it there are data passed
            if (!prm['latLngOrSearch'] ) {
                return false;
            }

            // Append the query parameter
            var latLong = encodeURIComponent(prm['latLngOrSearch']);
            result += (deviceOS == 'iOS' ? '?daddr=' : '?q=');;
            result += latLong;

            // Mode variable only for android
            var mode = 'd';
            if (prm['mode']) {
                var tmpMode = (prm['mode'].replace(/\s+/g, '').toLocaleLowerCase())[0];
                // Make sure the mode passed is valid
                if (['d', 'w', 'b', 'r'].indexOf(tmpMode) > -1) {
                    mode = tmpMode;
                }
            }
            result += (deviceOS == 'iOS' ? 'dirflg=' : '&m=');
            result += mode;
            
            window.location.href = result;
            return result;
        },
    }, 'Intent');

    /* source:lib/components/function/dialogs.js */

    var _wFixInfoDlg = null;
    function _fixInfoDialog(prm) {
        if (!_wFixInfoDlg) {
            var cnt = AM.DIV();
            _wFixInfoDlg = new AM.popup({
                'autoclose': true,
                closetimeout: 1500,
                title: (getLangCaption('Info') || ''),
                content: cnt,
                'cn': 'popupwindow dlg-input',
                modal: true,
                outerclose: false,
                autoshow: false
            });
            _wFixInfoDlg.cnt = cnt;
            _wFixInfoDlg.setPos = function() {
                var ws = AM.getWindowSize();
                var sc = {
                    x: ws.w / 2,
                    y: ws.h / 2
                };
                var sz = AM.getSize(this.place);
                AM.setStyle(this.place, {
                    // left: Math.floor(sc.x - (sz.w / 2)) + '%',
                    top: Math.floor(sc.y - (sz.h / 2)) + 'px',
                    width: '80%',
                    margin: '0 10% 0 10%',
                    'background-color': dialogTheme
                });
            }
        }
        prm = prm || {};
        if (prm.timeOut) {
            _wFixInfoDlg.closetimeout = prm.timeOut;
        } else {
            _wFixInfoDlg.closetimeout = 1500;
        }
        _wFixInfoDlg.show();
        AM.setHTML(_wFixInfoDlg.cnt, (getLangCaption(prm.content) || ''));
        _wFixInfoDlg.setPos();
    }


    var _wInfoDlg = null;
    function _infoDialog(prm) {
        var title = getLangCaption(prm.title ? prm.title : 'Info') || '',
            okCaption = getLangCaption(prm.okCaption ? prm.okCaption : 'Ok') || '';
        
        if (!_wInfoDlg) {
            var cnt = AM.DIV();
            var bok = AM.INPUT({
                c: 'dlg-button',
                type: 'button',
                style: 'background-color: ' + dialogTheme
            });
            var cntFooter = AM.DIV({
                c: 'dlg-footer'
            }, bok);
            var body = AM.DIV(cnt, cntFooter);

            _wInfoDlg = new AM.popup({
                'autoclose': (prm.disableTimer ? false : true),
                'closetimeout': (prm.timeOut ? prm.timeOut : 1500),
                'title': title,
                'content': body,
                'cn': 'popupwindow dlg-input',
                'modal': true,
                'outerclose': false,
                'autoshow': false
            });
            _wInfoDlg.cnt = cnt;
            _wInfoDlg.oCb = null;
            _wInfoDlg.bok = bok;
            _wInfoDlg.cntFooter = cntFooter;

            _wInfoDlg.setPos = function() {
                var ws = AM.getWindowSize();
                var sc = {
                    x: ws.w / 2,
                    y: ws.h / 2
                };
                var sz = AM.getSize(this.place);
                AM.setStyle(this.place, {
                    // left: Math.floor(sc.x - (sz.w / 2)) + '%',
                    'top': Math.floor(sc.y - (sz.h / 2)) + 'px',
                    'width': '80%',
                    'margin': '0 10% 0 10%',
                    'background-color': dialogTheme
                });
            }
            AM.AEV(bok, 'click', function(e) {
                _wInfoDlg.close();
                if (_wInfoDlg.oCb) {
                    _wInfoDlg.oCb('y');
                }
            });
        }
        
        _wInfoDlg.autoclose = (prm.disableTimer ? false : true);
        _wInfoDlg.closetimeout = (prm.timeOut ? prm.timeOut : 1500);
        _wInfoDlg.bok.value = okCaption;
        _wInfoDlg.oCb = (prm.okCallback ? prm.okCallbackFunction : null);
        
        _wInfoDlg.show();
        _wInfoDlg.setPos();
        
        // set title and content after objects are appended to the DOM
        AM.setHTML(_wInfoDlg.titleplace, title);
        AM.setHTML(_wInfoDlg.cnt, (getLangCaption(prm.content) || ''));

        // if (prm.disableTimer) {
        //     _wInfoDlg.cntFooter.classList.remove('hide');
        // } else {
        //     _wInfoDlg.cntFooter.classList.add('hide');
        // }

        if (prm.disableButtons) {
            _wInfoDlg.cntFooter.classList.add('hide');
        } else {
            if (prm.disableTimer) {
                _wInfoDlg.cntFooter.classList.remove('hide');
            } else {
                _wInfoDlg.cntFooter.classList.add('hide');
            }
       }
    }

    var _wInpDlg = null;
    function _inputDialog(prm, okCallback, cancelCallback) {
        if (!_wInpDlg) {
            var inp = AM.INPUT({
                type: 'number',
                style: 'width:100%'
            });
            var bok = AM.INPUT({
                c: 'dlg-button',
                type: 'button',
                value: (getLangCaption('OK') || ''),
                style: 'background-color: ' + dialogTheme
            });
            var bc = AM.INPUT({
                c: 'dlg-button',
                type: 'button',
                value: (getLangCaption('Cancel') || ''),
                style: 'background-color: ' + dialogTheme
            });
            var cnt = AM.DIV(inp, AM.DIV({
                c: 'dlg-footer'
            }, bok, bc));
            _wInpDlg = new AM.popup({
                title: '_',
                content: cnt,
                'cn': 'popupwindow dlg-input',
                modal: true,
                outerclose: false,
                autoshow: false
            });
            _wInpDlg.inp = inp;
            _wInpDlg.oCb = null;
            _wInpDlg.cCb = null;
            _wInpDlg.setPos = function() {
                var ws = AM.getWindowSize();
                var sc = {
                    x: ws.w / 2,
                    y: ws.h / 2
                };
                var sz = AM.getSize(this.place);
                AM.setStyle(this.place, {
                    // left: Math.floor(sc.x - (sz.w / 2)) + 'px',
                    top: Math.floor(sc.y - (sz.h / 2)) + 'px',
                    width: '80%',
                    margin: '0 10% 0 10%',
                    'background-color': dialogTheme
                });
            }
            AM.AEV(bok, 'click', function(e) {
                _wInpDlg.close();
                if (_wInpDlg.oCb) {
                    _wInpDlg.oCb(_wInpDlg.inp.value);
                }
            });
            AM.AEV(bc, 'click', function(e) {
                _wInpDlg.close();
                if (_wInpDlg.cCb) {
                    _wInpDlg.cCb();
                }
            });
        }
        _wInpDlg.show();
        AM.setHTML(_wInpDlg.titleplace, (getLangCaption(prm.title) || '') || (getLangCaption('Insert value') || ''));
        _wInpDlg.inp.value = prm.value || '';
        _wInpDlg.inp.type = prm.type || 'text';
        _wInpDlg.setPos();
        if (okCallback) {
            _wInpDlg.oCb = okCallback;
        } else {
            _wInpDlg.oCb = null;
        }
        if (cancelCallback) {
            _wInpDlg.cCb = cancelCallback;
        } else {
            _wInpDlg.cCb = null;
        }
        setTimeout(function() {
            _wInpDlg.inp.focus();
            _wInpDlg.inp.select();
            setTimeout(function() {
                if (isCordova() && Keyboard) {
                    Keyboard.show();
                }
            }, 10);
        }, 200);
    }


    var _wConfirmDlg = null;

    function _confirmDialog(prm, okCallback, cancelCallback) {
        if (!_wConfirmDlg) {

            var bok = AM.INPUT({
                c: 'dlg-button',
                type: 'button',
                style: 'background-color: ' + dialogTheme
            });
            var bc = AM.INPUT({
                c: 'dlg-button',
                type: 'button',
                style: 'background-color: ' + dialogTheme
            });
            var cntx = AM.DIV();
            var cnt = AM.DIV(cntx, AM.DIV({
                c: 'dlg-footer'
            }, bok, bc));
            _wConfirmDlg = new AM.popup({
                title: (getLangCaption('Confirmation') || ''),
                content: cnt,
                'cn': 'popupwindow dlg-input',
                modal: true,
                outerclose: false,
                autoshow: false
            });
            _wConfirmDlg.cntx = cntx;
            _wConfirmDlg.oCb = null;
            _wConfirmDlg.cCb = null;
            _wConfirmDlg.bok = bok;
            _wConfirmDlg.bc = bc;
            _wConfirmDlg.setPos = function() {
                var ws = AM.getWindowSize();
                var sc = {
                    x: ws.w / 2,
                    y: ws.h / 2
                };
                var sz = AM.getSize(this.place);
                AM.setStyle(this.place, {
                    // left: Math.floor(sc.x - (sz.w / 2)) + 'px',
                    top: Math.floor(sc.y - (sz.h / 2)) + 'px',
                    width: '80%',
                    margin: '0 10% 0 10%',
                    'background-color': dialogTheme
                });
            }
            AM.AEV(bok, 'click', function(e) {
                _wConfirmDlg.close();
                if (_wConfirmDlg.oCb) {
                    _wConfirmDlg.oCb('y');
                }
            });
            AM.AEV(bc, 'click', function(e) {
                _wConfirmDlg.close();
                if (_wConfirmDlg.cCb) {
                    _wConfirmDlg.cCb();
                }
            });
        }
        _wConfirmDlg.show();
        AM.setHTML(_wConfirmDlg.titleplace, (getLangCaption(prm.title) || '') || (getLangCaption('Confirmation') || ''));
        AM.setHTML(_wConfirmDlg.cntx, (getLangCaption(prm.content) || '') || (getLangCaption('Are you sure?') || ''));
        _wConfirmDlg.bok.value = (getLangCaption(prm.okCaption) || '') || (getLangCaption('Ok') || '');
        _wConfirmDlg.bc.value = (getLangCaption(prm.cancelCaption) || '') || (getLangCaption('Cancel') || '');
        _wConfirmDlg.setPos();
        if (okCallback) {
            _wConfirmDlg.oCb = okCallback;
        } else {
            _wConfirmDlg.oCb = null;
        }
        if (cancelCallback) {
            _wConfirmDlg.cCb = cancelCallback;
        } else {
            _wConfirmDlg.cCb = null;
        }
        //if(prm){
        //  _wInpDlg['prm']=prm;
        //  var row=_localTable['cart'].find(_makeFlt(prm,[{'tf':'id','rf':'id'}]),true);
        //  //console.log(row);
        //  if (row) {
        //      _wInpDlg.inp.value=row['qty'];
        //  } else {
        //      _wInpDlg.inp.value='0';
        //  }
        //} else {
        //  _wInpDlg['prm']=null;
        //}

    }

    var _wModDlg = null;
    function _modalDialog(prm) {
        if (!_wModDlg) {
            var button = AM.INPUT({
                'c': 'dlg-button',
                'type': 'button',
                'value': 'x',
                'style': 'padding:0;width:15px;min-width:0px;position:absolute;top:5px;right:5px;z-index:99;background:transparent;border:none'
            });
            var content = AM.DIV({style: 'position:relative;min-height:400px;overflow-y:auto'});
            
            _wModDlg = new AM.popup({
                'title': 'Modal',
                'content': AM.DIV(content, button),
                'cn': 'popupwindow dlg-input',
                'modal': true,
                'autoshow': false,
                'outerclose': typeof prm.closable === 'boolean' ? prm.closable : true
            });
            _wModDlg.setPos = function() {
                var ws = AM.getWindowSize();
                var sc = {
                    'x': ws.w / 2,
                    'y': ws.h / 2
                };
                var sz = AM.getSize(this.place);
                AM.setStyle(this.place, {
                    'top': Math.floor(sc.y - (sz.h / 2)) + 'px',
                    'width': '80%',
                    'margin': '0 10% 0 10%',
                    'background-color': dialogTheme
                });
            };

            AM.AEV(button, 'click', function(e) {
                _wModDlg.close();
            });
            
            if (prm.snippet) {
                displaySnippetContent(prm.snippet, $(content), {
                    body: content,
                    complete: function() {
                        _wModDlg.setPos();
                        displayModalDialog(prm);
                    }
                });
            }
        } else {
            displayModalDialog(prm);
        }
    }
    
    /**
     * Display the modal dialog by checking the param whether to display or not
     */
    function displayModalDialog(param) {
        // Check whether to display the dialog or not
        if (param.show) {
            _wModDlg.show();
        } else {
            _wModDlg.close();
        }
    }
    
    /**
     * Displays the snippet content
     * 
     * @param {string} snippetName The name of the snippet to get
     * @param {object} element The element that will get the content
     * @param {object} options 
     */
    function displaySnippetContent(snippetName, element, options) {
        options = options || {};
        
        var data = {};
        if (typeof(_snippet) != 'undefined' && _snippet[snippetName]) {
            var snippetData = clone(_snippet[snippetName]);
            containerLoad(snippetData, data, undefined, undefined, undefined, snippetName);
            display();
        }
        
        function display() {
            // apply the properties
            compIncludeStyle(data, element);
            
            var totalHeight = 0;
            for (var i = 0; i < data.childs.length; i++) {
                element.append(data.childs[i]._el);

                // compute the total height
                totalHeight += data.childs[i]._el.clientHeight;
            }
            
            if (options.body && totalHeight) {
                options.body.style.height = totalHeight + 'px';
            }
            
            // run events
            if (snippetData.ev) {
                if (snippetData.ev.load) {
                    // use setTimeout because the elements may not yet added to the DOM
                    // increase the timeout to 400
                    setTimeout(function() {
                        _doAction(snippetData.ev.load, { 'obj': this, 'input': snippetData });
                    }, 400);
                }
                if (snippetData.ev.scrollBottom) {
                    AM.AEV(element, 'scroll', function(e) {
                        if (element.offsetHeight + element.scrollTop + 10 > element.scrollHeight) {
                            _doAction(snippetData.ev.scrollBottom, {
                                'obj': this,
                                'input': snippetData
                            });
                        }
                    });
                }
                if (snippetData.ev.scrollTop) {
                    AM.AEV(element, 'scroll', function(e) {
                        if (element.scrollTop == 0) {
                            _doAction(snippetData.ev.scrollTop, {
                                'obj': this,
                                'input': snippetData
                            });
                        }
                    });
                }
                if (snippetData.ev.onScroll) {
                    AM.AEV(element, 'scroll', function(e) {
                        if (element.scrollTop > 0 || (element.offsetHeight + element.scrollTop + 10 < element.scrollHeight)) {
                            _doAction(snippetData.ev.onScroll, {
                                'obj': this,
                                'input': snippetData
                            });
                        }
                    });
                }
            }
            
            if (typeof options.complete === 'function') {
                options.complete();
            }
        }
    }

    /**
     * Signature Functions
     */
    registerFunction({
        'signatureRedraw': function(prm) {
            var comp = _getComponent(prm);
            if (comp) {
                comp.redraw();
                return true;
            }
            return false;
        }
    }, 'Signature');

    registerFunction({
        'infoDialog': function(prm) {
            var oCb = false;
            if (prm.okCallback) {
                var ebd = this || {};
                oCb = function() {
                    _doAction(prm.okCallback, ebd);
                }
                prm.okCallbackFunction = oCb;
            }
            _infoDialog(prm);
            return false;
        },
        'inputDialog': function(prm) {
            var oCb = false;
            var cCb = false;
            var fprm = prm || {};
            if (prm.okCallback) {
                var oprm = prm.okCallback; //AM.update({},prm.okCallback);
                oCb = function(v) {
                    if (AM.isArray(oprm)) {
                        AM.map(oprm, function(i) {
                            i._embed = {
                                'input': v
                            };
                            runFunction(i);
                        });
                    } else {
                        oprm._embed = {
                            'input': v
                        };
                        runFunction(oprm);
                    }
                }
            }
            if (prm.cancelCallback) {
                var cprm = prm.cancelCallback;
                cCb = function() {
                    runFunction(cprm);
                }
            }
            _inputDialog(fprm, oCb, cCb);
            return false;
        },
        'confirmDialog': function(prm) {
            var oCb = false;
            var cCb = false;
            var fprm = prm || {};
            if (prm.okCallback) {
                oCb = function() {
                    var ebd = this || {};
                    _doAction(prm.okCallback, ebd);
                }
            }
            if (prm.cancelCallback) {
                cCb = function() {
                    var ebd = this || {};
                    _doAction(prm.cancelCallback, ebd);
                }
            }
            _confirmDialog(fprm, oCb, cCb);
            return false;
        },
        'modalDialog': function(prm) {
            _modalDialog(prm);
            return false;
        }
    }, 'Dialog');

    var TDataset = TComponent.extend({
        _loading: false,
        _last: false,
        _topScroll: true,
        _fields: [],
        load: function(o) {
            this.parent(o);
        },
        refreshListener: function(next, callback) {
            next = next || false;
            var self = this;
            this._listener = this._listener || [];
            // Check if there is any active listener in the page
            if (this._listener.length > 0) {
                // Refresh the listeners
                AM.map(this._listener, function(i) {
                    if (i) {
                        if (i.setItems) {
                            i.setItems(self.data, next, self._topScroll, callback);
                        }
                    }
                });
            } else {
                // Trigger the callback
                if (callback) {
                    callback(this);
                }
            }
            self._topScroll = true;
        },
        removeListener: function(o) {
            var self = this;
            AM.rmap(self._listener || [], function(i, j) {
                if (i == o) {
                    self._listener.splice(j, 1);
                }
            });
        },
        init: function(name) {
            this.parent(name);
        },
        dataToString: function() {
            if (this.data) {
                return AM.serializeJSON(this.data);
            } else {
                return '[]';
            }
        },
        dataFieldToArray: function(field) {
            this.data = this.data || [];
            var arr = [];
            AM.map(this.data, function(i) {
                if (i[field] != 'undefined') {
                    arr.push(i[field]);
                }
            });
            return arr;
        },
        dataFromString: function(s) {
            this.data = AM.evalTxt(s);
        },
        setAttr: function(attr, w) {
            this.parent(attr, w);
            if (attr['autoCreate']) {

            }
            if (attr['autoLoad']) {

            }
        },
        setConnector: function() {
            // Set the connector
            if (!this._connector && this.connector) {
                this._connector = _Scope.componentByName(this.connector);
            }
        },
        /**
         * Check if the connector is intialized if not then try to initailize
         * 
         * @return {boolean} - if connected
         */
        isConnectorSet: function() {
            // Try to initalize if not existing
            if (!this._connector) {
                this.setConnector();
            }

            // Return the if success or initialized
            if (!this._connector) {
                return false;
            }
            return true;
        }
    });
    registerComponent(TDataset, 'TDataset', TComponent);

    /**
     * Staging Table Component
     */ 
    var TStagingDataset = TDataset.extend({
        // Main configurations
        _lastCfg: {},
        _lastCb: null,
        _lastEcb: null,
        // Additional configurations
        autoLoad: true,
        autoClear: false,
        prm: {},
        table: '',
        /*****
         * Used within eMOBIQ
         *****/
        addListener: function(o) {
            this._listener = this._listener || [];
            if (!AM.isIn(o, this._listener)) {
                // Clear first as it should not have multiple listeners
                this._listener = [];
                this._listener.push(o);
            }
        },
        init: function(name) {
            this.parent(name);
        },
        load: function(o) {
            var attr = o.attr || {};
            this.table = attr.table || '';
            this.limit = attr.limit || null;
        },
        setParam: function(prm) {
            this.prm = prm;
        },
        /*****
         * Used within this object
         *****/
        // Send the request to the api
        sendRequest: function(prm, cb, ecb) {
            // Generate the header
            var headers = {};
            if (prm.header) {
                 for (var key in prm.header) {
                    if (prm.header[key]) {
                        var header = prm.header[key].split(':', 2);
                        headers[header[0]] = header[1].trim();
                    }
                }
            }
            
            // Prepare the data
            var params = {};
            
            if (prm.filter) {
                params._filter = JSON.stringify(prm.filter);
            }
            if (prm.orfilter) {
                params._orfilter = JSON.stringify(prm.orfilter);
            }
            if (prm.order) {
                params._order = JSON.stringify(prm.order);
            }
            if (prm.first) {
                params.first = prm.first;
            }
            if (prm.limit) {
                params.lmt = prm.limit;
            }
            if (prm.page) {
                params.pg = prm.page;
            }
            if (prm.data) {
                params.data = typeof prm.data === 'string' ? prm.data : JSON.stringify(prm.data);
            }
            if (typeof prm.append !== 'undefined') {
                params.append = prm.append;
            }
            
            // Create the url
            var url = _baseConfig.api + 
                        '/?controller=' + prm.controller + 
                        '&action=' + prm.action + 
                        '&appid=' + _baseConfig.appid +
                        '&tbl_name=' + this.table;
            
            // Run the ajax http request
            $.ajax({
                type: ((prm.method && prm.method.match(/^post$/i)) ? 'POST' : 'GET'),
                url: url,
                headers: headers,
                data: params,
                timeout: 60000
            })
            .done(function(data) {
                if (data.s) {
                    if (cb) {
                        cb(data.dt);
                    }
                } else {
                    if (ecb) {
                        ecb(data.err ? data : { err:'Unknown error' });
                    }
                }
            })
            .fail(function(error) {
                if (ecb) {
                    ecb(error.responseJSON ? error.responseJSON : { err:'Unknown error' });
                }
            });
        },
        /***** 
         * (DEPRECATED ONE - LEAVE IT)
         * Used within this object
         *****/
        request: function(cb, ecb, prm) {
            var prm2 = {};
            if (prm.limit) {
                prm2.lmt = prm.limit;
            }
            if (prm.page) {
                prm2.pg = prm.page;
            }
            if (prm.filter) {
                prm2._filter = AM.serializeJSON(prm.filter);
            }
            if (prm.orFilter) {
                prm2._orfilter = AM.serializeJSON(prm.orFilter);
            }
            if (prm.order) {
                prm2._order = AM.serializeJSON(prm.order);
            }
            getService('record', 'get', AM.update({
                tbl_name: this.table
            }, prm2), function(o) {
                if (cb) {
                    cb(o);
                } else if (ecb) {
                    ecb({
                        'err': 'error loading'
                    });
                }
            });
        },
        /***** 
         * Processes/Actions for this object
         *****/
        loadData: function(cb, ecb, config) {
            // check if there's table
            if (!this.table) {
                return false;
            }
            
            var self = this;
            var next = false;
            var param = {
                controller: 'record',
                action: 'query'
            };
            
            // initialize
            this._lastCb = null;
            this._last = false;
            
            if (config && config.parameter) {
                // Setup if it's a loadnext function
                next = config.parameter.next || false;
                delete(config.parameter.next);
                
                if (config.parameter.limit) {
                    param.limit = config.parameter.limit;
                }
                if (config.parameter.page) {
                    param.page = config.parameter.page;
                }
                if (config.parameter.filter) {
                    param.filter = config.parameter.filter;
                }
                if (config.parameter.orFilter) {
                    param.orFilter = config.parameter.orFilter;
                }
                if (config.parameter.order) {
                    param.order = config.parameter.order;
                }
            }
            
            this._lastCfg = clone(config);
            this.sendRequest(param, function(data){
                if (cb) {
                    cb(data);
                    self._lastCb = cb;
                }
                self.data = data || [];
                self.refreshListener(next);
                
                if (data.length === 0) {
                    self._last = true;
                }
                
                // set the loading to false
                self._loading = false;
            }, function(err){
                if (ecb) {
                    ecb(err);
                    self._lastEcb = ecb;
                }
                
                // set the loading to false
                self._loading = false;
            });
            
            return true;
        },
        loadNext: function(ebd, beforeCallback) {
            // check if still loading
            if (this._loading) {
                return;
            }
            
            // Only trigger the before callback if there is data
            if (this._last == false && beforeCallback) {
                _doAction(beforeCallback, AM.update(ebd, {}));
            }
            
            // set to true
            this._loading = true;
            
            var config = this._lastCfg || {};
            config.parameter = config.parameter || {};
            config.parameter.next = true;
            config.parameter.page = config.parameter.page || 1;
            if (config.parameter.page) {
                config.parameter.page++;
            }
            this.loadData(this._lastCb, this._lastEcb, config);
        },
        selectAll: function(cb, ecb) {
            var param = {};
            param.controller = 'record';
            param.action = 'query';
            this.sendRequest(param, cb, ecb);
        },
        selectBy: function(by, value, first, op, cb, ecb) {
            var param = {};
            param.controller = 'record';
            param.action = 'query';
            param.filter = [{ f: by, v: value, o: op }];
            param.first = first || 0;
            this.sendRequest(param, cb, ecb);
        },
        selectByMulti: function(prm, callback, errorCallback) {
            var param = {};
            param.controller = 'record';
            param.action = 'query';
            param.first = prm.first || 0;
            if (prm.filter) {
                param.filter = prm.filter;
            }
            if (prm.orfilter) {
                param.orfilter = prm.orfilter;
            }
            this.sendRequest(param, callback, errorCallback);
        },
        updateBy: function (byField, byValue, data, operator, first, callback, errorCallback) {
            var param = {};
            param.controller = 'record';
            param.action = 'update';
            param.method = 'post';
            param.filter = [{ f: byField, v: byValue, o: operator }];
            param.first = first || 0;
            param.data = data;
            this.sendRequest(param, callback, errorCallback);
        },
        updateByMulti: function(prm, callback, errorCallback) {
            var param = {};
            param.controller = 'record';
            param.action = 'update';
            param.method = 'post';
            param.first = prm.first || 0;
            param.filter = prm.filter;
            param.orfilter = prm.orFilter;
            param.data = prm.data;
            this.sendRequest(param, callback, errorCallback);
        },
        dataFromString: function (values, append, cb, ecb) {
            if (typeof values === 'string') {
                try {
                    values = JSON.parse(values);
                } catch (e) {
                    ecb('Invalid values.');
                    return;
                }
            } else if (typeof values === 'object' && !values instanceof Array) {
                values = [values];
            } else if (typeof values !== 'object') {
                ecb('Invalid values.');
                return;
            }
            
            var param = {};
            param.controller = 'record';
            param.action = 'insert-batch';
            param.method = 'post';
            param.append = append ? 1 : 0;
            param.data = values;
            this.sendRequest(param, cb, ecb);
        },
        deleteBy: function (by, value, op, first, cb, ecb) {
            var param = {};
            param.controller = 'record';
            param.action = 'delete';
            param.method = 'post';
            param.filter = [{ f: by, v: value, o: op }];
            param.first = first || 0;
            this.sendRequest(param, cb, ecb);
        },
        // Delete by multiple filters
        deleteByMulti: function(prm, callback, errorCallback) {
            var param = {};
            param.controller = 'record';
            param.action = 'delete';
            param.method = 'post';
            param.first = prm.first || 0;
            param.filter = prm.filter;
            param.orfilter = prm.orFilter;
            param.data = prm.data;
            this.sendRequest(param, callback, errorCallback);
        },
        insert: function (dt, cb, ecb) {
            var param = {};
            param.controller = 'record';
            param.action = 'insert';
            param.method = 'post';
            param.data = dt;
            this.sendRequest(param, cb, ecb);
        },
        clear: function (cb, ecb) {
            var param = {};
            param.controller = 'record';
            param.action = 'delete-all';
            param.method = 'post';
            this.sendRequest(param, cb, ecb);
        },
        /***** 
         * (DEPRECATED ONE - LEAVE IT)
         * Processes/Actions for this object
         *****/
        deleteData: function(_id, cb) {
            getService('record', 'post', {
                tbl_name: this.table,
                'a': 'delete',
                '_id': _id
            }, function(o) {
                if (cb) {
                    cb(o);
                }
            });
        },
        insertData: function(prm, cb) {
            prm = prm || {};
            getService('record', 'post', AM.update({
                tbl_name: this.table,
                'a': 'set'
            }, prm), function(o) {
                if (cb) {
                    cb(o);
                }
            });
        },
        updateData: function(_id, prm, cb) {
            prm = prm || {};
            getService('record', 'post', AM.update({
                tbl_name: this.table,
                'a': 'set',
                '_id': _id
            }, prm), function(o) {
                if (cb) {
                    cb(o);
                }
            });
        }
    });
    registerComponent(TStagingDataset, 'TStagingDataset', TDataset);

    var TStagingViewDataset = TDataset.extend({
        autoLoad: true,
        autoClear: false,
        view: '',
        _lastCfg: {},
        _lastCb: null,
        prm: {},
        addListener: function(o) {
            this._listener = this._listener || [];
            if (!AM.isIn(o, this._listener)) {
                // Clear first as it should not have multiple listeners
                this._listener = [];
                this._listener.push(o);
            }
        },
        setParam: function(prm) {
            this.prm = prm;
        },
        request: function(cb, prm) {
            var prm2 = {};
            if (prm.limit) {
                prm2.lmt = prm.limit;
            }
            if (prm.page) {
                prm2.pg = prm.page;
            }
            if (prm.filter) {
                prm2._filter = AM.serializeJSON(prm.filter);
            }
            if (prm.orFilter) {
                prm2._orfilter = AM.serializeJSON(prm.orFilter);
            }
            if (prm.order) {
                prm2._order = AM.serializeJSON(prm.order);
            }
            getService('vrecord', 'get', AM.update({
                view_name: this.view
            }, prm2), function(o) {
                if (cb) {
                    cb(o);
                }
            });
        },
        loadData: function(cb, config) {
            var self = this;
            self._lastCb = null;
            if (this.view) {
                var next = false;
                config = config || {};
                config.parameter = config.parameter || {};
                if (self.limit && !config.parameter.limit) {
                    config.parameter.limit = self.limit;
                }
                if (config.parameter.limit) {
                    config.parameter.page = config.parameter.page || 1;
                    next = config.parameter.next || false;
                    delete(config.parameter.next);
                }
                var prm = config.parameter;
                var fcb = function(o) {
                    if (o.s && o.dt) {
                        var data = o.dt || [];
                        if (cb) {
                            self._lastCb = cb;
                            cb(data || []);
                        }
                        self.data = data;
                        self.refreshListener(next);
                    }
                }
                self._lastCfg = clone(config);
                setTimeout(function() {
                            this.request(fcb, prm);
                }, 10);
                return true;
            }
            return false;
        },
        loadNext: function() {
            var cfg = this._lastCfg || {};
            cfg.parameter = cfg.parameter || {};
            cfg.parameter.page = cfg.parameter.page || 1;
            cfg.parameter.next = true;
            if (cfg.parameter.page) {
                cfg.parameter.page++;
            }
            return this.loadData(this._lastCb, cfg);
        },
        load: function(o) {
            var attr = o.attr || {};
            this.view = attr.view || '';
            this.limit = attr.limit || null;
        },
        init: function(name) {
            this.parent(name);
        }
    });
    registerComponent(TStagingViewDataset, 'TStagingViewDataset', TDataset);

    /***************
     * Reusable functions
     ***************/

    /**
     * Used to compare/filter the two data passed
     * 
     * @param {any} x - first value
     * @param {any} y - second value
     * @param {any} o - operator value
     * 
     * @param {boolean}
     */
    function _Compare(x, y, o) {
        o = o || '=';

        // Check if it's an object then stringify it
        if (typeof x === 'object') {
            x = JSON.stringify(x);
        }
        if (typeof y === 'object') {
            y = JSON.stringify(y);
        }
        
        var xs = x || '';
        var ys = y || '';

        return (o == '=' || o == '==') ? x == y : (
            o == '!=' ? x != y :(
                o == '<>' ? x != y :(
                    o == '<=' ? x <= y : (
                        o == '>=' ? x >= y : (
                            o == '<' ? x < y : (
                                o == '>' ? x > y : (
                                    o == 'like' ? xs.toString().search(ys.toString()) > -1 : (
                                        o == 'ilike' ? xs.toString().toLowerCase().search(ys.toString().toLowerCase()) > -1 : false))))))));
    }

    /**
     * Filter the data
     * 
     * @param {object} prm - configuration to be used
     *                     - contains the filter + orfilter
     * @param {array} data - data to be filtered
     * 
     * @return {array} - filtered data
     */
    function globalFilterData(prm, data) {
        var result = [];
        var filter = [];
        var orFilter = [];

        // Filter for 'and'
        if (prm.filter) {
            var length = prm.filter.length || 10;

            // Get all the filter data and put it in an array
            for (var i = 0; i < length; i++) {
                if (prm.filter[i]) {
                    filter.push(prm.filter[i]);
                }
            }
        }

        // Filter for 'or'
        if (prm.orFilter) {
            var length = prm.orFilter.length || 10;

            // Get all the filter data and put it in an array
            for (var i = 0; i < length; i++) {
                if (prm.orFilter[i]) {
                    orFilter.push(prm.orFilter[i]);
                }
            }
        }

        // Filter the data
        result = data.filter(
            // Loop through the record
            function(record) {
                var valid = true; 

                // Filter for 'and'
                if (filter.length > 0) {
                    // Loop through all of the filters
                    for (var j = 0; j < filter.length; j++) {
                        // Check if the data is accepted in the filter criteria
                        var field = record[filter[j]['f']] || record[filter[j]['field']];
                        var operator = filter[j]['o'] || filter[j]['operator'] || '=';
                        var value = filter[j]['v'] || filter[j]['value'];
                        valid = _Compare(field, value, operator);

                        // If already false then stop the loop
                        if (!valid) {
                            return false;
                        }

                    }
                }

                // Filter for 'or' if 'and' filter is ok
                if (valid) {
                    if (orFilter.length > 0) {
                        // Loop through all of the filters
                        var orValid = false;
                        for (var j = 0; j < orFilter.length; j++) {
                            // Check if the data is accepted in the filter criteria
                            var field = record[orFilter[j]['f']] || record[orFilter[j]['field']];
                            var operator = orFilter[j]['o'] || orFilter[j]['operator'] || '=';
                            var value = orFilter[j]['v'] || orFilter[j]['value'];
                            if (_Compare(field, value, operator)) {
                                orValid = true;
                            }
                        }

                        if (!orValid) {
                            valid = false;
                        }
                    }
                }

                return valid;
            }
        );

        return result;
    }

    /**
     * Sort the data
     * 
     * @param {object} prm - configuration to be used
     *                     - contains the filter + orfilter
     * @param {array} data - data to be filtered
     * 
     * @return {array} - filtered data
     */
    function globalSortData(prm, data) {
        var result = data;

        // Sort the data
        result.sort(
            function(a, b) {
                // Holder for the expression
                var expression = "";

                // Loop through all of the sorting data
                for (var key in prm.order) {
                    var sortData = prm.order[key];

                    // Make sure the sortData is not null
                    if (sortData) {
                        // Set to case insensitive
                        var sortField1 = a[sortData.f] || a[sortData.field];
                        var sortField2 = b[sortData.f] || b[sortData.field];
                        var val1 = (sortField1 ? sortField1.toString().toUpperCase() : '');
                        var val2 = (sortField2 ? sortField2.toString().toUpperCase() : '');

                        // Convert to date if it's a valid date
                        if (isNaN(val1) && !isNaN(Date.parse(val1.replace(/([a-z])\W+(\d)/ig, "$1$2")))) {
                            val1 = Date.parse(val1).toString();
                        }
                        if (isNaN(val2) && !isNaN(Date.parse(val2.replace(/([a-z])\W+(\d)/ig, "$1$2")))) {
                            val2 = Date.parse(val2).toString();
                        }
                        
                        // Retrieve the order type
                        var sortOrder = sortData.v || sortData.order;
                        sortOrder = sortOrder.toUpperCase();

                        // Sort the data
                        let value = val1.localeCompare(val2, undefined, {
                            numeric: true,
                            sensitivity: 'base'
                        });

                        // Prepare the expression to evaluate
                        expression +=  (sortOrder == 'DESC' ? (value * -1) : value) + " || ";
                    }
                }

                // Evaluate the combined expression
                return eval(expression.substring(0, expression.length - 4));
            }
        );

        return result;
    }

    /**
     * Local Table Component
     */ 
    var TLocalTable = TDataset.extend({
        // Main configurations
        _lastCfg: {},
        _lastCb: null,
        _lastEcb: null,
        // Additional configurations
        autoLoad: true,
        autoClear: false,
        prm: {},
        /*****
         * Used within eMOBIQ
         *****/
        addListener: function(o) {
            this._listener = this._listener || [];
            if (!AM.isIn(o, this._listener)) {
                // Clear first as it should not have multiple listeners
                this._listener = [];
                this._listener.push(o);
            }
        },
        init: function(name) {
            this.parent(name);
        },
        load: function(o) {
            this.parent(o);
            if (!this.name && o.name) {
                this.name = o.name;
            }
            var attr = o.attr || {};
            this._fields = attr.fields || {};
            this.autoLoad = attr.autoLoad || false;
            this.autoClear = attr.autoClear || false;
            if (attr.autoClear) {
                this.clear();
            }
            this.loadFirst();
            if (this.autoLoad) {
                this.loadData();
            }
        },
        setParam: function(prm) {
            this.prm = prm;
        },
        /***** 
         * Used within this object
         *****/
        fixKeyValue: function(kf) {
            var kf2 = {};
            for (var i in kf) {
                if (this._fields[i]) {
                    kf2[i] = kf[i];
                }
            }
            return kf2;
        },
        loadFirst: function() {
            this._data = getLocalJSONStorage('localTable_' + this.name, []);
        },
        save: function() {
            setLocalJSONStorage('localTable_' + this.name, this._data);
        },
        /***** 
         * Processes/Actions for this object
         *****/
        clear: function(cb, ecb) {
            deleteLocalJSONStorage('localTable_' + this.name);
            this._data = [];
            if (cb) { cb(this._data); }
            return this._data;
        },
        dataFromString: function(values, append, cb, ecb) {
            // Make sure the values are valid
            if (AM.isString(values)) {
                values = JSON.parse(values);
            } else if (AM.isObject(values) && !AM.isArray(values)) {
                values = [values];
            } else if (!AM.isObject(values)) {
                if (ecb) { ecb('Invalid values.'); }
                return 'Invalid values.';
            }

            // Check if it's to append or create a new one
            if (append) {
                var data = this._data; 
            } else {
                var data = [];
            }

            // Check if unique id is activated
            if (this.attr.uniqueKey) {
                var uniqueId;
                if (data.length == 0) {
                    uniqueId = 1;
                } else {
                    var tmp = data[data.length - 1];
                    if (tmp._id) {
                        uniqueId = parseInt(tmp._id) + 1;
                    } else {
                        uniqueId = 1;
                    }
                }

                for (var ctr in values) {
                    delete values[ctr]._id;
                    values[ctr]._id = uniqueId++;
                }
            }

            this._data = data.concat(values);
            this.save();

            if (cb) { cb(this._data); }
            return this._data;
        },
        deleteBy: function (by, value, op, first, cb, ecb) {
            // Prepare the default values
            this._data = this._data || [];
            op = op || '=';
            first = first || false;

            // Storage of the result
            var dt = [];

            // Go through the data
            for (var i = 0; i < this._data.length; i++) {
                if (_Compare(this._data[i][by], value, op)) {
                    dt.push(this._data[i]);
                    this._data.splice(i, 1);
                    i--;
                    if (first) {
                        break;
                    }
                }
            }

            // Save the updated records
            this.save();
                
            // Manipulate the data if needed
            if (first) {
                dt = (dt.length == 0 ? false : dt[0]);
            }
            
            // Return the updated data
            if (cb) {
                cb(dt);
            }
            return dt;
        },
        deleteByMulti: function(prm, callback, errorCallback) {
            // Prepare the data needed
            var self = this,
                tmpData = [],
                data = [],
                first = prm.first || false;
            
            self._data = self._data || [];
            tmpData.push.apply(tmpData, self._data || []);

            // Check if there are any filters included
            if (prm.filter || prm.orFilter) {
                tmpData = globalFilterData(prm, tmpData);
            }

            // Go through the records to be updated
            if (tmpData.length > 0) {
                var deleted = false;
                for (var index = 0; index < self._data.length; index++) {
                    deleted = false;
                    
                    // Go through the tmpData to know whethere to update the record
                    for (var id in tmpData) {
                        // Validate now
                        if (_Compare(self._data[index], tmpData[id], '=')) {
                            data.push(self._data[index]);
                            self._data.splice(index, 1);
                            index--;
                            delete tmpData[id];
                            deleted = true;
                            break;
                        }
                    }
                    
                    // Break from the loop if only need to delete the first record
                    if (deleted && first) {
                        break;
                    }
                }
            }

            // Save the updated records
            self.save();

            // Return the updated data
            if (callback) {
                callback(data);
            }
            return data;
        },
        filter: function (filterPrm, first, or, cb, ecb) {
            this._data = this._data || [];
            var dt = [];
            for (var i = 0; i < this._data.length; i++) {
                var ya = or ? false : true;
                for (var j = 0; j < filterPrm.length; j++) {
                    ya = _Compare(this._data[i][filterPrm[j]['by']], filterPrm[j]['value'], filterPrm[j]['op']);
                    if (or && ya) {
                        break;
                    }
                    if (!or && !ya) {
                        break;
                    }
                }
                if (ya) {
                    if (first) {
                        if (cb) {
                            cb(this._data[i]);
                        }
                        return this._data[i];
                    } else {
                        dt.push(this._data[i]);
                    }
                }
            }

            if (first) {
                if (cb) { cb(false); }
                return false;
            } else {
                if (cb) { cb(dt); }
                return dt;
            }
        },
        insert: function(dt, cb, ecb) {
            this._data = this._data || {};

            // Check if unique id is activated
            if (this.attr.uniqueKey) {
                if (this._data.length == 0) {
                    dt._id = 1;
                } else {
                    var tmp = this._data[this._data.length - 1];
                    if (tmp._id) {
                        dt._id = parseInt(tmp._id) + 1;
                    } else {
                        dt._id = 1;
                    }
                }
            } else {
                delete dt._id;
            }

            this._data.push(this.fixKeyValue(dt));
            this.save();
            
            if (cb) { cb(dt); }
            return dt;
        },
        loadData: function(callback, errorCallback, config) {
            var self = this;

            // Prepare the variables to be used
            var next = false; // Check if from loadnext
            var prm = {
                page: 1
            }; // Final configuration to be used

            // Get all the data first
            self.data = [];
            self.data.push.apply(self.data, clone(self._data));

            // Check if configuration was passed
            if (config && config.parameter) {
                // Setup if it's a loadnext function
                next = config.parameter.next || false;
                delete(config.parameter.next);
                // Set other necessary default config
                if (config.parameter.limit) {
                    prm.limit = config.parameter.limit;
                }
                if (config.parameter.page) {
                    prm.page = config.parameter.page;
                }
                if (config.parameter.filter) {
                    prm.filter = config.parameter.filter;
                }
                if (config.parameter.orFilter) {
                    prm.orFilter = config.parameter.orFilter;
                }
                if (config.parameter.order) {
                    prm.order = config.parameter.order;
                }
            }

            // Check if there are any filters included
            if (prm.filter || prm.orFilter) {
                self.data = globalFilterData(prm, self.data);
            }

            // Check if needed to be sort
            if (prm.order) {
                self.data = globalSortData(prm, self.data);
            }

            // Pagination
            if (prm.limit) {
                var d = new Paginate(self.data, prm.limit);
                if (prm.page <= d.totalPages) {
                    self._last = false;
                    self.data = d.page(prm.page);
                } else {
                    self._last = true;
                    self.data = [];
                }
            } else {
                if (prm.page > 1) {
                    self.data = [];
                }
            }

            // Store the callbacks and config
            self._lastCb = callback || null;
            self._loading = false;
            self._lastEcb = errorCallback || null;
            self._lastCfg = clone(config);

            // Refresh the listener to load up the updated data
            self.refreshListener(next, function(){
                // Check if have callback then trigger
                if (self._lastCb){
                    self._lastCb(self.data || []);
                }
            });

            return self.data;
        },
        loadNext: function(element, beforeCallback) {
            var self = this;

            // Only trigger the before callback if there is data
            if (self._last == false && beforeCallback) {
                _doAction(beforeCallback, AM.update(element, {}));
            }

            // Check if it's already loading
            if (self._loading == false) {
                self._loading = true;
                // Prepare the parameter to load the next
                var cfg = self._lastCfg || {};
                cfg.parameter = cfg.parameter || {};
                cfg.parameter.page = cfg.parameter.page || 1;
                cfg.parameter.next = true;
                if (cfg.parameter.page) {
                    cfg.parameter.page++;
                }
                return self.loadData(self._lastCb, self._lastEcb, cfg);
            } else {
                self._lastCb;
            }
        },
        select: function() {
            return this.selectAll();
        },
        selectAll: function(cb, ecb) {
            var data = clone(this._data) || [];
            if (cb) { cb(data); }
            return data;
        },
        selectBy: function(by, value, first, op, cb, ecb) {
            // Prepare the default values
            var data = clone(this._data) || [];
            op = op || '=';
            first = first || false;

            // Storage of the result
            var dt = [];

            // Loop through the current items stored
            for (var i = 0; i < data.length; i++) {
                // Check if it's a valid record
                if (_Compare(data[i][by], value, op)) {
                    // Store the item
                    dt.push(data[i]);

                    // Stop the loop if only first
                    if (first) {
                        break;
                    } 
                }
            }

            // Manipulate the data if needed
            if (first) {
                dt = (dt.length == 0 ? false : dt[0]);
            }

            // Return the result 
            if (cb) { 
                cb(dt); 
            }
            return dt;
        },
        selectByMulti: function(prm, callback, errorCallback) {
            // Prepare the data needed
            var self = this,
                data = [],
                first = prm.first || false;
            
            data.push.apply(data, clone(self._data) || []);

            // Check if there are any filters included
            if (prm.filter || prm.orFilter) {
                data = globalFilterData(prm, data);
            }
            
            // Check if only the first
            if (first) {
                data = data.length > 0 ? data[0] : false;
            }

            // Return the result 
            if (callback) { 
                callback(data); 
            }
            return data;
        },
        updateBy: function (byField, byValue, row, op, first, cb, ecb) {
            // Prepare the default values
            this._data = this._data || [];
            op = op || '=';
            first = first || false;

            // Prepare the data to be updated
            var fkv = this.fixKeyValue(row);
            delete fkv._id;

            // Storage of the result
            var dt = [];

            // Go through the data
            for (var i = 0; i < this._data.length; i++) {
                if (_Compare(this._data[i][byField], byValue, op)) {
                    this._data[i] = AM.update(clone(this._data[i]), clone(fkv));
                    dt.push(this._data[i]);
                    if (first) {
                        break;
                    }
                }
            }
            // Save the updated records
            this.save();
            
            // Manipulate the data if needed
            if (first) {
                dt = (dt.length == 0 ? false : dt[0]);
            }
            
            // Return the updated data
            if (cb) {
                cb(dt);
            }
            return dt;
        },
        updateByMulti: function(prm, callback, errorCallback) {
            // Prepare the data needed
            var self = this,
                tmpData = [],
                data = [],
                first = prm.first || false;
            
            self._data = self._data || [];
            tmpData.push.apply(tmpData, self._data || []);

            // Prepare the data to be updated
            var fkv = this.fixKeyValue(prm['data']);
            delete fkv._id;

            // Check if there are any filters included
            if (prm.filter || prm.orFilter) {
                tmpData = globalFilterData(prm, tmpData);
            }

            // Go through the records to be updated
            if (tmpData.length > 0) {
                var updated = false;
                for (var index in self._data) {
                    updated = false;
                    
                    // Go through the tmpData to know whethere to update the record
                    for (var id in tmpData) {
                        // Validate now
                        if (_Compare(self._data[index], tmpData[id], '=')) {
                            self._data[index] = AM.update(clone(self._data[index]), clone(fkv));
                            data.push(self._data[index]);   
                            delete tmpData[id];
                            updated = true;
                            break;
                        }
                    }
                    
                    // Break from the loop if only need to update the first record
                    if (updated && first) {
                        break;
                    }
                }
            }

            // Save the updated records
            self.save();

            // Return the updated data
            if (callback) {
                callback(data);
            }
            return data;
        }
    });
    registerComponent(TLocalTable, 'TLocalTable', TDataset);
    
    /**
     * ----------------------------------------------------------------
     * SQLite Reusable Functions
     */ 

    /**
      * SQLite Execute Funtion 
      * for both phone and browser
      * 
      * @param data array - Contains the query and values
      *                     [query, values] single / [[query, values]] batch
      * @param batch boolean - If it's a batch query
      * @param cb function - Callback for success
      * @param ecb function - Callback for failure
      */
    function sqliteExecute(data, batch, cb, ecb) {
        // For phone
        if (isCordova()) {
            // Single query
            if (!batch) {
                dbSQLite.executeSql(data[0], data[1], cb, function (error) {
                    ecb(error);
                });
                return;
            } 

            // Batch query
            querySQLBatch(dbSQLite, data, cb, ecb);
            return;
        }

        // For browser
        // Make sure the browser supports web sql
        if (!window.openDatabase) {
            return;
        }

        // Single query
        if (!batch) {
            dbWebSQL.transaction(function (tx) {   
                tx.executeSql(data[0], data[1], function (tx, results) {
                    cb(results);
                }, function (tx, error) {
                    ecb(error);
                }); 
            });   
            return;
        } 

        // Batch query
        dbWebSQL.transaction(function (tx) {
            querySQLBatch(tx, data, cb, ecb);
        });  
        return;
    }

    /**
     * SQLite Reusable Functions
     */ 

    /**
     * Execute batch sql query
     * 
     * @param tx Object - Transaction query object
     * @param data array - Contains the query and values
     *                     [query, values] single / [[query, values]] batch
     * @param cb function - Callback for success
     * @param ecb function - Callback for failure
     */
    function querySQLBatch(tx, data, cb, ecb) {
        var finalResults = [],
            finalErrors = [],
            counter = 0;
        (function(cbs, cberr){
            // Loop through all the query to be executed
            for (var i = 0; i < data.length; i++) {
                var sql, bind = [];

                // Check if it's array
                if ($.isArray(data[i])) {
                    sql = data[i][0];
                    bind = data[i][1];
                } else {
                    sql = data[i];
                }

                executeSql(tx, sql, bind, function(results){
                    counter++;
                    cbs(results);
                }, function(error){
                    counter++;
                    cberr(error);
                });
            }
        })(function(results){
            finalResults.push(results);
            if (counter == data.length) {
                cb(finalResults);
            }
        }, function(error){
            finalErrors.push(error);
            if (counter == data.length) {
                ecb(finalErrors);
            }
        });
    }

    /**
     * Executes sql query
     * This will check if running in browser/phone
     * 
     * @param tx Object - Transaction query object
     * @param sql string - The sql query to execute
     * @param data array - Contains the values
     * @param cb function - Callback for success
     * @param ecb function - Callback for failure
     */
    function executeSql(tx, sql, data, cb, ecb) {
        if (isCordova()) {
            tx.executeSql(sql, data, function(results){
                cb(results);
            }, function(error){
                ecb(error);
            });
        } else {
            tx.executeSql(sql, data, function(tx, results){
                cb(results);
            }, function(tx, error){
                ecb(error);
            });
        }
    }

    /**
     * Execute a query for internal sqlite database
     */
    function querySQLiteExecute(query, cb, ecb) {
        // Handles multiple query execution
        var queries = query.split((/;(?=(?:[^']*'[^']*')*[^']*$)/));

        // Check if the last query is empty
        if (!queries[queries.length - 1]) {
            queries.pop();
        }

        // Execute the sql
        sqliteExecute(queries, true, function (results) {
            // Process the query
            var result = [];

            // Check if results is not an array
            if (!$.isArray(results)) {
                results = [results];
            }

            for (var i = 0; i < results.length; i++) {
                var res = results[i];

                // Check if there are records
                if (res && res.rows && res.rows.length > 0) {
                    for (var j = 0; j < res.rows.length; j++) {
                        result.push(res.rows.item(j));
                    }
                }
            }
            cb((result.length == 1 ? result[0] : result));
        }, function (error) {
            ecb(error);
        });
    }

    /**
     * SQLite Connector Component
     */ 
    var TSQLiteConnector = TComponent.extend({
        load: function(o) {
            this.parent(o);
        },
        init: function(name) {
            this.parent(name);
        },
        query: function(query, cb, ecb) {
            querySQLiteExecute(query, cb, ecb);
        }
    });
    registerComponent(TSQLiteConnector, 'TSQLiteConnector', TComponent);

    /**
     * SQLite Table Component
     */ 
    var TSQLiteTable = TDataset.extend({
        // Main configurations
        _connector: null,
        _lastCfg: {},
        _lastCb: null,
        _lastEcb: null,
        _lastRecord: null,
        /*****
         * Used within eMOBIQ
         *****/
        addListener: function (o) {
            this._listener = this._listener || [];
            if (!AM.isIn(o, this._listener)) {
                // Clear first as it should not have multiple listeners
                this._listener = [];
                this._listener.push(o);
            }
        },
        init: function (name) {
            this.parent(name);
        },
        load: function (o) {
            this.parent(o);
            if (!this.name && o.name) {
                this.name = o.name;
            }
            var attr = o.attr || {};
            this._fields = attr.fields || [];
            this.autoLoad = attr.autoLoad || false;
            this._fields = attr.fields || {};
            this.setConnector();
            if (this.autoLoad) {
                this.loadData();
            }
        },
        /***** 
         * Used within this object
         *****/
        generateFilterQuery: function (filterAnd, filterOr) {
            // Prepare the variables to be returned 
            var sqlQuery = '';
            var sqlFilter = '';
            var sqlOrFilter = '';
            var finalValues = [];

            // Filter for 'and'
            if (filterAnd) {
                var filter = filterAnd;
                for (var index in filter) {
                    if (filter[index]) {
                        // Check if the data is accepted in the filter criteria
                        var field = filter[index]['f'] || filter[index]['field'];
                        var operator = filter[index]['o'] || filter[index]['operator'] || '=';
                        var value = filter[index]['v'] || filter[index]['value'];

                        // Check if operator are like or ilike then value is blank then skip
                        if ((operator == 'like' || operator == 'ilike') && !value) {
                            continue;
                        }

                        sqlFilter += field;
                        if (operator == 'like') {
                            sqlFilter += ' LIKE ? AND ';
                            finalValues.push('%' + value + '%');
                        } else if (operator == 'ilike') {
                            sqlFilter += ' LIKE LOWER(?) AND ';
                            finalValues.push('%' + value + '%');
                        } else if (operator == 'sqllike') {
                            // sqllike - sqlite query to allow user to input wildcard for like (case sensitive)
                            sqlFilter += ' LIKE ? AND ';
                            finalValues.push(value); 
                        } else if (operator == 'sqlilike') {
                            // sqlilike - sqlite query to allow user to input wildcard for like (case insensitive)
                            sqlFilter += ' LIKE LOWER(?) AND ';
                            finalValues.push(value);
                        } else {
                            sqlFilter += operator + '? AND ';
                            finalValues.push(value);
                        }
                    }
                }

                // Remove the extra string
                if (sqlFilter) {
                    sqlFilter = sqlFilter.substring(0, sqlFilter.length - 5);
                }
            }

            // Filter for 'or'
            if (filterOr) {
                var filter = filterOr;
                for (var index in filter) {
                    if (filter[index]) {
                        // Check if the data is accepted in the filter criteria
                        var field = filter[index]['f'] || filter[index]['field'];
                        var operator = filter[index]['o'] || filter[index]['operator'] || '=';
                        var value = filter[index]['v'] || filter[index]['value'];

                        // Check if operator are like or ilike then value is blank then skip
                        if ((operator == 'like' || operator == 'ilike') && !value) {
                            continue;
                        }

                        sqlOrFilter += field;
                        if (operator == 'like') {
                            sqlOrFilter += ' LIKE ? OR ';
                            finalValues.push('%' + value + '%');
                        } else if (operator == 'ilike') {
                            sqlOrFilter += ' LIKE LOWER(?) OR ';
                            finalValues.push('%' + value + '%');
                        } else if (operator == 'sqllike') {
                            // sqllike - sqlite query to allow user to input wildcard for like (case sensitive)
                            sqlOrFilter += ' LIKE ? OR ';
                            finalValues.push(value); 
                        } else if (operator == 'sqlilike') {
                            // sqlilike - sqlite query to allow user to input wildcard for like (case insensitive)
                            sqlOrFilter += ' LIKE LOWER(?) OR ';
                            finalValues.push(value);
                        } else {
                            sqlOrFilter += operator + '? OR ';
                            finalValues.push(value);
                        }
                    }
                }

                // Remove the extra string
                if (sqlOrFilter) {
                    sqlOrFilter = sqlOrFilter.substring(0, sqlOrFilter.length - 4);
                }
            }

            // Prepare the final statement
            if (sqlFilter || sqlOrFilter) {
                sqlQuery += ' WHERE ';
                if (sqlFilter && sqlOrFilter) {
                    sqlQuery += sqlFilter + ' AND (' + sqlOrFilter + ')';
                } else if (sqlFilter) {
                    sqlQuery += sqlFilter;
                } else if (sqlOrFilter) {
                    sqlQuery += sqlOrFilter;
                }
            }

            return { query: sqlQuery, values: finalValues };
        },
        
        /**
         * Generates a limit query that will be use for update/delete
         * 
         * @param {string} table
         * @param {string} filterQuery
         * @param {string} sqlQuery
         * @returns {string}
         */
        generateLimitQuery: function(table, filterQuery, sqlQuery) {
            var limitQuery = 'SELECT rowid FROM ' + table + ' ';

            if (filterQuery) {
                limitQuery += filterQuery + ' ';
            }

            limitQuery += 'ORDER BY rowid LIMIT 1';
            
            // append to the main sql query
            return sqlQuery + (filterQuery ? ' AND ' : ' WHERE ') + 'rowid IN (' + limitQuery + ')';
        },
        
        /***** 
         * Processes/Actions for this object
         *****/
        clear: function (cb, ecb) {
            // Prepare the variables to be used for deleting
            var sqlQuery = 'DELETE FROM ' + this.name;

            // Execute the sql
            sqliteExecute([sqlQuery, []], false, function (results) {
                if (cb) {
                    cb(results);
                }
            }, function (error) {
                if (ecb) {
                    ecb(error);
                }
            }); 
        },
        dataFromString: function (values, append, cb, ecb) {
            // Convert to object
            if (AM.isString(values)) {
                values = JSON.parse(values);
            } else if (!AM.isObject(values)) {
                ecb('Invalid values.');
                return;
            }

            // Prepare the variables to be used
            var sqlBatchQuery = [];

            // Check if table must be cleared
            if (!append) {
                sqlBatchQuery.push('DELETE FROM ' + this.name);
            }

            // Prepare the statements to insert records
            var sqlFields = '';
            var sqlValues = '';
            var finalValues = [];

            // Loop through all the values
            for (var key in values) {
                // Clear the variables first
                sqlFields = '';
                sqlValues = '';
                finalValues = [];
               
                // Loop the fields
                for (var fieldName in values[key]) {
                    sqlFields += fieldName + ',';
                    sqlValues += '?,';
                    if (typeof (values[key][fieldName]) != 'undefined') {
                        finalValues.push(values[key][fieldName]);
                    } else {
                        finalValues.push(null);
                    }
                }

                // Remove the extra commas
                sqlFields = sqlFields.substring(0, sqlFields.length - 1);
                sqlValues = sqlValues.substring(0, sqlValues.length - 1);

                // Add to the batch query
                sqlBatchQuery.push(['INSERT INTO ' + this.name + ' (' + sqlFields +') VALUES (' + sqlValues + ')', finalValues]);
            }

            // Execute the sql
            sqliteExecute(sqlBatchQuery, true, function (results) {
                cb(results);
            }, function (error) {
                ecb(error);
            });
        },
        deleteBy: function (by, value, op, first, cb, ecb) {
            // Prepare the default values
            op = op || '=';
            first = first || false;

            // Prepare the variables to be used
            var sqlQuery = 'DELETE FROM ' + this.name;
            var finalValues = [];
           
            // Generate the filter query
            var filter = [{'field': by, 'operator': op, 'value': value}];
            var filterResult = this.generateFilterQuery(filter, null);
            sqlQuery += filterResult['query'];
            finalValues = filterResult['values'];
            
            if (first) {
                // update with limit is not allowed
                // so we will use a sub query
                sqlQuery = this.generateLimitQuery(this.name, filterResult['query'], sqlQuery);
                
                if (filterResult['query']) {
                    // add the values for the sub query
                    finalValues = finalValues.concat(filterResult['values']);
                }
            }

            // Execute the sql
            sqliteExecute([sqlQuery, finalValues], false, function (results) {
                cb(results);
            }, function (error) {
                ecb(error);
            });   
        },
        deleteByMulti: function(prm, callback, errorCallback) {
            // Prepare the variables to be used
            var self = this;
            var sqlQuery = 'DELETE FROM ' + this.name;
            var finalValues = [];
            var first = prm.first || false;

            // Generate the filter query
            var filterResult = self.generateFilterQuery(prm.filter, prm.orFilter);
            sqlQuery += filterResult['query'];
            finalValues = filterResult['values'];
            
            if (first) {
                // update with limit is not allowed
                // so we will use a sub query
                sqlQuery = this.generateLimitQuery(this.name, filterResult['query'], sqlQuery);
                
                if (filterResult['query']) {
                    // add the values for the sub query
                    finalValues = finalValues.concat(filterResult['values']);
                }
            }

            // Execute the sql
            sqliteExecute([sqlQuery, finalValues], false, function (results) {
                // Process the query
                var result = [];
                for (var i = 0; i < results.rows.length; i++) {
                    result.push(results.rows.item(i));
                }

                // Check if only the first record
                callback(result);
            }, function (error) {
                errorCallback(error);
            });
        },
        filter: function(filterPrm, first, or, cb, ecb) {
            // Prepare the variables to be used
            var sqlQuery = 'SELECT * FROM ' + this.name + ' WHERE ';
            
            // Go through the values to be inserted
            var finalValues = [];

            for (var key in filterPrm) {
                sqlQuery += filterPrm[key]['by'] + ' ';
                // Check the operator
                if (filterPrm[key]['op'] == 'like' || filterPrm[key]['op'] == 'ilike') {
                    sqlQuery += 'LIKE ?';
                    finalValues.push('%' + filterPrm[key]['value'] + '%');
                } else {
                    sqlQuery += filterPrm[key]['op'] + ' ?';
                    finalValues.push(filterPrm[key]['value']);
                }
                sqlQuery += (or ? ' OR ' : ' AND ');
            }

            // Remove the extra stuff
            sqlQuery = sqlQuery.substring(0, sqlQuery.length - (or ? 4 : 5));

            // Execute the sql
            sqliteExecute([sqlQuery, finalValues], false, function (results) {
                // Process the query
                var result = [];
                for (var i = 0; i < results.rows.length; i++) {
                    result.push(results.rows.item(i));
                }

                // Check if only the first record
                if (first) {
                    if (result.length > 0) {
                        cb(result[0]);
                    }
                } else {
                    cb(result);
                }
            }, function (error) {
                ecb(error);
            });
        },
        insert: function (dt, cb, ecb) {
            // Prepare the variables to be used for inserting
            dt = dt || {};
            var sqlQuery = 'INSERT INTO ' + this.name;
            
            // Go through the values to be inserted
            var sqlFields = '';
            var sqlValues = '';
            var finalValues = [];

            for (var key in dt) {
                sqlFields += key + ',';
                sqlValues += '?,';
                if (typeof (dt[key]) != 'undefined') {
                    finalValues.push(dt[key]);
                } else {
                    finalValues.push(null);
                }
            }

            // Remove the extra commas
            sqlFields = sqlFields.substring(0, sqlFields.length - 1);
            sqlValues = sqlValues.substring(0, sqlValues.length - 1);

            // Prepare the final query
            sqlQuery += ' (' + sqlFields + ') VALUES (' + sqlValues + ')';

            // Execute the sql
            sqliteExecute([sqlQuery, finalValues], false, function (results) {
                cb(results);
            }, function (error) {
                ecb(error);
            });            
        },
        loadData: function (cb, ecb, config) {
            var prm = {};
            this.data = [];
            this._last = false;

            var next = false;
            if (config && config.parameter) {
                next = config.parameter.next || false;
                delete(config.parameter.next);
                if (config.parameter.limit) {
                    prm.limit = config.parameter.limit;
                }
                if (config.parameter.filter) {
                    prm.filter = config.parameter.filter;
                }
                if (config.parameter.orFilter) {
                    prm.orFilter = config.parameter.orFilter;
                }
                if (config.parameter.order) {
                    prm.order = config.parameter.order;
                }
                // Check if it's next
                if (next && config.parameter.limit) {
                    this._lastRecord += config.parameter.limit;
                } else if (next) {
                    this._lastRecord = 10000000;
                } else {
                    this._lastRecord = null;
                }
                // Set if it displays
                if (!config.parameter.limit) {
                    this._last = true;
                }
            }

            // Prepare the variables to be used for the statement
            var sqlQuery = 'SELECT * FROM ' + this.name;
            var sqlOrder = '';
            var sqlLimit = '';
            var finalValues = [];

            // Generate the filter query
            var filterResult = this.generateFilterQuery(prm.filter, prm.orFilter);
            sqlQuery += filterResult['query'];
            finalValues = filterResult['values'];

            // Check if needed to be sort
            if (prm.order) {
                sqlOrder += 'ORDER BY ';
                // Go through all the order by
                for (var key in prm.order) {
                    var sortField = prm.order[key].f || prm.order[key].field;
                    var sortOrder = prm.order[key].v || prm.order[key].order;

                    // Check if sort order must be casted
                    if (this._fields[sortField] && this._fields[sortField].tp == 'number') {
                        sortField = 'CAST (' + sortField + ' AS INTEGER)';
                    }

                    sqlOrder += sortField + ' ' + sortOrder + ', ';
                }
                // Remove the extra commas
                sqlOrder = sqlOrder.substring(0, sqlOrder.length - 2);
                sqlQuery += ' ' + sqlOrder;
            }

            // Check if needed to be limited
            if (prm.limit) {
                sqlLimit += 'LIMIT ' + parseInt(prm.limit);
                if (this._lastRecord) {
                    sqlLimit += ' OFFSET ' + parseInt(this._lastRecord);
                }
                sqlQuery += ' ' + sqlLimit;
            }

            // Prepare to trigger the query
            var self = this;
            self._lastCb = null;
            self._lastCfg = clone(config);

            // Execute the sql
            sqliteExecute([sqlQuery, finalValues], false, function (results) {
                // Process the query
                var result = [];
                var len = results.rows.length;

                // Push all the records
                for (var i = 0; i < len; i++) {
                    result.push(results.rows.item(i));
                }

                // Check if there is no more data
                if (len == 0) {
                    self._last = true;
                }

                self.data = result;

                if (cb) {
                    self._loading = false;
                    self._lastCb = cb;
                } else {
                    self._lastCb = null;
                }

                // Reload the dataset
                self.refreshListener(next, function(dataset){
                    // Check if have callback then trigger
                    if (dataset._lastCb){
                        dataset._lastCb(dataset.data || []);
                    }
                });
            }, function (error) {
                if (ecb) {
                    self._loading = false;
                    self._lastEcb = ecb;
                    ecb(error);
                }
            });

            return true;
        },
        loadNext: function (ebd, beforeCallback) {
            // Only trigger the before callback if there is data
            // Check if it's already loading
            if (this._loading == false && this._last == false) {
                _doAction(beforeCallback, AM.update(ebd, {}));
                this._loading = true;
                // Prepare the parameter to load the next
                var cfg = this._lastCfg || {};
                cfg.parameter = cfg.parameter || {};
                cfg.parameter.next = true;
                return this.loadData(this._lastCb, this._lastEcb, cfg);
            } else {
                this._lastCb;
            }
        },
        query: function (query, cb, ecb) {
            // Trigger from the connector
            if (this._connector && this._connector.query) {
                this._connector.query(query, cb, ecb);
                return;
            }

            // For legacy purpose as there was no sqlite connector before
            // Execute the sql 
            querySQLiteExecute(query, cb, ecb);
        },
        selectAll: function (cb, ecb) {
            // Prepare the variables to be used
            var sqlQuery = 'SELECT * FROM ' + this.name;

            // Execute the sql
            sqliteExecute([sqlQuery, []], false, function (results) {
                // Process the query
                var data = [];
                for (var i = 0; i < results.rows.length; i++) {
                    data.push(results.rows.item(i));
                }
                cb(data);
            }, function (error) {
                ecb(error);
            });
        },
        selectBy: function (by, value, first, op, cb, ecb) {
            // Set the default value
            op = op || '=';
            first = first || false;

            // Prepare the variables to be used
            var sqlQuery = 'SELECT * FROM ' + this.name;
            var finalValues = [];

            // Generate the filter query
            var filter = [{'field': by, 'operator': op, 'value': value}];
            var filterResult = this.generateFilterQuery(filter, null);
            sqlQuery += filterResult['query'];
            finalValues = filterResult['values'];

            if (first) {
                sqlQuery += ' LIMIT 1';
            }

            // Execute the sql
            sqliteExecute([sqlQuery, finalValues], false, function (results) {
                // Process the query
                var result = [];
                for (var i = 0; i < results.rows.length; i++) {
                    result.push(results.rows.item(i));
                }

                // Check if only the first record
                if (first) {
                    cb(result.length > 0 ? result[0] : false);
                } else {
                    cb(result);
                }
            }, function (error) {
                ecb(error);
            });
        },
        selectByMulti: function(prm, callback, errorCallback) {
            // Prepare the variables to be used
            var self = this;
            var sqlQuery = 'SELECT * FROM ' + this.name;
            var finalValues = [];
            var first = prm.first || false;

            // Generate the filter query
            var filterResult = self.generateFilterQuery(prm.filter, prm.orFilter);
            sqlQuery += filterResult['query'];
            finalValues = filterResult['values'];

            if (first) {
                sqlQuery += ' LIMIT 1';
            }

            // Execute the sql
            sqliteExecute([sqlQuery, finalValues], false, function (results) {
                // Process the query
                var result = [];
                for (var i = 0; i < results.rows.length; i++) {
                    result.push(results.rows.item(i));
                }

                // Check if only the first record
                if (first) {
                    callback(result.length > 0 ? result[0] : false);
                } else {
                    callback(result);
                }
            }, function (error) {
                errorCallback(error);
            });
        },    
        updateBy: function (byField, byValue, row, op, first, cb, ecb) {
            // Default value
            op = op || '=';
            first = first || false;

            // Prepare the variables to be used
            var sqlQuery = 'UPDATE ' + this.name + ' SET ';
            var finalValues = [];

            // Prepare the statement
            for (var key in row) {
                sqlQuery += key + ' = ?,';
                finalValues.push(row[key]);
            }

            // Remove the extra comma
            sqlQuery = sqlQuery.substring(0, sqlQuery.length - 1);

            // Generate the filter query
            var filter = [{'field': byField, 'operator': op, 'value': byValue}];
            var filterResult = this.generateFilterQuery(filter, null);
            sqlQuery += filterResult['query'];
            finalValues = finalValues.concat(filterResult['values']);
            
            if (first) {
                // update with limit is not allowed
                // so we will use a sub query
                sqlQuery = this.generateLimitQuery(this.name, filterResult['query'], sqlQuery);
                
                if (filterResult['query']) {
                    // add the values for the sub query
                    finalValues = finalValues.concat(filterResult['values']);
                }
            }
            
            // Execute the sql
            sqliteExecute([sqlQuery, finalValues], false, function (results) {
                cb(results);
            }, function (error) {
                ecb(error);
            });   
        },    
        updateByMulti: function(prm, callback, errorCallback) {
            // Prepare the variables to be used
            var self = this;
            var sqlQuery = 'UPDATE ' + this.name + ' SET ';
            var finalValues = [];
            var first = prm.first || false;

            // Prepare the statement
            for (var key in prm['data']) {
                sqlQuery += key + ' = ?,';
                finalValues.push(prm['data'][key]);
            }

            // Remove the extra comma
            sqlQuery = sqlQuery.substring(0, sqlQuery.length - 1);

            // Generate the filter query
            var filterResult = self.generateFilterQuery(prm.filter, prm.orFilter);
            sqlQuery += filterResult['query'];
            finalValues = finalValues.concat(filterResult['values']);
            
            if (first) {
                // update with limit is not allowed
                // so we will use a sub query
                sqlQuery = this.generateLimitQuery(this.name, filterResult['query'], sqlQuery);
                
                if (filterResult['query']) {
                    // add the values for the sub query
                    finalValues = finalValues.concat(filterResult['values']);
                }
            }
            
            // Execute the sql
            sqliteExecute([sqlQuery, finalValues], false, function (results) {
                // Process the query
                var result = [];
                for (var i = 0; i < results.rows.length; i++) {
                    result.push(results.rows.item(i));
                }

                // Check if only the first record
                callback(result);
            }, function (error) {
                errorCallback(error);
            });
        }
    });
    registerComponent(TSQLiteTable, 'TSQLiteTable', TDataset);

    function exAjax(url, a) {
        showLoader();
        var p = {
            p: {},
            m: 'get',
            cb: function(o, e) {
                console.log(o)
            }
        };
        //if(a.length){
        //  if(a.length){p.cb=a.pop();}
        //  if(a.length){p.p=a.pop();}
        //  if(a.length){p.m=a.pop();}
        //}
        a = a || {};
        p = AM.update(p, a);
        p.m = p.m.toUpperCase();
        var data = {};
        if (p.m == 'GET') {
            url += '?' + AM.encodeArguments(p.p);
        } else {
            var arg = {}
            if (p.p.a) {
                arg.a = p.p.a;
                delete(p.p.a);
            }
            url += '?' + AM.encodeArguments(arg);
            data = p.p;
        }
        var d = AM.getRequest(url, p.m); //AM.loadJSON(url,p.m);

        d.addErrback(function(e) {
            closeLoader();
            p.cb(false, 'error');
        });
        d.addCallback(function(o) {
            closeLoader();
            if (!o) {
                p.cb(false, 'no data');
            } else {
                var oo = safeEvalTxt(o);
                if (oo.e) {
                    p.cb(false, 'error');
                } else {
                    p.cb(oo.o);
                }
            }
        });
        d.sendReq(data);
        return d;
    }

    //$rp=array(
    //  'email'=>'admin@gmail.com',
    //  'password'=>'password',
    //  'api_key'=>'111',
    //  '_method'=>'post',
    //  '_url'=>'http://128.199.206.138/api/',
    //  '_path'=>'sessions'
    //);

    var TConnector = TComponent.extend({
        url: '',
        tokenName: 'session_key',
        tokenValue: '',
        apiKeyName: 'api_key',
        apiKeyValue: '',
        useAltToken: false,
        altTokenName: '',
        altTokenValue: '',
        useAuth: false,
        authPage: '',
        authForm: '',
        authParams: [],
        authConfigs: {},
        authTest: {},
        data: {},
        status: 'loading',
        autoLogin: false,
        load: function(o) {
            this.parent(o);
            var attr = o.attr;
            this.url = attr.url || '';
            this.tokenName = attr.tokenName || this.tokenName;
            this.tokenValue = attr.tokenValue || '';
            this.apiKeyName = attr.apiKeyName || this.apiKeyName;
            this.apiKeyValue = attr.apiKeyValue || '';
            this.useAltToken = attr.useAltToken || false;
            this.altTokenName = attr.altTokenName || '';
            this.authPage = attr.authPage || '';
            this.authForm = attr.authForm || '';
            this.authParams = attr.authParams || this.authParams;
            this.authConfigs = attr.authConfigs || this.authConfigs;
            this.authTest = attr.authTest || {};
            this.loginCallback = attr.loginCallback || null;
            this.loginErrorCallback = attr.loginErrorCallback || null;
            this.autoLogin = attr.autoLogin || false;
            this.data = getLocalJSONStorage('connector_' + this.name, {});
            if (this.data.token) {
                this.tokenValue = this.data.token;
                if (this.data.alttoken) {
                    this.altTokenValue = this.data.alttoken;
                }
            }
            if (attr.autoLogin) {
                this._authTest();
            }
        },
        _authTest: function() {
            //2826d4e10f0ec9a8b4629c9b6356fa31
            var self = this;
            if (this.authTest && this.authTest.params) {
                //this.tokenValue='2345';
                var prm = this.authTest.params;
                var cfg = this.authTest.config || {};
                cfg.callback = function(o, e) {
                    if (e) {
                        self.status = 'error_no_connection';
                        console.log('gak ada koneksi internet');
                    } else {
                        if (o.s) {
                            self.status = 'normal';
                            console.log('berhasil dan token benar')
                        } else if (o.err == 'server error') {
                            self.status = 'error_connector_server';
                            console.log('koneksi ke konektor bermasalah')
                        } else {
                            self.status = 'error_session_expired';
                            console.log('token dah gak berlaku');
                            if (self.authPage && self.autoLogin) {
                                setHash({
                                    p: self.authPage
                                });
                            }
                        }
                    }
                    if (self.ev && self.ev['status']) {
                        self.doAction(self.ev['status']);
                    }
                }
                this.request(prm, cfg);
            }
        },
        save: function() {
            if (this.name && this.data) {
                setLocalJSONStorage('connector_' + this.name, this.data);
            }
        },
        login: function() {
            //console.log('loginin',this.authParams);
            var cfg = this.authConfigs || {};
            var prm = {};
            var self = this;
            //console.log('prm',prm);
            //console.log('cfg',cfg);
            //console.log('authParams',this.authParams);
            AM.map(this.authParams, function(i) {
                //$f(_Scope.componentByName(self.loginForm),)
                prm[i] = _Scope.componentByName(i)._el.value;
            });
            prm[this.apiKeyName] = this.apiKeyValue;
            //prm[this.tokenName]=this.tokenValue;
            cfg['raw'] = AM.serializeJSON(prm);
            cfg['callback'] = function(o) {
                console.log('hasil', o)
                if (o && o.s) {
                    if (o.dt) {
                        console.log('hasil login :', o.dt);
                        if (o.dt[self.tokenName]) {
                            self.data.token = o.dt[self.tokenName];
                            self.tokenValue = o.dt[self.tokenName];
                            if (self.useAltToken) {
                                self.data.alttoken = o.dt[self.altTokenName];
                                self.altTokenValue = o.dt[self.altTokenName];
                            }
                            self.save();
                            console.log('data tersimpan', self.data);
                            if (self.loginCallback) {
                                if (AM.isArray(self.loginCallback)) {
                                    _doAction(self.loginCallback);
                                } else {
                                    runFunction(self.loginCallback);
                                }
                            }
                        } else {
                            if (self.loginErrorCallback) {
                                runFunction(self.loginErrorCallback);
                            }
                        }
                    } else {
                        if (self.loginErrorCallback) {
                            runFunction(self.loginErrorCallback);
                        }
                    }
                } else {
                    if (self.loginErrorCallback) {
                        runFunction(self.loginErrorCallback);
                    }
                }
            }
            cfg.prm2qs = false;
            this.request({}, cfg, true);
        },
        logout: function(cb, ecb) {
            if (!this.tokenValue) {
                var o = {
                    s: 1
                };
                if (cb) {
                    if (_isFunction(cb)) {
                        cb._embed = cb._embed || {};
                        cb._embed.input = o;
                        runFunction(cb);
                    } else {
                        cb(o);
                    }
                }
                return false;
            }
            var cfg = {
                method: 'GET',
                path: 'sessions/' + this.tokenValue
            };
            var self = this;
            cfg['callback'] = function(o, e) {
                if (o && o.s) {
                    self.data.token = '';
                    self.tokenValue = '';
                    self.data.alttoken = '';
                    self.altTokenValue = '';
                    deleteLocalJSONStorage('connector_' + self.name);
                    //self._testAuth();
                    if (cb) {
                        if (_isFunction(cb)) {
                            cb._embed = cb._embed || {};
                            cb._embed.input = o;
                            runFunction(cb);
                        } else {
                            cb(o);
                        }
                    }
                } else {
                    if (ecb) {
                        if (_isFunction(ecb)) {
                            ecb._embed = ecb._embed || {};
                            ecb._embed.input = o;
                            runFunction(ecb);
                        } else {
                            ecb(o);
                        }
                    }
                }
            }
            this.request({}, cfg, true);
            self.data.token = '';
            self.tokenValue = '';
            self.data.alttoken = '';
            self.altTokenValue = '';
            deleteLocalJSONStorage('connector_' + self.name);
            return true;
        },
        replacePath: function(s) {
            console.log('replace:', s, '|' + this.altTokenValue + '|');
            if (this.useAltToken) {
                var x = new RegExp('\{' + this.altTokenName + '\}');
                var r = s.replace(x, this.altTokenValue);
                console.log('setelah replace ', r);
                return r;
            }
            return s;
        },
        request: function(prm, cfg, noToken) {
            cfg = cfg || {};
            var a = {
                p: {}
            };
            if (cfg.method) {
                a.p['_method'] = cfg.method;
            }
            if (cfg.path) {
                a.p['_path'] = this.replacePath(cfg.path);
            }
            if (cfg.raw) {
                a.p['_raw'] = cfg.raw;
            }
            cfg._prm2qs = true;
            if (cfg.prm2qs) {
                a.p['_prm2qs'] = cfg.prm2qs;
            }
            if (cfg.blank) {
                a.p['_blank'] = cfg.blank;
            }
            a.p['_url'] = this.url;
            prm = prm || {};
            a.p = AM.update(a.p, prm);
            if (!noToken && this.tokenName && this.tokenValue) {
                a.p[this.tokenName] = this.tokenValue;
            }
            a.m = 'post';
            if (cfg.callback) {
                a.cb = cfg.callback;
            }
            exAjax(_baseConfig.appmainhost + 'crl.php', a);
            return true;
        },
        init: function(name) {
            this.parent(name);
        }
    });
    registerComponent(TConnector, 'TConnector', TComponent);

    /***************
     * Raw Connector Components + Functions
     ***************/

    var TRawConnector = TComponent.extend({
        connector: '',
        url: '',
        local: false,
        services: {},
        load: function(o) {
            this.parent(o);
            this.connector = o.attr.connector || '';
            this.url = o.attr.url || '';
            this.local = o.attr.local || false;
        },
        request: function(prm, cb, ecb) {
            // Refresh the settings
            this.connector = this.attr.connector || this.connector;
            this.url = this.attr.url || this.url;
            
            if (typeof this.attr.local === 'boolean') {
                this.local = this.attr.local;
            }
            
            // Check if it's local or not
            if (isCordova() && this.local) {
                connectorRawRest.sendRequest(Object.assign({}, prm, { url: this.url, timeout: this.attr.timeOut || 5000 }), function(resp){
                    var response = safeEval(resp);
                    if (response) {
                        if (response.s) {
                            if (cb) {
                                // include the extra
                                if (prm.extra) {
                                    response.dt.extra = prm.extra;
                                }
                                cb(response);
                            }
                        } else {
                            if (ecb) {
                                ecb(response);
                            }
                        }
                    } else {
                        ecb({
                            s: false,
                            err: resp
                        });
                    }
                });
            } else {
                // Prepare the main parameters to be passed
                var xprm = {
                    'api': 'data',
                    'a': 'call',
                    'path': prm['path']
                };
                if (prm['method']) {
                    xprm.method = prm['method'];
                }
                
                var odt;
                
                // if there's a file then use FormData
                if (prm.file) {
                    var opts = typeof (opts = (prm.options ? prm.options : {})) === 'object' ? JSON.stringify(opts) : opts;
                    
                    odt = new FormData();
                    odt.append('connector', this.connector);
                    odt.append('url', this.url);
                    odt.append('data', typeof prm.data === 'object' ? JSON.stringify(prm.data) : prm.data);
                    odt.append('options', opts);
                    odt.append('timeout', this.attr.timeOut || 5000);

                    // Go through all the files
                    for (var i in prm.file) {
                        // Check if the current file contains filename and data
                        if (prm.file[i].filename && prm.file[i].data) {
                            odt.append(i, prm.file[i].data, prm.file[i].filename);
                            continue;
                        }
                        // Normal file without filename
                        odt.append(i, prm.file[i]);
                    }

                    if (prm.header) {
                        odt.append('header', typeof prm.header === 'object' ? JSON.stringify(prm.header) : prm.header);
                    }
                } else {
                    // Compile the data paramters to be passed
                    odt = {
                        'connector': this.connector,
                        'url': this.url,
                        'data': prm['data'],
                        'options': prm['options'] ? prm['options'] : {},
                        'timeout': this.attr.timeOut || 5000
                    };
                    if (prm.header) {
                        odt.header = prm.header;
                    }
                }

                // Connect to the REST web service
                rawService(xprm, odt, function(o) {
                    if (o.s) {
                        if (cb) {
                            // Include the extra
                            if (prm['extra']) {
                                o.dt.extra = prm['extra'];
                            }
                            cb(o);
                        }
                    } else {
                        if (ecb) {
                            ecb(o.err);
                        }
                    }
                }, function(e) {
                    if (ecb) {
                        ecb(e);
                    }
                });
            }
            return true;
        },
        init: function(name) {
            this.parent(name);
        }

    });
    registerComponent(TRawConnector, 'TRawConnector', TComponent);

    var TRawDataset = TDataset.extend({
        autoLoad: true,
        autoClear: false,
        _lastCfg: {},
        _lastCb: null,
        _lastEcb: null,
        connector: '',
        prm: {},
        listKey: 'data',
        addListener: function(o) {
            this._listener = this._listener || [];
            if (!AM.isIn(o, this._listener)) {
                // Clear first as it should not have multiple listeners
                this._listener = [];
                this._listener.push(o);
            }
        },
        setParam: function(prm) {
            this.prm = prm;
        },
        loadData: function(cb, ecb, config) {
            console.log('=====> 111', config);
            var self = this;
            if (this._connector) {
                var next = false;
                var prm = {
                    api: 'data',
                    a: 'get',
                    path: this.path
                };

                var dt = {};
                if (self.limit) {
                    prm.limit = self.limit;
                }
                if (config && config.parameter) {
                    next = config.parameter.next || false;
                    delete(config.parameter.next);
                    if (config.parameter.limit) {
                        prm.limit = config.parameter.limit;
                    }
                    if (config.parameter.page) {
                        prm.page = config.parameter.page;
                    }
                    if (config.parameter.filter) {
                        prm.data = config.parameter.filter;
                    }
                    if (config.parameter.orfilter) {
                        prm.orfilter = config.parameter.orfilter;
                    }
                    prm.method = 'get';
                }
                var cba = function(o) {
                    console.log('ini yang diperoleh ', o);
                    if (o.s && o.dt) {
                        var data = self.listKey ? o.dt[self.listKey] : o.dt;
                        //var data=o.dt.data;
                        if (cb) {
                            self._lastCb = cb;
                            cb(data || []);
                        } else {
                            self._lastCb = null;
                        }
                        self.data = data;
                        self.refreshListener(next);
                    }
                }
                var ecba = function(err) {
                    if (ecb) {
                        self._lastEcb = ecb;
                        ecb(err);
                    }
                }
                self._lastCfg = clone(config);
                this._connector.request(prm, cba, ecba);
            }
            return false;
        },
        loadNext: function() {
            var cfg = this._lastCfg || {};
            cfg.parameter = cfg.parameter || {};
            cfg.parameter.page = cfg.parameter.page || 1;
            cfg.parameter.next = true;
            if (cfg.parameter.page) {
                cfg.parameter.page++;
            }
            console.log(cfg);
            return this.loadData(this._lastCb, this._lastEcb, cfg);
        },
        load: function(o) {
            //console.log('xxx')
            var attr = o.attr || {};
            this.connector = attr.connector || '';
            this.path = attr.path || '';
            this.method = attr.method || '';
            this.listKey = attr.listKey || '';
            this.limit = attr.limit || null;
            if (this.connector) {
                this._connector = _Scope.componentByName(this.connector);
            }
            //console.log('xxx2')
        },
        init: function(name) {
            this.parent(name);
        }
    });
    registerComponent(TRawDataset, 'TRawDataset', TDataset);

    function rawService(prm, dt, cb, ecb) {
        prm = prm || {};
        
        // get the connector
        var connector = dt instanceof FormData ? dt.get('connector') : dt.connector;
        
        var url = (connector && connector != "") ? connector + '?' + AM.encodeArguments(prm) : _baseConfig.rawservice + '?' + AM.encodeArguments(prm);
        console.log('request url : ', url);
        console.log('request dt : ', dt);
        
        var parameters = {
            type: 'POST',
            url: url,
            timeout: 60000
        };
        
        if (dt instanceof FormData) {
            parameters.processData = false;
            parameters.contentType = false;
        } else {
            // Convert the objects to json string
            for (var i in dt) {
                if (typeof dt[i] === 'object') {
                    dt[i] = JSON.stringify(dt[i]);
                }
            }
        }
        parameters.data = dt;

        // Run the ajax http request
        $.ajax(parameters)
            .done(function(resp) {
                if (resp.s) {
                    if (cb) {
                        cb(resp);
                    }
                } else {
                    if (ecb) {
                        ecb(resp);
                    }
                }
            })
            .fail(function(error) {
                if (ecb) {
                    ecb(error);
                }
            });
    }

    /***************
     * Nav Service
     ***************/

    function navService(prm, dt, local, timeout, cb, ecb) {
        prm = prm || {};
        var url = (dt.navconnector && dt.navconnector != "") ? dt.navconnector + '?' + AM.encodeArguments(prm) : _baseConfig.navservice + '?' + AM.encodeArguments(prm);
        console.log('Request Data: ', {'connector': dt.navconnector, 'url': dt.url, 'company': dt.company, 'user': dt._user, 'filter': dt.filter, 'data': dt.data});

        // Prepare the callback functions
        var callback = function(s) {
            var r = safeEval(s);
            if (r) {
                if (r.s) {
                    if (cb) {
                        cb.apply(d, [r])
                    }
                } else {
                    if (ecb) {
                        ecb.apply(d, [r])
                    }
                }
            } else {
                if (ecb) {
                    ecb.apply(d, [{
                        s: false,
                        err: s
                    }])
                }
            }
        }

        var errorCallback = function(s) {
            console.log('Result error nav', s);
            if (ecb) {
                ecb.apply(d, [{
                    s: false,
                    err: s
                }])
            }
        }

        // Check if it's to be triggered in mobile application
        if (isCordova() && local) {
            var data = Object.assign({}, prm, dt, {timeout:timeout});
            if (dt.type === 'soap') {
                connectorDynamics365BC.sendRequest(data, callback);
            } else {
                connectorDynamicsOData365BC.sendRequest(data, callback);
            }
            return;
        }

        // Only gonna go through if it's from the web
        var d = AM.getRequest(url);
        d.addCallback(callback);
        d.addErrback(errorCallback);
        dt = dt || {};

        // Include timeout if not included
        if (typeof dt.timeout === 'undefined') {
            dt.timeout = timeout;
        }

        for (var i in dt) {
            if (AM.isObject(dt[i])) {
                dt[i] = AM.serializeJSON(dt[i]);
            }
        }

        d.sendReq(dt);
        return d;
    }

    var TNavConnector = TComponent.extend({
        navconnector: '',
        local: '',
        url: '',
        company: '',
        user: '',
        password: '',
        services: {},
        load: function(o) {
            this.parent(o);
            var attr = o.attr;
            this.navconnector = attr.navconnector || '';
            this.local = attr.local || '';
	    this.batchRequestFormat = attr.batchRequestFormat || 'text';
            this.url = attr.url || '';
            this.user = attr.user || '';
            this.password = attr.password || '';
            this.services = attr.services || {};
            this.company = attr.company || '';
            this.type = attr.type || '';
            this.authentication = attr.authentication || '';
            this.tenantId = attr.tenantId || '';
            this.clientId = attr.clientId || '';
            this.clientSecret = attr.clientSecret || '';
        },
        request: function(prm, dt, cb, ecb) {
            this.navconnector = this.attr.navconnector || this.navconnector;
            this.local = this.attr.local || this.local;
	    this.batchRequestFormat = this.attr.batchRequestFormat || this.batchRequestFormat;
            this.url = this.attr.url || this.url;
            this.user = this.attr.user || this.user;
            this.password = this.attr.password || this.password;
            //this.services=this.attr.services||this.services;
            this.company = this.attr.company || this.company;
            this.type = this.attr.type || this.type;
            this.authentication = this.attr.authentication || this.authentication;
            this.tenantId = this.attr.tenantId || this.tenantId;
            this.clientId = this.attr.clientId || this.clientId;
            this.clientSecret = this.attr.clientSecret || this.clientSecret;
            var self = this;
            var odt = {
                navconnector: this.navconnector,
                url: this.url,
                _user: this.user,
                _password: this.password,
                company: this.company,
                type: this.type,
                authentication: this.authentication,
                tenantId: this.tenantId,
                clientId: this.clientId,
                clientSecret: this.clientSecret,
		batchRequestFormat: this.batchRequestFormat
            };
            var odt = AM.update(odt, dt);
            var d = navService(prm, odt, this.local, parseInt(self.attr.timeOut) || 5000, function(o) {
                // Clear timeout
                clearTimeout(timeout);
                console.log('result nav', o);
                if (o.s) {
                    console.log('Success', o);
                    if (cb) {
                        cb(o, prm['extra']);
                    }
                } else {
                    console.log('Fail', e);
                    if (ecb) {
                        ecb(o.err, prm['extra']);
                    }
                }
            }, function(e) {
                // Clear timeout
                clearTimeout(timeout);
                if (ecb) {
                    ecb(e, prm['extra']);
                }
            });

            // Set the request timeout
            var timeout = setTimeout(function() {
                d.abort();
                if (ecb) {
                    ecb({
                        err: 'request timeout'
                    }, prm['extra']);
                }
            }, parseInt(self.attr.timeOut) || 5000);

            return true;
        },
        init: function(name) {
            this.parent(name);
        },
    });
    registerComponent(TNavConnector, 'TNavConnector', TComponent);

    var TNavDataset = TDataset.extend({
        autoLoad: true,
        autoClear: false,
        _lastCfg: {},
        _lastCb: null,
        _lastEcb: null,
        connector: '',
        prm: {},
        serviceName: '',
        getDataFunction: '',
        insertDataFunction: '',
        updateDataFunction: '',
        listKey: '',
        addListener: function(o) {
            this._listener = this._listener || [];
            if (!AM.isIn(o, this._listener)) {
                // Clear first as it should not have multiple listeners
                this._listener = [];
                this._listener.push(o);
            }
        },
        setParam: function(prm) {
            this.prm = prm;
        },
        init: function(name) {
            this.parent(name);
        },
        load: function(o) {
            var attr = o.attr || {};
            this.connector = attr.connector || '';
            this.serviceName = attr.serviceName || '';
            this.getDataFunction = attr.getDataFunction || '';
            this.insertDataFunction = attr.insertDataFunction || '';
            this.listKey = attr.listKey || '';
            this.limit = attr.limit || null;
            this.setConnector();
        },
        loadData: function(cb, ecb, config) {
            var self = this;

            // Check if the connector is already called
            if (!this._connector) {
                this.setConnector();
            }

            if (this._connector) {
                var next = false;
                var prm = {
                    api: 'data',
                    a: 'get',
                    ent: this.serviceName
                };
                if (this._connector.services[this.serviceName] && this._connector.services[this.serviceName]['sp']) {
                    prm['subpath'] = this._connector.services[this.serviceName]['sp'];
                }
                var dt = {};
                if (self.limit) {
                    prm.limit = self.limit;
                }
                if (config && config.parameter) {
                    // Check if the data is triggered from loadnext
                    next = config.parameter.next || false;
                    delete(config.parameter.next);

                    // Pass the bookmark key if it's from loadnext
                    if (next && config.parameter.bookmark) {
                        dt.bookmark = config.parameter.bookmark;
                    }

                    if (config.parameter.fields) {
                        dt.fields = config.parameter.fields;
                    }
                    if (config.parameter.limit) {
                        prm.limit = config.parameter.limit;
                    }
                    if (config.parameter.page) {
                        prm.page = config.parameter.page;
                    }
                    if (config.parameter.expand) {
                        dt.expand = config.parameter.expand;
                    }
                    if (config.parameter.filter) {
                        dt.filter = config.parameter.filter;
                    }
                    if (config.parameter.orFilter) {
                        dt.orFilter = config.parameter.orFilter;
                    }
                    if (config.parameter.order) {
                        dt.order = config.parameter.order;
                    }
                }
                var cba = function(o) {
                    self._loading = false;
                    if (o.s && o.dt) {
                        var data = self.listKey ? o.dt[self.listKey] : o.dt;
                        // Check if there's data
                        if (AM.isArray(data) && data.length > 0) {
                            // Store the last bookmark key just in case it's needed
                            config.parameter.bookmark = data[data.length - 1]['Key'];
                            self._lastCfg = clone(config);
                            self._last = false;
                        } else {
                            self._last = true;
                        }

                        // Trigger the callback
                        if (cb) {
                            self._lastCb = cb;
                            cb(data || []);
                        } else {
                            self._lastCb = null;
                        }
                        self.data = data;
                        self.refreshListener(next);
                    }
                }
                var ecba = function(err) {
                    self._loading = false;
                    if (ecb) {
                        self._lastEcb = ecb;
                        ecb(err);
                    }
                }
                self._lastCfg = clone(config);
                this._connector.request(prm, dt, cba, ecba);
            }
            return false;
        },
        loadNext: function(ebd, beforeCallback) {
            // Only trigger the before callback if there is data
            if (this._last == false) {
                _doAction(beforeCallback, AM.update(ebd, {}));
            }

            // Check if it's already loading
            if (this._loading == false) {
                this._loading = true;
                var cfg = this._lastCfg || {};
                cfg.parameter = cfg.parameter || {};
                cfg.parameter.page = cfg.parameter.page || 1;
                cfg.parameter.next = true;
                if (cfg.parameter.page) {
                    cfg.parameter.page++;
                }
                return this.loadData(this._lastCb, this._lastEcb, cfg);
            } else {
                this._lastCb;
            }
        }
    });
    registerComponent(TNavDataset, 'TNavDataset', TDataset);


    /**
     * Generic Connector Service Call
     */ 
    function connService(type, prm, dt, cb, ecb) {
        // Make sure the prm have a value
        prm = prm || {};

        // Prepare the emobiq connector url depending on the type
        var url = '';
        switch (type) {
            case 'sapB1':
                url =  _baseConfig.urlConnectorSapB1 + '?' + AM.encodeArguments(prm);
                break;
            case 'soap':
                url =  _baseConfig.urlConnectorSOAP + '?' + AM.encodeArguments(prm);
                break;
            case 'dynamicsGP':
                url =  _baseConfig.urlConnectorDynamicsGP + '?' + AM.encodeArguments(prm);
                break;
            case 'acumatica':
                url =  _baseConfig.urlConnectorAcumatica + '?' + AM.encodeArguments(prm);
                break;
            case 'sage':
                url =  _baseConfig.urlConnectorSAGE + '?' + AM.encodeArguments(prm);
                break;
            default:
                return 'Invalid connector service.'
        }

        // Display info
        console.log('Request Data: ', {'url': dt.url, 'data': dt.data, 'user': dt._user});

        // Create a new AM object
        var d = AM.getRequest(url);

        // Prepare the callbacks
        d.addCallback(function(s) {
            var r = safeEval(s);
            if (r) {
                if (r.s) {
                    if (cb) {
                        cb.apply(d, [r])
                    }
                } else {
                    if (ecb) {
                        ecb.apply(d, [r])
                    }
                }
            } else {
                if (ecb) {
                    ecb.apply(d, [{
                        s: false,
                        err: s
                    }])
                }
            }
        });
        d.addErrback(function(s) {
            if (ecb) {
                ecb.apply(d, [{
                    s: false,
                    err: s
                }])
            }
        });
        // Prepare the parameters to be passed
        dt = dt || {};
        for (var i in dt) {
            if (AM.isObject(dt[i])) {
                dt[i] = AM.serializeJSON(dt[i]);
            }
        }
        // Send the request
        d.sendReq(dt);
        return d;
    }

    /***************
     * SAP B1 Components
     ***************/

    // SAP B1 Connector Component
    var TSapB1Connector = TComponent.extend({
        url: '',
        // Onload function
        load: function(o) {
            // Store some parameter values 
            this.parent(o);
            var attr = o.attr;
            this.url = attr.url || '';
        },
        // Request function
        request: function(prm, dt, cb, ecb) {
            // Store the current component into a variable
            var self = this;
            // Set the attributes of this class
            self.url = self.attr.url || self.url;
            // Prepare the parameters to be passed
            var odt = {
                url: self.url
            }
            odt = AM.update(odt, dt);

            // Create a sap b1 service object
            var d = connService('sapB1', prm, odt, 
                function(o) {
                    // Clear timeout
                    clearTimeout(timeout);
                    // Include the extra in the output
                    if (prm['extra']) {
                        o.dt.extra = prm['extra'];                                
                    }
                    // Check if it was successfull or not
                    if (o.s) {
                        console.log('Success', o);
                        if (cb) {
                            cb(o);
                        }
                    } else {
                        console.log('Fail', e);
                        if (ecb) {
                            ecb(o.err);
                        }
                    }
                }, function(e) {
                    // Clear timeout
                    clearTimeout(timeout);
                    if (ecb) {
                        ecb(e);
                    }
                });

            // Set the request timeout
            var timeout = setTimeout(function() {
                d.abort();
                if (ecb) {
                    ecb({
                        err: 'Request timeout.'
                    });
                }
            }, parseInt(self.attr.timeOut) || 5000);

            return true;
        }
    });
    registerComponent(TSapB1Connector, 'TSapB1Connector', TComponent);

    /***************
     * AWS Components
     ***************/

    // AWS Connector Component
    var TAWSConnector = TComponent.extend({
        region: '',
        accessKeyId: '',
        secretAccessKey: '',
        endpoint: '',
        // Onload function
        load: function(o) {
            // Store some parameter values 
            this.parent(o);
            var attr = o.attr;
            this.region = attr.region || '';
            this.accessKeyId = attr.accessKeyId || '';
            this.secretAccessKey = attr.secretAccessKey || '';
            this.endpoint = attr.endpoint || '';
        },
        // Initiate the configurations
        setConfiguration: function() {
            // Store the current component into a variable
            var self = this;
            // Set the attributes of this class
            self.region = self.attr.region || self.region;
            self.accessKeyId = self.attr.accessKeyId || self.accessKeyId;
            self.secretAccessKey = self.attr.secretAccessKey || self.secretAccessKey;
            self.endpoint = self.attr.endpoint || self.endpoint;
            // Prepare the parameters to be passed
            var params = {
                region: self.region,
                accessKeyId: self.accessKeyId,
                secretAccessKey: self.secretAccessKey,
                endpoint: self.endpoint
            }
            // Initialize
            dynamodb.init(params);
        }
    });
    registerComponent(TAWSConnector, 'TAWSConnector', TComponent);

    // DynamoDB Table
    var TAWSDynamoDBDataset = TDataset.extend({
        // Main configurations
        _connector: '',
        _lastCfg: {},
        _lastCb: null,
        _lastEcb: null,
        _data: null,
        // Additional configurations
        data: null,
        connector: '',
        table: '',
        limit: '',
        autoLoad: true,
        /*****
         * Used within eMOBIQ
         *****/  
        addListener: function(o) {
            this._listener = this._listener || [];
            if (!AM.isIn(o, this._listener)) {
                // Clear first as it should not have multiple listeners
                this._listener = [];
                this._listener.push(o);
            }
        },
        init: function(name) {
            this.parent(name);
        },
        load: function(o) {
            this.parent(o);
            var attr = o.attr || {};
            this.connector = attr.connector || '';
            this.table = attr.table || '';
            this.limit = attr.limit || null;
            this.autoLoad = attr.autoLoad || false;
            this.setConnector();
            if (this.autoLoad) {
                this.loadData(null, null, {parameter: {limit: this.limit}});
            }
        },
        /***** 
         * Used within this object
         *****/ 
        /**
         * An action to continue processing the data
         * from 'loadData' function
         */
        processLoadData: function(self, callback, errorCallback, config) {
            // Prepare the variables to be used
            var next = false; // Check if from loadnext
            var prm = {
                page: 1
            }; // Final configuration to be used
            
            // Get all the data first
            self.data = [];
            self.data.push.apply(self.data, self._data);

            // Check if configuration was passed
            if (config && config.parameter) {
                // Setup if it's a loadnext function
                next = config.parameter.next || false;
                delete(config.parameter.next);
                // Set other necessary default config
                if (config.parameter.limit) {
                    prm.limit = config.parameter.limit;
                }
                if (config.parameter.page) {
                    prm.page = config.parameter.page;
                }
                if (config.parameter.filter) {
                    prm.filter = config.parameter.filter;
                }
                if (config.parameter.orFilter) {
                    prm.orFilter = config.parameter.orFilter;
                }
                if (config.parameter.order) {
                    prm.order = config.parameter.order;
                }
            }

            // Check if there are any filters included
            if (prm.filter || prm.orFilter) {
                self.data = globalFilterData(prm, self.data);
            }

            // Check if needed to be sort
            if (prm.order) {
                self.data = globalSortData(prm, self.data);
            }

            // Pagination
            if (prm.limit) {
                var d = new Paginate(self.data, prm.limit);
                if (prm.page <= d.totalPages) {
                    self._last = false;
                    self.data = d.page(prm.page);
                } else {
                    self._last = true;
                    self.data = [];
                }
            } else {
                if (prm.page > 1) {
                    self.data = [];
                }
            }

            // Store the callbacks and config
            self._lastCb = callback || null;
            self._loading = false;
            self._lastEcb = errorCallback || null;
            self._lastCfg = clone(config);

            // Refresh the listener to load up the updated data
            self.refreshListener(next, function(){
                // Check if have callback then trigger
                if (self._lastCb){
                    self._lastCb(self.data || []);
                }
            });
        },
        /***** 
         * Processes/Actions for this object
         *****/  
        loadData: function(callback, errorCallback, config) {
            // Make sure connector exist
            if (!this.isConnectorSet()) {
                return;
            }

            // Initalize the connector setup
            this._connector.setConfiguration();

            // Check if need to load the data fresh
            var self = this;
            var next = false
            if (config && config.parameter) {
                next = config.parameter.next || false;
            }

            if (!next) {
                // Get all the records of the table in the dynamodb
                dynamodb.awsScanDynamoDBTable(self.table, {}, [], function(data) {
                    self._data = dynamodb.formatAWSResult(true, data);
                    self.processLoadData(self, callback, errorCallback, config);
                }, function(error) {
                    // Make sure it's a valid errorcallback
                    if (errorCallback) {
                        errorCallback(error);
                    }
                });
                return;
            } 

            self.processLoadData(self, callback, errorCallback, config);
        },
        loadNext: function(element, beforeCallback) {
            var self = this;

            // Only trigger the before callback if there is data
            if (self._last == false && beforeCallback) {
                _doAction(beforeCallback, AM.update(element, {}));
            }

            // Check if it's already loading
            if (self._loading == false) {
                self._loading = true;
                // Prepare the parameter to load the next
                var cfg = self._lastCfg || {};
                cfg.parameter = cfg.parameter || {};
                cfg.parameter.page = cfg.parameter.page || 1;
                cfg.parameter.next = true;
                if (cfg.parameter.page) {
                    cfg.parameter.page++;
                }
                return self.loadData(self._lastCb, self._lastEcb, cfg);
            } else {
                self._lastCb;
            }
        },
        insert: function(data, callback, errorCallback) {
            // Make sure connector exist
            if (!this.isConnectorSet()) {
                return;
            }

            // Initalize the connector setup
            this._connector.setConfiguration();

            // Insert the record to dynamo db
            var self = this;
            var dataInsert = data;

            // Get the main attributes (keys) first
            dynamodb.awsDescribeDynamoDBTable(self.table, function(data) {
                // Prepare a condition to make sure it doesn't exist first
                var conditionExpression = '';
                var expressionAttributeNames = {};
                for (var ctr in data['Table']['KeySchema']) { 
                    conditionExpression += 'attribute_not_exists(#' + ctr + ') AND ';
                    expressionAttributeNames['#' + ctr] = data['Table']['KeySchema'][ctr]['AttributeName'];
                }
                conditionExpression = conditionExpression.substring(0, 
                    conditionExpression.length - 5);

                // Insert the record
                var options = {
                    'ConditionExpression': conditionExpression,
                    'ExpressionAttributeNames': expressionAttributeNames
                };

                dynamodb.awsInsertRecordDynamoDBTable(
                    self.table, dataInsert, options, 
                    function(data) {
                        callback(data);
                    }, function(error) {
                        errorCallback(error);
                    }
                );
            }, function(error) {
                errorCallback(error);
            });
        },
        selectBy: function (byField, byValue, first, operator, callback, errorCallback) {
            // Make sure connector exist
            if (!this.isConnectorSet()) {
                return;
            }

            // Initalize the connector setup
            this._connector.setConfiguration();

            // Variables to be used in updating the record
            var self = this;
            var dataFiltered = [];

            // Set the default values
            first = first || false;
            operator = operator || '==';

            // Get all the records of the table in the dynamodb
            dynamodb.awsScanDynamoDBTable(self.table, {}, [], function(data) {
                // Store the data temporarily
                dataFiltered = dynamodb.formatAWSResult(true, data);
                
                // Filter the data 
                var prm = { filter : [{ 'f': byField, 'o': operator, 'v': byValue }]};
                dataFiltered = globalFilterData(prm, dataFiltered);
                
                // Prepare the result
                var result = [];
                if (dataFiltered.length < 1) {
                    // Doesn't exist
                    result = (first ? false : []);
                } else {
                    // Exists
                    result = (first ? dataFiltered.splice(0, 1)[0] : dataFiltered);
                }                

                callback(result);
            }, function(error) {
                errorCallback(error);
            });
        },
        updateBy: function (byField, byValue, data, operator, first, callback, errorCallback) {
            // Make sure connector exist
            if (!this.isConnectorSet()) {
                return;
            }

            // Initalize the connector setup
            this._connector.setConfiguration();

            // Variables to be used in updating the record
            var self = this;
            var dataUpdate = [];
            var dataPassed = data;
            var keys = [];

            // Set the default values
            first = first || false;
            operator = operator || '==';

            // Get all the records of the table in the dynamodb
            dynamodb.awsScanDynamoDBTable(self.table, {}, [], function(data) {
                // Store the data temporarily
                dataUpdate = dynamodb.formatAWSResult(true, data);
                
                // Filter the data 
                var prm = { filter : [{ 'f': byField, 'o': operator, 'v': byValue }]};
                dataUpdate = globalFilterData(prm, dataUpdate);
                
                // Make sure there are data that can be updated
                if (dataUpdate.length < 1) {
                    return;
                }

                // If only first then remove the rest
                dataUpdate = (first ? dataUpdate.splice(0, 1) : dataUpdate);

                // Store the primary key and sort key
                dynamodb.awsDescribeDynamoDBTable(self.table, function(data) {
                    // Go through the key schema to store and
                    // to prepare condition expression to make sure
                    // it exists first in the record
                    var conditionExpression = '';
                    var expressionAttributeNames = {};
                    for (var ctr in data['Table']['KeySchema']) { 
                        var key = data['Table']['KeySchema'][ctr]['AttributeName'];
                        keys.push(key);
                        conditionExpression += 'attribute_exists(#' + ctr + ') AND ';
                        expressionAttributeNames['#' + ctr] = key;
                    }

                    conditionExpression = conditionExpression.substring(0, 
                        conditionExpression.length - 5);

                    // Prepare the addition options to be used
                    var options = {
                        'ConditionExpression': conditionExpression,
                        'ExpressionAttributeNames': expressionAttributeNames
                    };

                    // Start processing it by updating it one by one
                    var currentCountData = 0;
                    var totalCountData = dataUpdate.length;
                    var result = [];
                    for (var ctr in dataUpdate) { 
                        // Store the primary key and sort key
                        var key = {};
                        for (var index in keys) { 
                            key[keys[index]] = dataUpdate[ctr][keys[index]];
                            delete dataUpdate[ctr][keys[index]];
                        }
                        // Replace the old values with the new values
                        Object.assign(dataUpdate[ctr], dataPassed);
                        dynamodb.awsUpdateRecordDynamoDBTable(
                            self.table, key, dataUpdate[ctr], options,
                            function(data) {
                                result[currentCountData] = data;
                                currentCountData++;
                                if (currentCountData == totalCountData) {
                                    callback((totalCountData == 1 ? result[0] : result));
                                }
                            }, function(error) {
                                result[currentCountData] = error;
                                currentCountData++;
                                if (currentCountData == totalCountData) {
                                    callback((totalCountData == 1 ? result[0] : result));
                                }
                            }
                        );
                    }
                }, function(error) {
                    errorCallback(error);
                });
            }, function(error) {
                errorCallback(error);
            });
        },
        deleteBy: function (byField, byValue, operator, first, callback, errorCallback) {
            // Make sure connector exist
            if (!this.isConnectorSet()) {
                return;
            }

            // Initalize the connector setup
            this._connector.setConfiguration();

            // Variables to be used in updating the record
            var self = this;
            var dataDelete = [];
            var keys = [];

            // Set the default values
            first = first || false;
            operator = operator || '==';

            // Get all the records of the table in the dynamodb
            dynamodb.awsScanDynamoDBTable(self.table, {}, [], function(data) {
                // Store the data temporarily
                dataDelete = dynamodb.formatAWSResult(true, data);
                
                // Filter the data 
                var prm = { filter : [{ 'f': byField, 'o': operator, 'v': byValue }]};
                dataDelete = globalFilterData(prm, dataDelete);
                
                // Make sure there are data that can be deleted
                if (dataDelete.length < 1) {
                    return;
                }

                // If only first then remove the rest
                dataDelete = (first ? dataDelete.splice(0, 1) : dataDelete);

                // Store the primary key and sort key
                dynamodb.awsDescribeDynamoDBTable(self.table, function(data) {
                    // Go through the key schema to store
                    for (var ctr in data['Table']['KeySchema']) { 
                        keys.push(data['Table']['KeySchema'][ctr]['AttributeName']);
                    }

                    // Start processing it by deleting it one by one
                    var currentCountData = 0;
                    var totalCountData = dataDelete.length;
                    var result = [];
                    for (var ctr in dataDelete) { 
                        // Store the primary key and sort key
                        var key = {};
                        for (var index in keys) { 
                            key[keys[index]] = dataDelete[ctr][keys[index]];
                        }
                        dynamodb.awsDeleteRecordDynamoDBTable(
                            self.table, key, {},
                            function(data) {
                                result[currentCountData] = data;
                                currentCountData++;
                                if (currentCountData == totalCountData) {
                                    callback((totalCountData == 1 ? result[0] : result));
                                }
                            }, function(error) {
                                result[currentCountData] = error;
                                currentCountData++;
                                if (currentCountData == totalCountData) {
                                    callback((totalCountData == 1 ? result[0] : result));
                                }
                            }
                        );
                    }
                }, function(error) {
                    errorCallback(error);
                });
            }, function(error) {
                errorCallback(error);
            });
        }
    });
    registerComponent(TAWSDynamoDBDataset, 'TAWSDynamoDBDataset', TDataset);

    /***************
     * Acumatica Components
     ***************/

    // Acumatica Connector Component
    var TAcumaticaConnector = TComponent.extend({
        type: '',
        url: '',
        basePath: '',
        company: '',
        branch: '',
        user: '',
        password: '',
        // Onload function
        load: function(o) {
            // Store some parameter values 
            this.parent(o);
            var attr = o.attr;
            this.type = attr.type || '';
            this.url = attr.url || '';
            this.basePath = attr.basePath || '';
            this.company = attr.company || '';
            this.branch = attr.branch || '';
            this.user = attr.user || '';
            this.password = attr.password || '';
        },
        // Request function
        request: function(prm, dt, cb, ecb) {
            // Store the current component into a variable
            var self = this;
            // Set the attributes of this class
            self.type = self.attr.type || self.type;
            self.url = self.attr.url || self.url;
            self.basePath = self.attr.basePath || self.basePath;
            self.company = self.attr.company || self.company;
            self.branch = self.attr.branch || self.branch;
            self.user = self.attr.user || self.user;
            self.password = self.attr.password || self.password;
            // Prepare the parameters to be passed
            var odt = {
                type: self.type,
                url: self.url,
                basePath: self.basePath,
                company: self.company,
                branch: self.branch,
                user: self.user,
                password: self.password
            }
            odt = AM.update(odt, dt);

            // Create a sap b1 service object
            var d = connService('acumatica', prm, odt, 
                function(o) {
                    // Clear timeout
                    clearTimeout(timeout);
                    // Include the extra in the output
                    o.dt = includeExtraParam(o.dt, prm['extra']);
                    // Check if it was successfull or not
                    if (o.s) {
                        console.log('Success', o);
                        if (cb) {
                            cb(o, prm['extra']);
                        }
                    } else {
                        console.log('Fail', e);
                        if (ecb) {
                            ecb(o.err);
                        }
                    }
                }, function(e) {
                    // Clear timeout
                    clearTimeout(timeout);
                    if (ecb) {
                        ecb(e.err, prm['extra']);
                    }
                });

            // Set the request timeout
            var timeout = setTimeout(function() {
                d.abort();
                if (ecb) {
                    ecb({
                        err: 'Request timeout.'
                    });
                }
            }, parseInt(self.attr.timeOut) || 5000);

            return true;
        }
    });
    registerComponent(TAcumaticaConnector, 'TAcumaticaConnector', TComponent);

    var TAcumaticaDataset = TDataset.extend({
        _connector: '',
        _cookie: '',
        _loading: '',
        connector: '',
        service: '',
        limit: '',
        autoLoad: true,
        addListener: function(o) {
            this._listener = this._listener || [];
            if (!AM.isIn(o, this._listener)) {
                // Clear first as it should not have multiple listeners
                this._listener = [];
                this._listener.push(o);
            }
        },
        setParam: function(prm) {
            this.prm = prm;
        },
        init: function(name) {
            this.parent(name);
        },
        load: function(o) {
            var attr = o.attr || {};
            this.connector = attr.connector || '';
            this.service = attr.service || '';
            this.limit = attr.limit || null;
            this.setConnector();
        },
        loadData: function(cb, ecb, config) {
            var self = this;

            // Check if the connector is already called
            if (!this._connector) {
                this.setConnector();
            }

            if (this._connector) {
                var prm = {
                    api: 'data',
                    a: 'get',
                    entity: this.service
                };
                var dt = {};
                var cba = function(o) {
                    self._loading = false;
                    if (o.s && o.dt) {
                        var data = o.dt;
                        if (cb) {
                            self._lastCb = cb;
                            cb(data || []);
                        } else {
                            self._lastCb = null;
                        }
                        self.data = data;
                        self.refreshListener();
                    }
                }
                var ecba = function(err) {
                    self._loading = false;
                    if (ecb) {
                        self._lastEcb = ecb;
                        ecb(err);
                    }
                }
                this._connector.request(prm, dt, cba, ecba);
            }
        },
        loadNext: function(ebd, beforeCallback) {
        }
    });
    registerComponent(TAcumaticaDataset, 'TAcumaticaDataset', TDataset);

    /***************
     * SAGE Components
     ***************/

    // SAGE Connector Component
    var TSAGEConnector = TComponent.extend({
        url: '',
        basePath: '',
        apiVersion: '',
        tenant: '',
        company: '',
        user: '',
        password: '',
        // Onload function
        load: function(o) {
            // Store some parameter values 
            this.parent(o);
            var attr = o.attr;
            this.url = attr.url || '';
            this.basePath = attr.basePath || '';
            this.apiVersion = attr.apiVersion || '';
            this.tenant = attr.tenant || '';
            this.company = attr.company || '';
            this.user = attr.user || '';
            this.password = attr.password || '';
        },
        // Request function
        request: function(prm, dt, cb, ecb) {
            // Store the current component into a variable
            var self = this;
            // Set the attributes of this class
            self.url = self.attr.url || self.url;
            self.basePath = self.attr.basePath || self.basePath;
            self.apiVersion = self.attr.apiVersion || self.apiVersion;
            self.tenant = self.attr.tenant || self.tenant;
            self.company = self.attr.company || self.company;
            self.user = self.attr.user || self.user;
            self.password = self.attr.password || self.password;
            // Prepare the parameters to be passed
            var odt = {
                url: self.url,
                basePath: self.basePath,
                apiVersion: self.apiVersion,
                tenant: self.tenant,
                company: self.company,
                user: self.user,
                password: self.password
            }
            odt = AM.update(odt, dt);

            // Create a sap b1 service object
            var d = connService('sage', prm, odt, 
                function(o) {
                    // Clear timeout
                    clearTimeout(timeout);
                    // Include the extra in the output
                    if (prm['extra']) {
                        // Check if there is data returned
                        if (o.dt) {
                            o.dt.extra = prm['extra'];
                        } else {
                            o.dt = {};
                            o.dt.extra = prm['extra'];
                        }                            
                    }
                    // Check if it was successfull or not
                    if (o.s) {
                        console.log('Success', o);
                        if (cb) {
                            cb(o);
                        }
                    } else {
                        console.log('Fail', e);
                        if (ecb) {
                            ecb(o.err);
                        }
                    }
                }, function(e) {
                    // Clear timeout
                    clearTimeout(timeout);
                    if (ecb) {
                        ecb(e.err);
                    }
                });

            // Set the request timeout
            var timeout = setTimeout(function() {
                d.abort();
                if (ecb) {
                    ecb({
                        err: 'Request timeout.'
                    });
                }
            }, parseInt(self.attr.timeOut) || 5000);

            return true;
        }
    });
    registerComponent(TSAGEConnector, 'TSAGEConnector', TComponent);

    var TSAGEDataset = TDataset.extend({
        _connector: '',
        _loading: '',
        connector: '',
        service: '',
        limit: '',
        autoLoad: true,
        addListener: function(o) {
            this._listener = this._listener || [];
            if (!AM.isIn(o, this._listener)) {
                // Clear first as it should not have multiple listeners
                this._listener = [];
                this._listener.push(o);
            }
        },
        setParam: function(prm) {
            this.prm = prm;
        },
        init: function(name) {
            this.parent(name);
        },
        load: function(o) {
            var attr = o.attr || {};
            this.connector = attr.connector || '';
            this.service = attr.service || '';
            this.limit = attr.limit || null;
            this.setConnector();
        },
        loadData: function(cb, ecb, config) {
            var self = this;

            // Check if the connector is already called
            if (!this._connector) {
                this.setConnector();
            }

            if (this._connector) {
                var prm = {
                    api: 'data',
                    a: 'get',
                    entity: this.service
                };
                var dt = {};

                // Add some parameters
                if (self.limit) {
                    prm.limit = self.limit;
                }
                if (config && config.parameter) {
                    if (config.parameter.limit) {
                        prm.limit = config.parameter.limit;
                    }
                    if (config.parameter.filter) {
                        dt.filter = config.parameter.filter;
                    }
                    if (config.parameter.orFilter) {
                        dt.orFilter = config.parameter.orFilter;
                    }
                    if (config.parameter.order) {
                        dt.order = config.parameter.order;
                    }
                }

                var cba = function(o) {
                    self._loading = false;
                    if (o.s && o.dt) {
                        var data = o.dt;
                        if (cb) {
                            self._lastCb = cb;
                            cb(data || []);
                        } else {
                            self._lastCb = null;
                        }
                        self.data = data;
                        self.refreshListener();
                    }
                }
                var ecba = function(err) {
                    self._loading = false;
                    if (ecb) {
                        self._lastEcb = ecb;
                        ecb(err);
                    }
                }
                this._connector.request(prm, dt, cba, ecba);
            }
        },
        loadNext: function(ebd, beforeCallback) {
        }
    });
    registerComponent(TSAGEDataset, 'TSAGEDataset', TDataset);

    /***************
     * SOAP Components
     ***************/

    // SOAP Connector Component
    var TSOAPConnector = TComponent.extend({
        url: '',
        // Onload function
        load: function(o) {
            // Store some parameter values
            this.parent(o);
            var attr = o.attr;
            this.url = attr.url || '';
        },
        // Request function
        request: function(prm, dt, cb, ecb) {
            // Store the current component into a variable
            var self = this;
            // Set the attributes of this class
            self.url = self.attr.url || self.url;
            // Prepare the parameters to be passed
            var odt = {
                url: self.url
            }
            odt = AM.update(odt, dt);
            // Create a soap service object
            var d = connService('soap', prm, odt, 
                function(o) {
                    // Clear timeout
                    clearTimeout(timeout);
                    if (o.s) {
                        console.log('Success', o);
                        if (cb) {
                            cb(o);
                        }
                    } else {
                        console.log('Fail', e);
                        if (ecb) {
                            ecb(o.err);
                        }
                    }
                }, function(e) {
                    // Clear timeout
                    clearTimeout(timeout);
                    console.log('Fail', e);
                    if (ecb) {
                        ecb(e);
                    }
                });

            // Set the request timeout
            var timeout = setTimeout(function() {
                d.abort();
                if (ecb) {
                    ecb({
                        err: 'Request timeout.'
                    });
                }
            }, parseInt(self.attr.timeOut) || 5000);

            return true;
        }
    });
    registerComponent(TSOAPConnector, 'TSOAPConnector', TComponent);

    /***************
     * Dynamics GP Components
     ***************/

    // Dynamics GP Connector Component
    var TDynamicsGPConnector = TComponent.extend({
        url: '',
        user: '',
        password: '',
        // Onload function
        load: function(o) {
            // Store some parameter values
            this.parent(o);
            var attr = o.attr;
            this.url = attr.url || '';
            this.user = attr.user || '';
            this.password = attr.password || '';
        },
        // Request function
        request: function(prm, dt, cb, ecb) {
             // Store the current component into a variable
            var self = this;
            // Set the attributes of this class
            self.url = self.attr.url || self.url;
            self.user = self.attr.user || self.user;
            self.password = self.attr.password || self.password;
            // Prepare the parameters to be passed
            var odt = {
                url: self.url,
                _user: self.user,
                _password: self.password
            }
            odt = AM.update(odt, dt);
            // Create a dynamics gp service object
            var d = connService('dynamicsGP', prm, odt, 
                function(o) {
                    // Clear timeout
                    clearTimeout(timeout);
                    if (o.s) {
                        console.log('Success', o);
                        if (cb) {
                            cb(o);
                        }
                    } else {
                        console.log('Fail', e);
                        if (ecb) {
                            ecb(o.err);
                        }
                    }
                }, function(e) {
                    // Clear timeout
                    clearTimeout(timeout);
                    console.log('Fail', e);
                    if (ecb) {
                        ecb(e);
                    }
                });

            // Set the request timeout
            var timeout = setTimeout(function() {
                d.abort();
                if (ecb) {
                    ecb({
                        err: 'Request timeout.'
                    });
                }
            }, parseInt(self.attr.timeOut) || 5000);

            return true;
        }
    });
    registerComponent(TDynamicsGPConnector, 'TDynamicsGPConnector', TComponent);
    /***************
     * CRM 365 Components
     ***************/
    function crm365Service(prm, dt, cb, ecb) {
        console.log()
        prm = prm || {};
        dt=dt||{};
        
        var url = dt.url? dt.url +'?' + AM.encodeArguments(prm): _baseConfig.crm365service; + '?' + AM.encodeArguments(prm);
        console.log('Request Data: ', {'url': dt.url, 'resourceUrl': dt.resourceUrl, 'authorityid': dt.authorityid, 'clientId': dt.clientId, 'user': dt._user, 'data': dt.data});
        dt.resource=dt.resourceUrl;
        dt.webapi=dt.apiUrl;
        dt.clientid=dt.clientId;
        dt.username=dt.user;
        console.log(typeof dt.extra);
        if (dt.extra){
            if (typeof dt.extra =='object'){
                dt.data=JSON.stringify(dt.extra);
            }else{
                dt.data=dt.extra;
            }
        };
        new PushAjax({
            url:url,
            method: 'POST',
            data:dt,
            header: function (req) {
                req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            },
            success: function (res, req) {
                var result = JSON.parse(res);
                cb(result);
            },
            error: function (res, req) {
                ecb(res);
            }
        });


        
    }

    var TCrm365Connector = TComponent.extend({
        url:'',
        resourceUrl:'',
        authorityid:'',
        clientId:'',
        user:'',
        password:'',
        apiUrl:'',
        services: {},
        _t: null,
        load: function(o) {
            this.parent(o);
            var attr = o.attr;
            this.url = attr.url || '';
            this.resourceUrl = attr.resourceUrl || '';
            this.authorityid = attr.authorityid || '';
            this.clientId = attr.clientId || '';
            this.user = attr.user || '';
            this.password = attr.password || '';
            this.apiUrl = attr.apiUrl || '';
            this.services = attr.services || {};
        },
        request: function(prm, dt, cb, ecb) {
            
            this.url = this.attr.url || this.url;
            this.resourceUrl = this.attr.resourceUrl ||  this.resourceUrl;
            this.authorityid = this.attr.authorityid || this.authorityid;
            this.clientId = this.attr.clientId || this.clientId;
            this.user = this.attr.user || this.user;
            this.password = this.attr.password || this.password;
            this.apiUrl = this.attr.apiUrl || this.apiUrl;
            this.services = this.attr.services || this.services;
            
            var self = this;
            var odt=dt;
            console.log(prm);
            console.log(odt);
            var d = crm365Service(prm, odt, function(o) {
                
                clearTimeout(self._t);
                if (o.s) {
                    console.log('success', o);
                    if (cb) {
                        cb(o);
                    }
                } else {
                    console.log('failed', e);
                    if (ecb) {
                        ecb(o.err);
                    }
                }
            }, function(e) {
                clearTimeout(self._t);
                console.log('failed to checking', e);
                if (ecb) {
                    ecb(e);
                }
            });

            self._t = setTimeout(function() {
                d.abort();
                if (ecb) {
                    ecb({
                        err: 'request timeout'
                    });
                }
            }, parseInt(self.attr.timeOut) || 5000);

            return true;
        },
        init: function(name) {
            this.parent(name);
        }
    });
    registerComponent(TCrm365Connector, 'TCrm365Connector', TComponent);


    var TCrm365Dataset = TDataset.extend({
        autoLoad: true,
        autoClear: false,
        _lastCfg: {},
        _lastCb: null,
        _lastEcb: null,
        connector: '',
        prm: {},
        serviceName: '',
        getDataFunction: '',
        insertDataFunction: '',
        updateDataFunction: '',
        listKey: '',
        addListener: function(o) {
            this._listener = this._listener || [];
            if (!AM.isIn(o, this._listener)) {
                // Clear first as it should not have multiple listeners
                this._listener = [];
                this._listener.push(o);
            }
        },
        setParam: function(prm) {
            this.prm = prm;
        },
        init: function(name) {
            this.parent(name);
        },
        load: function(o) {  
            var attr = o.attr || {};
            this.connector = attr.connector || '';
            this.serviceName = attr.serviceName || '';
            this.listKey = attr.listKey || '';
            this.limit = attr.limit || null;
            this.setConnector();
        },
        loadData: function(cb, ecb, config) {
            var prm={
                a:'retrieveAll'
            };
            var self = this;

            // Check if the connector is already called
            if (!this._connector) {
                this.setConnector();
            }

            if (this._connector) {
                var next = false;
                var dt = this._connector.attr;
                if (self.limit) {
                    prm.limit = self.limit;
                }
                if (config && config.parameter) {
                    next = config.parameter.next || false;
                    delete(config.parameter.next);
                    if (config.parameter.limit) {
                        prm.limit = config.parameter.limit;
                    }
                    if (config.parameter.page) {
                        prm.page = config.parameter.page;
                    }
                    if (config.parameter.extra) {
                        dt.extra = config.parameter.extra;
                    }else{
                        dt.extra={
                         collection:this.serviceName,
                         select:['*']
                        };
                        
                    }
                    if (config.parameter.extra && !config.parameter.extra.collection){
                        dt.extra.collection=this.serviceName;
                    }
                     if (config.parameter.extra && !config.parameter.extra.select){
                        dt.extra.select=['*'];
                    }

                    
                }
                var cba = function(o) {
                     
                     self._loading = false;
                    if (o.s && o.dt) {
                        
                        var data = self.listKey ? o.dt[self.listKey] : o.dt;
                        
                        //var data=o.dt.data;
                        if (cb) {
                            self._lastCb = cb;
                            cb(data || []);
                        } else {
                            self._lastCb = null;
                        }
                        self.data = data;
                        self.refreshListener(next);
                    }
                }
                var ecba = function(err) {
                    if (ecb) {
                        self._lastEcb = ecb;
                        ecb(err);
                    }
                }
                self._lastCfg = clone(config);
                this._connector.request(prm, dt, cba, ecba);
            }
            return false;
        },
        loadNext: function() {
            var cfg = this._lastCfg || {};
            cfg.parameter = cfg.parameter || {};
            cfg.parameter.page = cfg.parameter.page || 1;
            cfg.parameter.next = true;
            if (cfg.parameter.page) {
                cfg.parameter.page++;
            }
            return this.loadData(this._lastCb, this._lastEcb, cfg);
        }
    });
    registerComponent(TCrm365Dataset, 'TCrm365Dataset', TDataset);



    
    /***************
     * AX Components
     ***************/

    /**
     * Service Call for AX
     */ 
    function axService(prm, dt, cb, ecb) {
        prm = prm || {};
        var url = _baseConfig.axservice + '?' + AM.encodeArguments(prm);
        console.log('Request Data: ', {'url': dt.url, 'user': dt._user, 'data': dt.data});
        var d = AM.getRequest(url);
        d.addCallback(function(s) {
            var r = safeEval(s);
            if (r) {
                if (r.s) {
                    if (cb) {
                        cb.apply(d, [r])
                    }
                } else {
                    if (ecb) {
                        ecb.apply(d, [r])
                    }
                }
            } else {
                if (ecb) {
                    ecb.apply(d, [{
                        s: false,
                        err: s
                    }])
                }
            }
        });
        d.addErrback(function(s) {
            if (ecb) {
                ecb.apply(d, [{
                    s: false,
                    err: s
                }])
            }
        });
        dt = dt || {};
        for (var i in dt) {
            if (AM.isObject(dt[i])) {
                dt[i] = AM.serializeJSON(dt[i]);
                dt[i] = dt[i].replace(/\\/g, "")
            }
        }
        d.sendReq(dt);
        return d;
    }

    /**
     *  MC Payment Connector - Services Component
     */
    var TMCPaymentConnector = TComponent.extend({
        url: {
            'sandbox' : 'https://gw2.sandbox.mcpayment.net:8443/api/v5', 
            'production' : 'https://gw2.sandbox.mcpayment.net:8443/api/v5'
        },
        version: '5',
        appType: '',
        appVersion: '',
        uuid: '',
        environment: '',
        user: '',
        password: '',
        signature: '',
        // Load function
        load: function(component) {
            // Store the attribute details in the object itself
            var attr = component.attr;
            this.environment = attr.environment || 'sandbox';
            this.user = attr.user || '';
            this.password = attr.password || '';

            // Static values
            this.appType = (isCordova() ? (device.platform == 'Android' ? 'A' : 'I') : 'W');
            this.uuid = (isCordova() ? device.uuid : '');
        },
        // Refresh the local variable of the component
        refreshStoredData: function() {
            this.environment = this.attr.environment || this.environment;
            this.user = this.attr.user || this.user;
            this.password = this.attr.password || this.password;   
            
            // Make sure there is version
            this.appVersion = _baseConfig.appname.replace(/'|\s|'/g, '') + '.' + _appVersion;
        },
        // Generate the header of the body/data
        generateDataHeaders: function() {
            return {
                'version' : this.version,
                'appType': this.appType,
                'appVersion' : this.appVersion,
                'uuid' :this.uuid
            };
        },
        // Generate the header for sending a request
        generateRequestHeaders: function() {
            return {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            };
        },
        // Send the request - Make it reusable and centralized
        sendRequest: function(path, data, cb, ecb) {
            // For cordova app
            var parameters = {
                type: 'POST',
                url: this.url[this.environment] + '/' + path,
                headers: this.generateRequestHeaders(),
                data: data,
                timeout: 60000
            };

            // If it is a browser
            if (!isCordova()) {
                parameters = {
                    type: 'POST',
                    url: _baseConfig.urlConnectorREST + '?controller=Request&action=send',
                    data: {
                        'url': this.url[this.environment] + '/' + path,
                        'method': 'POST',
                        'header': JSON.stringify(this.generateRequestHeaders()),
                        'data': data
                    },
                    timeout: 60000
                };    
            }

            // Run the ajax http request
            $.ajax(parameters)
                .done(function(data) {
                    // Check if failed data from browser
                    if (cb && !isCordova() && data.success == 0) {
                        ecb(data.data);
                        return;
                    }
                    // Check the response if valid
                    data = (isCordova() ? data : data.data);
                    if (data.header.status.responseCode == '0000') {
                        cb(data);
                    } else {
                        ecb(data.header.status.message);
                    }
                })
                .fail(function(error) {
                    if (ecb) {
                        ecb(error);
                    }
                });
        },
        // Authenticate - Get the signature
        authenticate: function(prm, cb, ecb) {
            // Get the latest default values
            this.refreshStoredData();

            // Prepare the parameters
            var data = {
                'header' : this.generateDataHeaders(),
                'data': {
                    'userId': this.user,
                    'password': this.password,
                    'timeStamp': emobiqApp.formatDate('YmdHis', new Date())
                }
            };
            data = JSON.stringify(data);

            // Send the request
            var self = this;
            this.sendRequest('auth/terminal', data, function(result) {
                self.signature = result.data.signKey;
                cb(result);
            }, ecb);
        },
        // Sales Transaction
        transactSales: function(prm, cb, ecb) {
            // Get the latest default values
            this.refreshStoredData();

            // Prepare the parameters
            var headers = this.generateDataHeaders();
            headers['mcpTerminalId'] = prm['mcpTerminalId'];

            var data = {
                'header' : headers,
                'data': {
                    'currency': prm['currency'],
                    'cardno': prm['cardNo'],
                    'cardExpiryDate': prm['cardExpiryDate'],
                    'totalAmount': prm['totalAmount'],
                    'salesAmount': prm['totalAmount'],
                    'cardHolderName': prm['cardHolderName'],
                    'cvv': prm['cvv']
                }
            };
            data = JSON.stringify(data);

            // Send the request
            var self = this;
            this.sendRequest('sale', data, function(result) {
                cb(result);
            }, ecb);
        },
        // Void Transaction
        transactVoid: function(prm, cb, ecb) {
             // Get the latest default values
             this.refreshStoredData();

             // Prepare the parameters
             var headers = this.generateDataHeaders();
             headers['mcpTerminalId'] = prm['mcpTerminalId'];
 
             var data = {
                 'header' : headers,
                 'data': {
                     'currency': prm['currency'],
                     'originalTransactionId': prm['originalTransactionId'],
                     'totalAmount': prm['totalAmount'],
                     'salesAmount': prm['totalAmount']
                 }
             };
             data = JSON.stringify(data);
 
             // Send the request
             var self = this;
             this.sendRequest('void', data, function(result) {
                 cb(result);
             }, ecb);
        },
        // Refund Transaction
        transactRefund: function(prm, cb, ecb) {
            // Get the latest default values
            this.refreshStoredData();

            // Prepare the parameters
            var headers = this.generateDataHeaders();
            headers['mcpTerminalId'] = prm['mcpTerminalId'];

            var data = {
                'header' : headers,
                'data': {
                    'currency': prm['currency'],
                    'originalTransactionId': prm['originalTransactionId'],
                    'totalAmount': prm['totalAmount']
                }
            };
            data = JSON.stringify(data);

            // Send the request
            var self = this;
            this.sendRequest('refund', data, function(result) {
                cb(result);
            }, ecb);
        },
        // Get Transactions
        getTransactions: function(prm, cb, ecb) {
            // Get the latest default values
            this.refreshStoredData();

            // Prepare the parameters
            var headers = this.generateDataHeaders();
            headers['mcpTerminalId'] = prm['mcpTerminalId'];

            // Default dates
            var startDate = new Date();
            startDate.setHours(0, 0, 0, 0);
            startDate = prm['startDate'] || startDate;
            var endDate = new Date();
            endDate.setHours(23, 59, 59, 999);
            endDate = prm['endDate'] || endDate;

            var data = {
                'header' : headers,
                'data': {
                    'startDate': emobiqApp.formatDate('YmdHis', startDate),
                    'endDate': emobiqApp.formatDate('YmdHis', endDate),
                    'currentPage': prm['currentPage'] || "1",
                    'filter': prm['filter']
                }
            };
            data = JSON.stringify(data);

            // Send the request
            var self = this;
            this.sendRequest('query/list', data, function(result) {
                cb(result);
            }, ecb);
        },
        // Get transaction details
        getTransactionDetails: function(prm, cb, ecb) {
            // Get the latest default values
            this.refreshStoredData();

            // Prepare the parameters
            var headers = this.generateDataHeaders();
            headers['mcpTerminalId'] = prm['mcpTerminalId'];

            var data = {
                'header' : headers,
                'data': {
                    'transactionId': prm['transactionId'],
                    'referenceText': prm['referenceText'],
                    'currency': prm['currency'],
                    'totalAmount': prm['totalAmount'],
                    'filter': prm['filter']
                }
            };
            data = JSON.stringify(data);

            // Send the request
            var self = this;
            this.sendRequest('query/detail', data, function(result) {
                cb(result);
            }, ecb);
        },
        // Quick Pay
        eWalletQuickPay: function(prm, cb, ecb) {
            // Get the latest default values
            this.refreshStoredData();

            // Prepare the parameters
            var headers = this.generateDataHeaders();
            headers['mcpTerminalId'] = prm['mcpTerminalId'];

            var data = {
                'header' : headers,
                'data': {
                    'description': prm['description'],
                    'totalAmount': prm['totalAmount'],
                    'currency': prm['currency'],
                    'authCode': prm['authCode'],
                    'eType': prm['eType'],
                    'itemDetails': prm['itemDetails'],
                    'referenceNo': prm['referenceNo']
                }
            };
            data = JSON.stringify(data);

            // Send the request
            var self = this;
            this.sendRequest('ewallet/quickPay', data, function(result) {
                cb(result);
            }, ecb);
        },
        // Unified Order
        eWalletUnifiedOrder: function(prm, cb, ecb) {
            // Get the latest default values
            this.refreshStoredData();

            // Prepare the parameters
            var headers = this.generateDataHeaders();
            headers['mcpTerminalId'] = prm['mcpTerminalId'];

            var data = {
                'header' : headers,
                'data': {
                    'currency': prm['currency'],
                    'totalAmount': prm['totalAmount'],
                    'eType': prm['eType'],
                    'description': prm['description'],
                    'amountSettled': prm['amountSettled'],
                    'clientUrl': prm['clientUrl'],
                    'itemDetails': prm['itemDetails'],
                    'referenceNo': prm['referenceNo']
                }
            };
            data = JSON.stringify(data);

            // Send the request
            var self = this;
            this.sendRequest('ewallet/unifiedOrder', data, function(result) {
                cb(result);
            }, ecb);
        },
    });
    registerComponent(TMCPaymentConnector, 'TMCPaymentConnector', TComponent);

    /**
     *  eNETS Payment Connector - Services Component
     */
    var TENETSPaymentConnector = TComponent.extend({
        environment: '',
        // Load function
        load: function(component) {
            // Store the attribute details in the object itself
            var attr = component.attr;
            this.environment = attr.environment || 'uat';
        },
        // Refresh the local variable of the component - If the user changed the properties
        refreshStoredData: function() {
            this.environment = this.attr.environment || this.environment;
        },
        // Payment Request
        paymentRequest: function(prm, cb, ecb) {
            // Make sure it is triggered from mobile
            if (!isCordova()) {
                ecb('This function is only enabled in mobile application.');
            }

            // Get the latest default values
            this.refreshStoredData();

            // Send the payment request
            enets.sendPaymentRequest(
                cb, 
                ecb,
                {
                    "umid": prm['umid'],
                    "apiKey": prm['apiKey'],
                    "secretKey": prm['secretKey'],
                    "amountInCents": prm['amountInCents'],
                    "reference": prm['reference'],
                    "paymentType": prm['paymentType'],
                    "paymentMode": prm['paymentMode'],
                    "currencyCode": prm['currencyCode'],
                    "timeZone": prm['timeZone'],
                    "b2sTxnEndURL": prm['b2sTxnEndURL'],
                    "s2sTxnEndURL": prm['s2sTxnEndURL']
                }
            );
       }
    });
    registerComponent(TENETSPaymentConnector, 'TENETSPaymentConnector', TComponent);

    /**
     *  2C2P Payment Connector - Services Component
     */
    var T2C2PPaymentConnector = TComponent.extend({
        environment: '',
        // Load function
        load: function(component) {
            // Store the attribute details in the object itself
            var attr = component.attr;
            this.environment = attr.environment || 'sandbox';
        },
        // Refresh the local variable of the component - If the user changed the properties
        refreshStoredData: function() {
            this.environment = this.attr.environment || this.environment;
        },
        // Payment Request
        paymentRequest: function(prm, cb, ecb) {
            // Make sure it is triggered from mobile
            if (!isCordova()) {
                ecb('This function is only enabled in mobile application.');
            }

            // Get the latest default values
            this.refreshStoredData();

            // Send the payment request
            ccpp.sendPaymentRequest(
                cb, 
                ecb,
                {
                    "environment": this.environment,
                    "merchantID": prm['merchantID'],
                    "paymentToken": prm['paymentToken'],
                    "paymentType": prm['umpaymentTypeid'],
                    "agentCode": prm['agentCode'],
                    "agentChannelCode": prm['agentChannelCode'],
                    "creditCardNo": prm['creditCardNo'],
                    "creditCardExpiryMonth": prm['creditCardExpiryMonth'],
                    "creditCardExpiryYear": prm['creditCardExpiryYear'],
                    "creditCardSecurityCode": prm['creditCardSecurityCode']
                }
            );
       }
    });
    registerComponent(T2C2PPaymentConnector, 'T2C2PPaymentConnector', TComponent);

    /**
     *  Firebase Connector - Services Component
     */
    var TFirebaseConnector = TComponent.extend({
        apiKey: '',
        authDomain: '',
        databaseURL: '',
        projectId: '',
        storageBucket: '',
        messagingSenderId: '',
        // Load function
        load: function(component) {
            // Store the attribute details in the object itself
            var attr = component.attr;
            this.apiKey = attr.apiKey || '';
            this.authDomain = attr.authDomain || '';
            this.databaseURL = attr.databaseURL || '';
            this.projectId = attr.projectId || '';
            this.storageBucket = attr.storageBucket || '';
            this.messagingSenderId = attr.messagingSenderId || '';

            // Prepare the configuration for the firebase settings
            var config = {
                apiKey: this.apiKey,
                authDomain: this.authDomain,
                databaseURL: this.databaseURL,
                projectId: this.projectId,
                storageBucket: this.storageBucket,
                messagingSenderId: this.messagingSenderId
            };

            // Initialize the firebase object
            firebase.initializeApp(config);  
        }
    });
    registerComponent(TFirebaseConnector, 'TFirebaseConnector', TComponent);

    /***************
     * Paypal Components
     ***************/

    // Paypal Connector Component
    var TPayPalConnector = TComponent.extend({
        environment: '',
        connector: '',
        accessToken: '',
        timeOut: 30000,
        load: function(data) {
            var attr = data.attr;
            
            // Store some parameter values
            this.environment = attr.environment || 'sandbox';
            this.connector = attr.connector || '';
            this.accessToken = attr.accessToken || '';
            this.timeOut = attr.timeOut || this.timeOut;
        },
        getUrl: function(controller, action) {
            return (this.connector ? this.connector : _baseConfig.urlConnectorPayPal) + '?controller=' + controller + '&action=' + action;
        },
        getClientToken: function(complete, error) {
            this.accessToken = this.attr.accessToken || this.accessToken;

            var self = this;
            
            // Check if there's access token
            if (!this.accessToken) {
                if (error) {
                    error("No access token");
                }
                return;
            }
            
            // Request the client token from paypal using access token
            $.ajax(this.getUrl('ClientToken', 'generateToken'), {
                type: 'POST',
                data: { accessToken: this.accessToken},
                timeout: this.timeOut
            }).done(function(resp, status){
                if (resp.success) {
                    complete({token: resp.data, env: self.environment});
                } else {
                    if (error) {
                        error(resp.message);
                    }
                }
            }).fail(function(xhr, status, errorThrown){
                if (error) {
                    error(errorThrown);
                }
            });
        },
        authorize: function(param, callback, errorCallback) {
            this.accessToken = this.attr.accessToken || this.accessToken;

            if (!this.accessToken) {
                return;
            }
            
            var data = {
                accessToken: this.accessToken,
                payment_method_nonce: param.nonce,
                currency: param.currency,
                amount: param.data.amount,
                first_name: param.data.first_name,
                last_name: param.data.last_name,
                company: param.data.company,
                address_line1: param.data.address_line1,
                address_line2: param.data.address_line2,
                city: param.data.city,
                region: param.data.region,
                postal_code: param.data.postal_code,
                country_code: param.data.country_code
            };
            
            $.ajax(this.getUrl('Transaction', 'create'), {
                type: 'POST',
                data: data,
                timeout: this.timeOut
            }).done(function(resp){
                if (resp.success) {
                    callback(resp.data);
                } else {
                    if (errorCallback) {
                        errorCallback(resp.message);
                    }
                }
            }).fail(function(xhr, status, errorThrown){
                if (errorCallback) {
                    errorCallback(errorThrown);
                }
            });
        }
    });
    registerComponent(TPayPalConnector, 'TPayPalConnector', TComponent);

    var TPayPalButton = TContainer.extend({
        load: function(o, parentElement) {
            this.parent(o);
            // If have connector information then render
            if (this.attr.connector) {
                this.render();
            }
        },
        init: function(name, parentElement) {
            this.parent(name, parentElement);
        },
        render: function(prm, cb, ecb) {
            var attr = this.attr;
            var self = this;

            // Check if connector is valid
            var conn = _Scope.componentByName(attr.connector);
            if (conn) {
                // Run the request
                conn.getClientToken(function(data){
                    var param = {
                        env: data.env,
                        token: data.token,
                        data: prm || {},
                        attr: attr
                    };
                    
                    // render the button
                    paypalGenerateButton(self._el, param, function(data){
                        // include the currency
                        data.currency = attr.currency;
                        
                        // call the authorize callback
                        conn.authorize(data, cb, ecb);
                    });
                }, ecb);
            }
        }
    });
    registerComponent(TPayPalButton, 'TPayPalButton', TContainer);
    exports.TPayPalButton = TPayPalButton;
    
    /**
     * Generates the paypal button
     * 
     * @param {string} element
     * @param {object} param
     * @param {function} callback
     * @param {function} errorCallback
     * @param {function} authorize
     */
    function paypalGenerateButton(element, param, callback, errorCallback) {
        // Prepare the object
        var client = {};
        client[param.env] = param.token;
        
        // make sure there is data object
        param.data = param.data || {};
        
        var paypalShippingAddress;
        if (param.data) {
            var address = param.data;
            
            paypalShippingAddress = {
                recipientName: address.first_name ? address.first_name + ' ' + address.last_name : '',
                line1: address.address_line1 || '',
                line2: address.address_line2 || '',
                city: address.city || '',
                countryCode: address.country_code || '',
                postalCode: address.postal_code || '',
                state: address.region || '',
                phone: address.phone || ''
            };
        }
        
        // enable shipping address
        var enableShippingAddress = param.attr.enableShippingAddress === true || param.attr.enableShippingAddress === 'true' ? true : false;
        
        // is shipping address editable
        // address edited here is not so cannot be use to
        var shippingAddressEditable = false; //param.attr.shippingAddressEditable === true || param.attr.shippingAddressEditable === 'true' ? true : false;
        
        // remove the previous button
        $(element).html('');
        
        // clean config
        paypal.Button.clean.all();
        
        // Render the button of the paypal
        paypal.Button.render({
            braintree: braintree,
            client: client,
            env: param.env,
            commit: true,
            payment: function (data, actions) {
                return actions.braintree.create({
                    flow: 'checkout', // Required
                    amount: param.data.amount || 1, // Required
                    currency: param.attr.currency || 'SGD', // Required. Default to SGD
                    intent: param.attr.intent || 'sale',
                    enableShippingAddress: enableShippingAddress,
                    shippingAddressEditable: shippingAddressEditable,
                    shippingAddressOverride: paypalShippingAddress
                });
            },
            onAuthorize: function (payload) {
                // Submit `payload.nonce` to your server.
                if (callback) {
                    callback({nonce:payload.nonce, data: param.data});
                }
            },
            onError: function (err) {
                if (errorCallback) { errorCallback(err); }
            }
        }, element);        
    }

    /**
     * AX Stuff
     */

    var TAxConnector = TComponent.extend({
        url: '',
        user: '',
        password: '',
        services: {},
        load: function(o) {
            this.parent(o);
            var attr = o.attr;
            this.url = attr.url || '';
            this.user = attr.user || '';
            this.password = attr.password || '';
            this.services = attr.services || {};
        },
        request: function(prm, dt, cb, ecb) {
            this.url = this.attr.url || this.url;
            this.user = this.attr.user || this.user;
            this.password = this.attr.password || this.password;
            //this.services=this.attr.services||this.services;
            var self = this;
            var odt = {
                    url: this.url,
                    _user: this.user,
                    _password: this.password
                }
                // Include all the data
            for (var key in dt) {
                odt[key] = JSON.stringify(dt[key]);
            }
            var d = axService(prm, odt, function(o) {
                // Clear timeout
                clearTimeout(timeout);
                if (o.s) {
                    console.log('success', o);
                    if (cb) {
                        cb(o);
                    }
                } else {
                    console.log('failed', e);
                    if (ecb) {
                        ecb(o.err);
                    }
                }
            }, function(e) {
                // Clear timeout
                clearTimeout(timeout);
                console.log('failed to checking', e);
                if (ecb) {
                    ecb(e);
                }
            });

            // Set the request timeout
            var timeout = setTimeout(function() {
                d.abort();
                if (ecb) {
                    ecb({
                        err: 'request timeout'
                    });
                }
            }, parseInt(self.attr.timeOut) || 5000);

            return true;
        },
        init: function(name) {
            this.parent(name);
        },
    });
    registerComponent(TAxConnector, 'TAxConnector', TComponent);

    var TAxDataset = TDataset.extend({
        autoLoad: true,
        autoClear: false,
        _lastCfg: {},
        _lastCb: null,
        _lastEcb: null,
        connector: '',
        prm: {},
        serviceName: '',
        getDataFunction: '',
        insertDataFunction: '',
        updateDataFunction: '',
        listKey: '',
        addListener: function(o) {
            this._listener = this._listener || [];
            if (!AM.isIn(o, this._listener)) {
                // Clear first as it should not have multiple listeners
                this._listener = [];
                this._listener.push(o);
            }
        },
        setParam: function(prm) {
            this.prm = prm;
        },
        init: function(name) {
            this.parent(name);
        },
        load: function(o) {
            var attr = o.attr || {};
            this.connector = attr.connector || '';
            this.serviceName = attr.serviceName || '';
            this.getDataFunction = attr.getDataFunction || '';
            this.insertDataFunction = attr.insertDataFunction || '';
            this.listKey = attr.listKey || '';
            this.limit = attr.limit || null;
            this.setConnector();
        },
        loadData: function(cb, ecb, config) {
            var self = this;

            // Check if the connector is already called
            if (!this._connector) {
                this.setConnector();
            }

            if (this._connector) {
                var next = false;
                var prm = {
                    api: 'data',
                    a: 'get',
                    ent: this.serviceName
                };
                var dt = {};
                if (self.limit) {
                    prm.limit = self.limit;
                }
                if (config && config.parameter) {
                    next = config.parameter.next || false;
                    delete(config.parameter.next);
                    if (config.parameter.limit) {
                        prm.limit = config.parameter.limit;
                    }
                    if (config.parameter.page) {
                        prm.page = config.parameter.page;
                    }
                    if (config.parameter.filter) {
                        dt.filter = config.parameter.filter;
                    }
                    if (config.parameter.orfilter) {
                        dt.orfilter = config.parameter.orfilter;
                    }
                    if (config.parameter.order) {
                        dt.order = config.parameter.order;
                    }
                }
                var cba = function(o) {
                    console.log('yang diperoleh ', o);
                    if (o.s && o.dt) {
                        var data = self.listKey ? o.dt[self.listKey] : o.dt;
                        //var data=o.dt.data;
                        if (cb) {
                            self._lastCb = cb;
                            cb(data || []);
                        } else {
                            self._lastCb = null;
                        }
                        self.data = data;
                        self.refreshListener(next);
                    }
                }
                var ecba = function(err) {
                    if (ecb) {
                        self._lastEcb = ecb;
                        ecb(err);
                    }
                }
                self._lastCfg = clone(config);
                this._connector.request(prm, dt, cba, ecba);
            }
            return false;
        },
        loadNext: function() {
            var cfg = this._lastCfg || {};
            cfg.parameter = cfg.parameter || {};
            cfg.parameter.page = cfg.parameter.page || 1;
            cfg.parameter.next = true;
            if (cfg.parameter.page) {
                cfg.parameter.page++;
            }
            console.log(cfg);
            return this.loadData(this._lastCb, this._lastEcb, cfg);
        }
    });
    registerComponent(TAxDataset, 'TAxDataset', TDataset);

    /**
     * Created by vsa on 14/9/15.
     */
    function crmService(prm, dt, cb, ecb) {
        prm = prm || {};
        var url = _baseConfig.crmservice + '?' + AM.encodeArguments(prm);
        console.log('request url crm : ', url);
        console.log('request dt : ', dt);
        var d = AM.getRequest(url);
        d.addCallback(function(s) {
            var r = safeEval(s);
            if (r) {
                if (r.s) {
                    if (cb) {
                        cb.apply(d, [r])
                    }
                } else {
                    if (ecb) {
                        ecb.apply(d, [r])
                    }
                }
            } else {
                if (ecb) {
                    ecb.apply(d, [{
                        s: false,
                        err: s
                    }])
                }
            }
        });
        d.addErrback(function(s) {
            if (ecb) {
                ecb.apply(d, [{
                    s: false,
                    err: s
                }])
            }
        });
        dt = dt || {};
        for (var i in dt) {
            if (AM.isObject(dt[i])) {
                dt[i] = AM.serializeJSON(dt[i]);
            }
        }
        d.sendReq(dt);
        return d;
    }
    //$rp=array(
    //  'email'=>'admin@gmail.com',
    //  'password'=>'password',
    //  'api_key'=>'111',
    //  '_method'=>'post',
    //  '_url'=>'http://128.199.206.138/api/',
    //  '_path'=>'sessions'
    //);
    var TCrmConnector = TComponent.extend({
        url: '',
        user: '',
        password: '',
        services: {},
        _t: null,
        load: function(o) {
            this.parent(o);
            var attr = o.attr;
            this.url = attr.url || '';
            this.user = attr.user || '';
            this.password = attr.password || '';
            this.services = attr.services || {};
        },
        request: function(prm, dt, cb, ecb) {
            this.url = this.attr.url || this.url;
            this.user = this.attr.user || this.user;
            this.password = this.attr.password || this.password;
            this.services = this.attr.services || this.services;
            var self = this;
            var odt = {
                url: this.url,
                _user: this.user,
                _password: this.password
            }
            var odt = AM.update(odt, dt);
            var d = crmService(prm, odt, function(o) {
                clearTimeout(self._t);
                if (o.s) {
                    console.log('success', o);
                    if (cb) {
                        cb(o);
                    }
                } else {
                    console.log('failed', e);
                    if (ecb) {
                        ecb(o.err);
                    }
                }
            }, function(e) {
                clearTimeout(self._t);
                console.log('failed to checking', e);
                if (ecb) {
                    ecb(e);
                }
            });

            self._t = setTimeout(function() {
                d.abort();
                if (ecb) {
                    ecb({
                        err: 'request timeout'
                    });
                }
            }, parseInt(self.attr.timeOut) || 5000);

            return true;
        },
        init: function(name) {
            this.parent(name);
        }
    });
    registerComponent(TCrmConnector, 'TCrmConnector', TComponent);


    /* source:lib/components/3rdparty/crmdataset.js */


    var TCrmDataset = TDataset.extend({
        autoLoad: true,
        autoClear: false,
        //_listener:[],
        //save:function(){
        //  setLocalJSONStorage('localTable_'+this.name,this.data);
        //},
        _lastCfg: {},
        _lastCb: null,
        _lastEcb: null,
        connector: '',
        prm: {},
        serviceName: '',
        getDataFunction: '',
        insertDataFunction: '',
        updateDataFunction: '',
        listKey: '',
        addListener: function(o) {
            this._listener = this._listener || [];
            if (!AM.isIn(o, this._listener)) {
                // Clear first as it should not have multiple listeners
                this._listener = [];
                this._listener.push(o);
            }
        },
        setParam: function(prm) {
            this.prm = prm;
        },
        loadData: function(cb, ecb, config) {
            //console.log('=====>',config);
            var self = this;
            if (this._connector) {
                var next = false;
                var prm = {
                    api: 'data',
                    a: 'get',
                    ent: this.serviceName
                };
                var dt = {};
                if (self.limit) {
                    prm.limit = self.limit;
                }
                if (config && config.parameter) {
                    next = config.parameter.next || false;
                    delete(config.parameter.next);
                    if (config.parameter.limit) {
                        prm.limit = config.parameter.limit;
                    }
                    if (config.parameter.page) {
                        prm.page = config.parameter.page;
                    }
                    if (config.parameter.filter) {
                        dt.filter = config.parameter.filter;
                    }
                    if (config.parameter.orfilter) {
                        dt.orfilter = config.parameter.orfilter;
                    }
                    if (config.parameter.order) {
                        dt.order = config.parameter.order;
                    }
                }
                var cba = function(o) {
                    console.log('yang diperoleh ', o);
                    if (o.s && o.dt) {
                        var data = self.listKey ? o.dt[self.listKey] : o.dt;
                        //var data=o.dt.data;
                        if (cb) {
                            self._lastCb = cb;
                            cb(data || []);
                        } else {
                            self._lastCb = null;
                        }
                        self.data = data;
                        self.refreshListener(next);
                    }
                }
                var ecba = function(err) {
                    if (ecb) {
                        self._lastEcb = ecb;
                        ecb(err);
                    }
                }
                self._lastCfg = clone(config);
                this._connector.request(prm, dt, cba, ecba);
            }
            return false;
        },
        loadNext: function() {
            var cfg = this._lastCfg || {};
            cfg.parameter = cfg.parameter || {};
            cfg.parameter.page = cfg.parameter.page || 1;
            cfg.parameter.next = true;
            if (cfg.parameter.page) {
                cfg.parameter.page++;
            }
            return this.loadData(this._lastCb, this._lastEcb, cfg);
        },
        load: function(o) {
            //console.log('xxx')
            var attr = o.attr || {};
            this.connector = attr.connector || '';
            this.serviceName = attr.serviceName || '';
            this.getDataFunction = attr.getDataFunction || '';
            this.insertDataFunction = attr.insertDataFunction || '';
            this.listKey = attr.listKey || '';
            this.limit = attr.limit || null;
            if (this.connector) {
                this._connector = _Scope.componentByName(this.connector);
            }
        },
        init: function(name) {
            this.parent(name);
        }
    });
    registerComponent(TCrmDataset, 'TCrmDataset', TDataset);


    /* source:lib/components/3rdparty/mssqlconn.js */


    function mssqlService(prm, dt, cb, ecb) {
        prm = prm || {};
        var url = _baseConfig.mssqlservice + '?' + AM.encodeArguments(prm);
        console.log('Request Data: ', {'url': dt.url, 'port': dt.port, 'database': dt.database, 'user': dt._user, 'data': dt.data});
        var d = AM.getRequest(url);
        d.addCallback(function(s) {
            var r = safeEval(s);
            if (r) {
                if (r.s) {
                    if (cb) {
                        cb.apply(d, [r])
                    }
                } else {
                    if (ecb) {
                        ecb.apply(d, [r])
                    }
                }
            } else {
                if (ecb) {
                    ecb.apply(d, [{
                        s: false,
                        err: s
                    }])
                }
            }
        });
        d.addErrback(function(s) {
            if (ecb) {
                ecb.apply(d, [{
                    s: false,
                    err: s
                }])
            }
        });
        dt = dt || {};
        for (var i in dt) {
            if (AM.isObject(dt[i])) {
                dt[i] = AM.serializeJSON(dt[i]);
            }
        }
        d.sendReq(dt);
        return d;
    }

    //$rp=array(
    //  'email'=>'admin@gmail.com',
    //  'password'=>'password',
    //  'api_key'=>'111',
    //  '_method'=>'post',
    //  '_url'=>'http://128.199.206.138/api/',
    //  '_path'=>'sessions'
    //);

    var TMssqlConnector = TComponent.extend({
        url: '',
        port: '',
        database: '',
        user: '',
        password: '',
        services: {},
        load: function(o) {
            this.parent(o);
            var attr = o.attr;
            this.url = attr.url || '';
            this.port = attr.port || '';
            this.database = attr.database || '';
            this.user = attr.user || '';
            this.password = attr.password || '';
            this.services = attr.services || {};
        },
        request: function(prm, dt, cb, ecb) {
            this.url = this.attr.url || this.url;
            this.port = this.attr.port || this.port;
            this.database = this.attr.database || this.database;
            this.user = this.attr.user || this.user;
            this.password = this.attr.password || this.password;
            var self = this;
            var odt = {
                url: this.url,
                port: this.port,
                database: this.database,
                _user: this.user,
                _password: this.password
            }

            var odt = AM.update(odt, dt);
            var d = mssqlService(prm, odt, function(o) {
                // Clear timeout
                clearTimeout(timeout);
                if (o.s) {
                    console.log('success', o);
                    if (cb) {
                        cb(o);
                    }
                } else {
                    console.log('failed', e);
                    if (ecb) {
                        ecb(o.err);
                    }
                }
            }, function(e) {
                // Clear timeout
                clearTimeout(timeout);
                console.log('failed to checking', e);
                if (ecb) {
                    ecb(e);
                }
            });

            // Set the request timeout
            var timeout = setTimeout(function() {
                d.abort();
                if (ecb) {
                    ecb({
                        err: 'request timeout'
                    });
                }
            }, parseInt(self.attr.timeOut) || 5000);

            return true;
        },
        init: function(name) {
            this.parent(name);
        },
    });
    registerComponent(TMssqlConnector, 'TMssqlConnector', TComponent);


    /* source:lib/components/3rdparty/mssqldataset.js */


    var TMssqlDataset = TDataset.extend({
        autoLoad: true,
        autoClear: false,
        _lastRecord: null,
        _lastCfg: {},
        _lastCb: null,
        _lastEcb: null,
        connector: '',
        prm: {},
        serviceName: '',
        listKey: '',
        WithJoin: '',
        TableJoin: '',
        addListener: function(o) {
            this._listener = this._listener || [];
            if (!AM.isIn(o, this._listener)) {
                // Clear first as it should not have multiple listeners
                this._listener = [];
                this._listener.push(o);
            }
        },
        setParam: function(prm) {
            this.prm = prm;
        },
        init: function(name) {
            this.parent(name);
        },
        load: function(o) {
            var attr = o.attr || {};
            this.connector = attr.connector || '';
            this.serviceName = attr.serviceName || '';
            this.listKey = attr.listKey || '';
            this.WithJoin = attr.WithJoin || '';
            this.TableJoin = attr.TableJoin || '';
            this.limit = attr.limit || null;
            this.setConnector();
        },
        loadData: function(cb, ecb, config) {
            var self = this;
            
            // Check if the connector is already called
            if (!this._connector) {
                this.setConnector();
            }
            
            if (this._connector) {
                var next = false;

                var prm = {
                    api: 'data',
                    a: 'get',
                    ent: this.serviceName,
                };

                // Fields
                if (this.fields != null) {
                    prm['fields'] = this.fields;
                }
                if (this.fields != '') {
                    prm['fields'] = this.fields;
                }
                if (this.fields != undefined) {
                    prm['fields'] = this.fields;
                }

                // WithJoin
                if (this.WithJoin != null) {
                    prm['join'] = this.WithJoin;
                }
                if (this.WithJoin != '') {
                    prm['join'] = this.WithJoin;
                }
                if (this.WithJoin != undefined) {
                    prm['join'] = this.WithJoin;
                }

                // Table Join
                if (this.WithJoin != null) {
                    prm['join'] = this.WithJoin;
                }
                if (this.TableJoin != '') {
                    prm['jointable'] = this.TableJoin;
                }
                if (this.TableJoin != undefined) {
                    prm['jointable'] = this.TableJoin;
                }

                var dt = {};
                if (self.limit) {
                    prm.limit = self.limit;
                }
                if (config && config.parameter) {
                    next = config.parameter.next || false;
                    delete(config.parameter.next);
                    if (config.parameter.limit) {
                        prm.limit = config.parameter.limit;
                    }
                    if (config.parameter.page) {
                        prm.page = config.parameter.page;
                    }
                    if (config.parameter.filter) {
                        dt.filter = config.parameter.filter;
                    }
                    if (config.parameter.orfilter) {
                        dt.orfilter = config.parameter.orfilter;
                    }
                    if (config.parameter.order) {
                        dt.order = config.parameter.order;
                    }

                    // Check if it's next
                    if (next && config.parameter.limit) {
                        this._lastRecord += config.parameter.limit;
                    } else if (next) {
                        this._lastRecord = 10000000;
                    }
                } else {
                    this._lastRecord = null;
                }

                prm.lastRecord = this._lastRecord;
                
                var cba = function(o) {
                    if (o.s && o.dt) {
                        var data = self.listKey ? o.dt[self.listKey] : o.dt;
                        if (cb) {
                            self._lastCb = cb;
                            cb(data || []);
                        } else {
                            self._lastCb = null;
                        }
                        self.data = data;
                        self.refreshListener(next);
                    }
                }
                var ecba = function(err) {
                    if (ecb) {
                        self._lastEcb = ecb;
                        ecb(err);
                    }
                }
                self._lastCfg = clone(config);
                this._connector.request(prm, dt, cba, ecba);
            }
            return false;
        },
        loadNext: function() {
            var cfg = this._lastCfg || {};
            cfg.parameter = cfg.parameter || {};
            cfg.parameter.page = cfg.parameter.page || 1;
            cfg.parameter.next = true;
            if (cfg.parameter.page) {
                cfg.parameter.page++;
            }
            return this.loadData(this._lastCb, this._lastEcb, cfg);
        }
    });
    registerComponent(TMssqlDataset, 'TMssqlDataset', TDataset);

    /**
     * MySQL Connector
     */

    var TRawSqlDataset = TDataset.extend({
        autoLoad: true,
        autoClear: false,
        //_listener:[],
        //save:function(){
        //  setLocalJSONStorage('localTable_'+this.name,this.data);
        //},
        _lastCfg: {},
        _lastCb: null,
        _lastEcb: null,
        connector: '',
        prm: {},
        from: '',
        select: '',
        group: '',
        where: '',
        listKey: '',
        addListener: function(o) {
            this._listener = this._listener || [];
            if (!AM.isIn(o, this._listener)) {
                // Clear first as it should not have multiple listeners
                this._listener = [];
                this._listener.push(o);
            }
        },
        setParam: function(prm) {
            this.prm = prm;
        },
        loadData: function(cb, ecb, config) {
            console.log('=====>', config);
            var self = this;
            if (this._connector) {
                var next = false;
                var prm = { api: 'data', a: 'get', from: this.from, select: this.select, where: this.where, group: this.group };

                var dt = {};
                if (self.limit) { prm.limit = self.limit; }
                if (config && config.parameter) {
                    next = config.parameter.next || false;
                    delete(config.parameter.next);
                    if (config.parameter.limit) { prm.limit = config.parameter.limit; }
                    if (config.parameter.page) { prm.page = config.parameter.page; }
                    if (config.parameter.filter) { dt.filter = config.parameter.filter; }
                    if (config.parameter.orfilter) { dt.orfilter = config.parameter.orfilter; }
                }

                var cba = function(o) {
                    console.log('ini yang diperoleh ', o);
                    if (o.s && o.dt) {

                        var data = o.dt;
                        //var data=o.dt.data;
                        if (cb) {


                            self._lastCb = cb;
                            cb(data || []);
                        } else {
                            self._lastCb = null;
                        }
                        self.data = data;
                        self.refreshListener(next);
                    }
                }
                var ecba = function(err) {
                    if (ecb) {
                        self._lastEcb = ecb;
                        ecb(err);
                    }
                }
                self._lastCfg = clone(config);
                this._connector.request(prm, dt, cba, ecba);
            }
            return false;
        },
        loadNext: function() {
            var cfg = this._lastCfg || {};
            cfg.parameter = cfg.parameter || {};
            cfg.parameter.page = cfg.parameter.page || 1;
            cfg.parameter.next = true;
            if (cfg.parameter.page) { cfg.parameter.page++; }
            return this.loadData(this._lastCb, this._lastEcb, cfg);
        },
        load: function(o) {
            //console.log('xxx')
            var attr = o.attr || {};
            this.connector = attr.connector || '';
            this.select = attr.select || '';
            this.from = attr.from || '';
            this.group = attr.group || '';
            this.listKey = attr.listKey || '';
            this.limit = attr.limit || null;
            if (this.connector) {
                this._connector = _Scope.componentByName(this.connector);
            }
            //console.log('xxx2')
        },
        init: function(name) {
            this.parent(name);
        }
    });

    registerComponent(TRawSqlDataset, 'TRawSqlDataset', TDataset);

    function rawSqlService(prm, dt, cb, ecb) {
        prm = prm || {};
        var url = _baseConfig.rawsqlservice  + '?' + AM.encodeArguments(prm);
        console.log('request url : ', url);
        console.log('request dt : ', dt);
        var d = AM.getRequest(url);
        d.addCallback(function(s) {
            var r = safeEval(s);
            if (r) {
                if (r.s) {
                    if (cb) { cb.apply(d, [r]) }
                } else {
                    if (ecb) { ecb.apply(d, [r]) }
                }
            } else {
                if (ecb) { ecb.apply(d, [{ s: false, err: s }]) }
            }
        });
        d.addErrback(function(s) {
            if (ecb) { ecb.apply(d, [{ s: false, err: s }]) }
        });
        dt = dt || {};
        for (var i in dt) {
            if (AM.isObject(dt[i])) {
                dt[i] = AM.serializeJSON(dt[i]);
            }
        }
        d.sendReq(dt);
        return d;
    }

    var TRawSqlConnector = TComponent.extend({
        url: '',
        database: '',
        user: '',
        password: '',
        services: {},
        load: function(o) {
            this.parent(o);
            var attr = o.attr;
            
            this.url = attr.url || '';
            this.user = attr.user || '';
            this.password = attr.password || '';
            this.services = attr.services || {};
            this.database = attr.database || '';
        },
        request: function(prm, dt, cb, ecb) {
            var odt = { url: this.url, _user: this.user, _password: this.password, database: this.database }
            var odt = AM.update(odt, dt);
            rawSqlService(prm, odt, function(o) {
                if (o.s) {
                    console.log('sukses', o);
                    if (cb) {
                        cb(o);
                    }
                } else {
                    console.log('gagal', e);
                    if (ecb) {
                        ecb(o.err);
                    }
                }
            }, function(e) {
                console.log('gagal', e);
                if (ecb) {
                    ecb(e);
                }
            });
            return true;
        },
        init: function(name) {
            this.parent(name);
        },
    });

    registerComponent(TRawSqlConnector, 'TRawSqlConnector', TComponent);


    /**
     * Include the extra value if existing
     * for the return
     */
    function includeExtraParam(result, extra) {
        // Check if there is extra passed
        if (extra) {
            // Check if there is data returned
            if (!result) {
                result = {};
            }
            result.extra = extra;                            
        }
        return result;
    }


    /**
     * Created by vsa on 5/10/15.
     */
    /**
     * Creates a new `Paginate` form a givin `Array`,
     * optionally with a specific `Number` of items per page.
     *
     * @param {Array} data
     * @param {Number} [perPage=10]
     * @constructor
     * @api public
     */
    function Paginate(data, perPage) {
        if (!data) throw new Error('Required Argument Missing')
        if (!(data instanceof Array)) throw new Error('Invalid Argument Type')
        this.dtpage = data
        this.perPage = perPage || 10
        this.currentPage = 0
        this.totalPages = Math.ceil(this.dtpage.length / this.perPage)
    }
    Paginate.prototype.offset = function() {
        return ((this.currentPage - 1) * this.perPage);
    }
    Paginate.prototype.page = function(pageNum) {
        if (pageNum < 1) pageNum = 1
        if (pageNum > this.totalPages) pageNum = this.totalPages
        this.currentPage = pageNum
        var start = this.offset(),
            end = start + this.perPage
        return this.dtpage.slice(start, end);
    }
    Paginate.prototype.next = function() {
        return this.page(this.currentPage + 1);
    }
    Paginate.prototype.prev = function() {
        return this.page(this.currentPage - 1);
    }
    Paginate.prototype.hasNext = function() {
        return (this.currentPage < this.totalPages)
    }
    if (typeof module !== 'undefined') module.exports = Paginate

    /**
     * Class to be used for using camera picture, and audio
     */
    var _captureClass = function() {};
    _captureClass.prototype = {
        pictureSource: null,
        destinationType: null,
        _captureVideo: function(cb, ecb, prm) {
            var that = this;
            navigator.device.capture.captureVideo(function() {
                //that._captureSuccess.apply(that, arguments);
                cb.apply(that, arguments);
            }, function() {
                //captureApp._captureError.apply(that, arguments);
                ecb.apply(that, arguments);
            }, {
                limit: 1
            });
        },

        _captureAudio: function(cb, ecb, prm) {
            var that = this;
            navigator.device.capture.captureAudio(function() {
                //that._captureSuccess.apply(that, arguments);
                cb.apply(that, arguments);
            }, function() {
                //captureApp._captureError.apply(that, arguments);
                ecb.apply(that, arguments);
            }, {
                limit: 1
            });
        },

        _captureImage: function(cb, ecb, prm) {
            var that = this;

            // Prepare the options
            var options = {};

            if (prm.quality) {
                options.quality = parseInt(prm.quality);
            }
            if (prm.height) {
                options.targetWidth = parseInt(prm.height);
            }
            if (prm.width) {
                options.targetHeight = parseInt(prm.width);
            }

            options.correctOrientation = true;

            navigator.camera.getPicture(function() {
                cb.apply(that, arguments);
            }, function() {
                ecb.apply(that, arguments);
            }, options);
        }
    }

    var _captureObj = new _captureClass();
    function _captureFunction(f, ebd, prm) {
        f(
            function(capturedFiles) {
                if (capturedFiles) {
                    // Get the file if it's multiple file
                    if (capturedFiles.length && capturedFiles[0].fullPath) {
                        capturedFiles = capturedFiles[0].localURL;
                    }
                    // Callback
                    if (prm.callback) {
                        _doAction(prm.callback, AM.update(ebd, {
                            input: capturedFiles
                        }));
                    }
                } else {
                    if (prm.errorCallback) {
                        _doAction(prm.errorCallback, AM.update(ebd, {
                            input: {
                                code: 10
                            }
                        }));
                    }
                }
            },
            function(error) {
                if (prm.errorCallback) {
                    _doAction(prm.errorCallback, AM.update(ebd, {
                        input: error
                    }));
                }
            },
            prm
        );
    }

    // Used by this plugin https://github.com/EddyVerbruggen/Custom-URL-scheme
    // Handles the incoming data from external application
    function handleOpenURL(url) {
        // Get only the query string from the url
        var index = (url.indexOf('?') == -1 ? url.indexOf('#') : url.indexOf('?'));
        var queryString = url.substring(index + 1);

        // Split into key/value pairs
        var queries = queryString.split("&");

        // Convert the array of strings into an object
        var params = {};
        var temp;
        for (var i = 0, l = queries.length; i < l; i++) {
            temp = queries[i].split('=');
            params[temp[0]] = temp[1];
        }

        _GVar['GLOBAL_EXTERNAL_DATA_APP'] = params;
    }

    // Make this function available globally
    window.handleOpenURL = handleOpenURL;

    // aris update 
    var _watchId;

    var locationLastUpdateTime = null;
    registerFunction({
        //cordova plugin add org.apache.cordova.geolocation
        'getLocation': function(prm) {
            var opts = {
                maximumAge: 3000,
                timeout: 5000,
                enableHighAccuracy: false
            }
            var ebd = this;
            ebd = ebd || {};
            if (prm.maximumAge) {
                opts.maximumAge = prm.maximumAge;
            }
            if (prm.timeout) {
                opts.timeout = prm.timeout;
            }
            if (prm.enableHighAccuracy) {
                opts.enableHighAccuracy = prm.enableHighAccuracy;
            }
            if (navigator.geolocation && navigator.geolocation.getCurrentPosition) {
                return navigator.geolocation.getCurrentPosition(function(position) {
                        var posi = {};
                        posi.latLng = position.coords.latitude + ',' + position.coords.longitude;
                        posi.position = position.coords.latitude + ',' + position.coords.longitude;
                        posi.lat = position.coords.latitude;
                        posi.latitude = position.coords.latitude;
                        posi.long = position.coords.longitude;
                        posi.longitude = position.coords.longitude;
                        posi = AM.update(posi, position.coords);
                        posi.timestamp = position.timestamp;
                        if (prm.callback) {
                            _doAction(prm.callback, AM.update(ebd, {
                                input: posi
                            }));
                        }
                    },
                    function(error) {
                        if (prm.errorCallback) {
                            _doAction(prm.errorCallback, AM.update(ebd, {
                                input: error
                            }));
                        }
                    }, opts);
            } else {
                if (prm.errorCallback) {
                    _doAction(prm.errorCallback, AM.update(ebd, {
                        input: {
                            message: 'navigator.geolocation invalid'
                        }
                    }));
                }
                return false;
            }
            //return false;
        },
        'watchPosition':function(prm){
            var opts = {
                maximumAge: 3000,
                timeout: 5000,
                enableHighAccuracy: false,
                timeInterval: 0, //in milliseconds
            }
            var ebd = this;
            ebd = ebd || {};
            if (prm.maximumAge) {
                opts.maximumAge = prm.maximumAge;
            }
            if (prm.timeout) {
                opts.timeout = prm.timeout;
            }
            if (prm.enableHighAccuracy) {
                opts.enableHighAccuracy = prm.enableHighAccuracy;
            }
            if (prm.timeInterval) {
                opts.timeInterval = prm.timeInterval;
            }
            if (navigator.geolocation && navigator.geolocation.watchPosition) {
                _watchId= navigator.geolocation.watchPosition(function(position) {
                        var posi = {};
                        posi.latLng = position.coords.latitude + ',' + position.coords.longitude;
                        posi.lat = position.coords.latitude;
                        posi.long = position.coords.longitude;
                        posi = AM.update(posi, position.coords);
                        posi.timestamp = position.timestamp;
                        var now = new Date();
                        if(locationLastUpdateTime === null){
                            locationLastUpdateTime = now;
                        }
                        // get the time difference to compare against timeInterval => decide whether it is time yet to doAction 
                        var timeDiff = now.getTime() - locationLastUpdateTime.getTime();
                        if (prm.callback && (timeDiff >= opts.timeInterval || timeDiff == 0)) { //run callback for first time and then after certain interval
                            _doAction(prm.callback, AM.update(ebd, {
                                input: posi
                            }));
                            locationLastUpdateTime = now; //reset the last update time
                        }
                    },
                    function(error) {
                        if (prm.errorCallback) {
                            _doAction(prm.errorCallback, AM.update(ebd, {
                                input: error
                            }));
                        }
                    }, opts);

                return true;
            } else {
                if (prm.errorCallback) {
                    _doAction(prm.errorCallback, AM.update(ebd, {
                        input: {
                            message: 'navigator.watch position invalid'
                        }
                    }));
                }
                return false;
            }
        },
        'clearPosition':function(prm){
            if (navigator.geolocation && navigator.geolocation.clearWatch) {
                navigator.geolocation.clearWatch(_watchId);
            };
            return false;
        },
        //cordova plugin add org.apache.cordova.media-capture
        'captureImage': function(prm) {
            // Check if plugin is existing
            var ebd = this;
            if (typeof navigator.camera === 'undefined') {
                if (prm.errorCallback) {
                    _doAction(prm.errorCallback, AM.update(ebd, {
                        input: {
                            code: 11,
                            message: 'navigator.device.capture failed'
                        }
                    }));
                }
                return false;
            }
            _captureFunction(_captureObj._captureImage, this || {}, prm);
            return true;            
        },
        'captureAudio': function(prm) {
            // Check if plugin is existing
            var ebd = this;
            if (typeof navigator.device.capture === 'undefined') {
                if (prm.errorCallback) {
                    _doAction(prm.errorCallback, AM.update(ebd, {
                        input: {
                            code: 11,
                            message: 'navigator.device.capture failed'
                        }
                    }));
                }
                return false;
            }
            _captureFunction(_captureObj._captureAudio, this || {}, prm);
            return true;
        },
        'captureVideo': function(prm) {
            // Check if plugin is existing
            var ebd = this;
            if (typeof navigator.device.capture === 'undefined') {
                if (prm.errorCallback) {
                    _doAction(prm.errorCallback, AM.update(ebd, {
                        input: {
                            code: 11,
                            message: 'navigator.device.capture failed'
                        }
                    }));
                }
                return false;
            }
            _captureFunction(_captureObj._captureVideo, this || {}, prm);
            return true;
        },
        'imageChooser': function(prm) {
            var ebd = this;
            var options = {};

            if (prm.multiple) {
                options.multiple = prm.multiple;
            }

            imageChooser.chooseImage(	
                function(data) {
                    if (Array.isArray(data)) {
                        data = data[0];
                    }
			
                    if (prm.callback) {
                        _doAction(prm.callback, AM.update(ebd, {input: data}));
                    }
                }, function(error) {
                    if (prm.errorCallback) {
                        _doAction(prm.errorCallback, AM.update(ebd, {input: error}));
                    }
                }, options);
        },
        'dateTimeChooser': function(prm) {
            // Store important variables
            var element = this || {};
            var options = {};

            // Mode - date, time, datetime
            if (prm.mode) {
                options.mode = prm.mode;
            }
            // Date
            if (prm.date) {
                options.date = new Date(prm.date);
            } else {
                options.date = new Date();
            }
            // Min Date
            if (prm.minDate) {
                options.minDate = new Date(prm.minDate);
                options.minDate = (device.platform == 'iOS' ? options.minDate : options.minDate.getTime());
            }
            // Max Date
            if (prm.maxDate) {
                options.maxDate = new Date(prm.maxDate);
                options.maxDate = (device.platform == 'iOS' ? options.maxDate : options.maxDate.getTime());
            }
            // Title Text
            if (prm.titleText) {
                options.titleText = prm.titleText;
            }
            if (prm.okText) {
                options.okText = prm.okText;
            }
            if (prm.cancelText) {
                options.cancelText = prm.cancelText;
            }
            if (prm.todayText) {
                options.todayText = prm.todayText;
            }
            if (prm.is24Hour) {
                options.is24Hour = prm.is24Hour;
            }
            if (prm.androidTheme) {
                options.androidTheme = prm.androidTheme;
            }
            if (prm.allowOldDates) {
                options.allowOldDates = prm.allowOldDates;
            }
            if (prm.allowFutureDates) {
                options.allowFutureDates = prm.allowFutureDates;
            }
            if (prm.doneButtonLabel) {
                options.doneButtonLabel = prm.doneButtonLabel;
            }
            if (prm.doneButtonColor) {
                options.doneButtonColor = prm.doneButtonColor;
            }
            if (prm.cancelButtonLabel) {
                options.cancelButtonLabel = prm.cancelButtonLabel;
            }
            if (prm.cancelButtonColor) {
                options.cancelButtonColor = prm.cancelButtonColor;
            }
            if (prm.xPosition) {
                options.x = prm.xPosition;
            }
            if (prm.yPosition) {
                options.y = prm.yPosition;
            }
            if (prm.minuteInterval) {
                options.minuteInterval = prm.minuteInterval;
                // manually set default datetime to nearest time interval, because there is a bug in UIDatepicker
                options.date.setMinutes(Math.round(options.date.getMinutes() / options.minuteInterval) * options.minuteInterval);
            }
            if (prm.popoverArrowDirection) {
                options.popoverArrowDirection = prm.popoverArrowDirection;
            }
            if (prm.locale) {
                options.locale = prm.locale;
            }
            // added style parameter for iOS 14 update
            if (prm.style) { // the options are: automatic, inline, compact, or wheels (the legacy style is wheels)
                options.style = prm.style;
            }

            // Trigger the plugin
            datePicker.show(options, 
                function(date) {
                    callback(element, prm.callback, date, null);
                }, 
                function(error){
                    callback(element, prm.errorCallback, error, null);
                }
            );
        },
        'keyboardShow': function() {
            // Display keyboard
            Keyboard.show();
        },
        'keyboardHide': function() {
            // Hide keyboard
            setTimeout(function(){
                Keyboard.hide();
            }, 50);
        },
        // Barcode Scanner
        'barcodeScanner': function(prm) {
            // Store important variables
            var element = this || {};

            // Make sure it is mobile app
            if (!isCordova()) {
                callback(element, prm.errorCallback, 'Unable to run it in browser.', null);
                return false;
            }

            // Start scanning
            cordova.plugins.barcodeScanner.scan(
                function(result) {
                    callback(element, prm.callback, result.text, null);
                },
                function(error) {
                    callback(element, prm.errorCallback, error, null);
                }, 
                {
                    showFlipCameraButton: prm.showFlipCameraButton ? prm.showFlipCameraButton : true, // iOS and Android
                    showTorchButton: prm.showTorchButton ? prm.showTorchButton : true, // iOS and Android
                    torchOn: prm.torchOn ? prm.torchOn : false, // Android, launch with the torch switched on (if available)
                    prompt: prm.prompt ? prm.prompt : "Place a barcode inside the scan area", // Android
                    resultDisplayDuration: prm.resultDuration ? prm.resultDuration : 500 // Android, display scanned text for X ms. 0 suppresses it entirely, default 1500
                }
            );

            return true;
        },
        'barcodeScanTrigger': function(prm) {
            if (isCordova()) {
                window.plugins.intentShim.sendBroadcast({
                    action: 'com.symbol.datawedge.api.ACTION', 
                    extras: {
                        'com.symbol.datawedge.api.SOFT_SCAN_TRIGGER': 'TOGGLE_SCANNING'
                        }
                    },
                    function() {}, 
                    function() {}
                );
                return true;
            };
            return false;
        },
        'barcodeScanEnable': function(prm) {
            if (isCordova()) {
                window.plugins.intentShim.sendBroadcast({
                    action: 'com.symbol.datawedge.api.ACTION', 
                    extras: {
                        'com.symbol.datawedge.api.SCANNER_INPUT_PLUGIN': 'ENABLE_PLUGIN'
                        }
                    }, 
                    function() {}, 
                    function() {}
                );
                return true;
            };
            return false;
        },
        'barcodeScanDisable': function(prm) {
            if (isCordova()) {
                window.plugins.intentShim.sendBroadcast({
                    action: 'com.symbol.datawedge.api.ACTION', 
                    extras: {
                        'com.symbol.datawedge.api.SCANNER_INPUT_PLUGIN': 'DISABLE_PLUGIN'
                        }
                    }, 
                    function() {}, 
                    function() {}
                );
                return true;
            };
            return false;
        },
        'barcodeScanEvent': function(prm) {
            // Note: Need to register the wedge application for zebra based devices
            // https://github.com/darryncampbell/DataWedge-Cordova-Sample
            var ebd = this || {};

            if (isCordova()) {
                window.plugins.intentShim.registerBroadcastReceiver({
                    filterActions: [
                        prm['intentAction'] || 'com.zebra.cordovademo.ACTION', //  Scans
                        'com.symbol.datawedge.api.RESULT_ACTION' //  Messages from service
                        ],
                    filterCategories: [
                        'com.android.intent.category.DEFAULT'
                        ]
                    },
                    function(intent) {
                        //  Broadcast received
                        if (intent.extras["com.symbol.datawedge.data_string"] != null) {
                            _doAction(prm.callback, AM.update(ebd, {
                                input: intent.extras["com.symbol.datawedge.data_string"]
                            }));
                        }
                    }
                );
                return true;
            };
            return false;
        },
        /**
         * Returns the network information
         */
        'networkInformation': function(prm) {
            if (isCordova() && navigator.connection) {
                var result = {};
                result[Connection.UNKNOWN] = 'Unknown';
                result[Connection.ETHERNET] = 'Ethernet';
                result[Connection.WIFI] = 'Wifi';
                result[Connection.CELL_2G] = '2G';
                result[Connection.CELL_3G] = '3G';
                result[Connection.CELL_4G] = '4G';
                result[Connection.CELL] = 'Cell';
                result[Connection.NONE] = 'None';
                return result[navigator.connection.type];
            }
            return 'Unable to get network information.';
        },
        /**
         * Returns the network status if connected
         */
        'networkStatus': function(prm) {
            if (isCordova() && navigator.connection) {
                if (navigator.connection.type == Connection.NONE) {
                    return false;
                } 
            }
            return true;
        },
        // Open external application with parameters
        'openExternalApp': function(prm) {
            // Check if there is path given
            if (prm['path']) {
                // Produce the final path
                var path = prm['path'] + '?';

                // Generate the http query parameter
                var data = prm['data'];
                var result = [];
                for (var key in data) {
                    if (data.hasOwnProperty(key)) {
                        result.push(encodeURIComponent(key) + "=" + encodeURIComponent(data[key]));
                    }
                }
                path = path + result.join("&");

                // Open the external application
                //window.open(path, '_blank');
                window.open(path, '_system');
            }
            return false;
        },
        // Retrieve data that was passed by any external application
        'getExternalAppData': function() {i
            return _GVar['GLOBAL_EXTERNAL_DATA_APP'];
        },
        // Clear the external data passed by any application
        'clearExternalAppData': function() {
            _GVar['GLOBAL_EXTERNAL_DATA_APP'] = '';
            return true;
        },
        // Get File Detail ( only working for image capture by location permission enabled devices )
        'fileGetDetails':function(prm){
       
		var element = this || {};
	 	fileDetails.fetch(
		prm.filePath,
                function(result) {
                    var data = JSON.parse(result);
                    callback(element, prm.callback, data , null);
                },
                function(error) {
                    callback(element, prm.errorCallback, error, null);
                });
        },
	// File chooser
        'fileChooser':function(prm) {
            // Store important variables
            var element = this || {};
             
            // Make sure it is mobile app
            if (!isCordova()) {
                callback(element, prm.errorCallback, 'Unable to run it in browser.', null)
                return;
            } 

            // Trigger the file chooser
            (async () => {
                var file = await chooser.getFile();

                // Check if file was cancelled.
                if (!file) {
                    callback(element, prm.errorCallback, 'Cancelled.', null)
                }

                callback(element, prm.callback, file.uri, null)
            })();
        },
        'setSizeDisk':function(prm){
            var ebd = this || {};
            var errorCallback=function(e){
                _doAction(prm.errorCallback, AM.update(ebd, {
                    input: e
                }));
            };
            var callback=function(s){
                console.log(s);
                _doAction(prm.callback, AM.update(ebd, {
                    input: s
                }));
            };
            if (prm && !prm.path){
                if (prm.errorCallback){
                    return errorCallback(false);
                };
                
            }else{
                window.resolveLocalFileSystemURL(prm.path, function(fileEntry) {
                    fileEntry.file(function(fileObj) {
                            if (fileObj){
                                if (prm.callback){
                                    return callback(fileObj.size);
                                }
                            }else{
                                return errorCallback('file not exists');
                            }
                    });
                });
            }
        },
        /**
         * Device Vibrate Function
         * cordova plugin add cordova-plugin-vibration
         */
        'deviceVibrate': function(prm) {            
            var duration = prm.duration || 2;

            if (isCordova()) {
                navigator.vibrate(duration * 1000);
            }
        },
        /**
         * Device Beep/Sound Function
         * cordova plugin add cordova-plugin-dialogs
         */
        'deviceBeep': function(prm) {
            var times = prm.times || 2;

            if (isCordova()) {
                navigator.notification.beep(times);
            }
        },
        /**
         * Screen Brightness Function
         * cordova plugin add cordova-plugin-dialogs
         */
        'screenBrightness': function(prm) {
            var level = prm.level || 0;
            var keepScreenOn = prm.keepScreenOn || false;

            if (isCordova()) {
                // Set the brightness
                cordova.plugins.brightness.setBrightness(level / 10, 
                    function(){}, 
                    function(e){});

                // Enable/disable the function keep the screen on
                cordova.plugins.brightness.setKeepScreenOn(keepScreenOn);
            };
        },
        /**
         * Keep Screen On Function
         * cordova plugin add cordova-plugin-dialogs
         */
        'keepScreenOn': function(prm) {
            var value = prm.value || false;

            if (isCordova()) {
                // Enable/disable the function keep the screen on
                cordova.plugins.brightness.setKeepScreenOn(value);
            };
        },
        /**
         * Text to Speech Function
         * cordova plugin add cordova-plugin-tts
         */
        'textToSpeech': function(prm) {
            // Prepare the caller object
            var object = this;
            object = object || {};

            var message = prm.message;
            var language = prm.language || 'English';
            var speed = prm.speed || 1;

            // Get the proper language value
            var langaugeMapping = {"afrikaans":"af-ZA","amharic":"am-ET","armenian":"hy-AM","azerbaijani":"az-AZ","indonesian":"id-ID","malay":"ms-MY","bengali":"bn-IN","catalan":"ca-ES","chinese":"zh-CN","czech":"cs-CZ","danish":"da-DK","german":"de-DE","english":"en-US","spanish":"es-ES","basque":"eu-ES","filipino":"fil-PH","french":"fr-FR","galician":"gl-ES","georgian":"ka-GE","gujarati":"gu-IN","croatian":"hr-HR","zulu":"zu-ZA","icelandic":"is-IS","italian":"it-IT","javanese":"jv-ID","kannada":"kn-IN","khmer":"km-KH","lao":"lo-LA","latvian":"lv-LV","lithuanian":"lt-LT","hungarian":"hu-HU","malayalam":"ml-IN","marathi":"mr-IN","dutch":"nl-NL","nepali":"ne-NP","norwegian bokmal":"nb-NO","polish":"pl-PL","portuguese":"pt-PT","romanian":"ro-RO","sinhala":"si-LK","slovak":"sk-SK","slovenian":"sl-SI","sundanese":"su-ID","swahili":"sw-TZ","rinnish":"fi-FI","swedish":"sv-SE","tamil":"ta-IN","telugu":"te-IN","vietnamese":"vi-VN","turkish":"tr-TR","urdu":"ur-PK","greek":"el-GR","bulgarian":"bg-BG","russian":"ru-RU","serbian":"sr-RS","ukrainian":"uk-UA","hebrew":"he-IL","arabic":"ar-SA","persian":"fa-IR","hindi":"hi-IN","thai":"th-TH","korean":"ko-KR","japanese":"ja-JP"};

            if (isCordova()) {
                // Let the mobile talk
                TTS
                    .speak({
                        text: message,
                        locale: langaugeMapping[language.trim().toLowerCase()] || 'en-US',
                        rate: speed
                    }, function () {
                        if (prm.callback) {
                            _doAction(prm.callback, AM.update(object, {
                                input: 'Successfull.'
                            }));
                        }
                    }, function (error) {
                        if (prm.errorCallback) {
                            _doAction(prm.errorCallback, AM.update(object, {
                                input: error
                            }));
                        }
                    });
            };
        },
        /**
         * Send mail through smtp
         * https://github.com/CWBudde/cordova-plugin-smtp-client
         */
        'sendMailSMTP': function(prm) {
            var element = this || {};
            var extra = prm['extra'];

            // Only cater for mobile device
            if (!isCordova()) {
                callback(element, prm.errorCallback, 'This function only works in mobile.', extra);
                return false;
            }

            // Check if plugin is included
            if (typeof smtpClient == 'undefined') {
                callback(element, prm.errorCallback, 'SMTP Client plugin was not initialized.', extra);
                return false;
            }

            // Add the attachments
            var attachments = [];
            if (prm["attachments"]) {
                if (!Array.isArray(prm["attachments"])) {
                    attachments.push(prm["attachments"]);
                } else {
                    attachments = prm["attachments"]
                }   
            }

            // Prepare the mail setting
            var mailSettings = {
                emailFrom: prm["emailFrom"] || "",
                emailTo: prm["emailTo"] || "",
                smtp: prm["smtp"] || "",
                smtpUserName: prm["smtpUserName"] || "",
                smtpPassword: prm["smtpPassword"] || "",
                attachments: attachments,
                subject: prm["subject"] || "",
                textBody: prm["body"] || "",
            };
                        
            // Send the mail
            smtpClient.sendMail(mailSettings, 
                function(success) {
                    callback(element, prm.callback, success, extra);
                }, 
                function(error) {
                    callback(element, prm.errorCallback, error, extra);
                }
            );

            return true;
        }
    }, 'Devices');

    // Backbutton Event
    var _backKeyEv = [];
    function _backKeyDown() {
        for (var i = 0; i < _backKeyEv.length; i++) {
            _backKeyEv[i]();
        }
    }

    // On Resume Event
    var eventOnResumeList = [];
    function eventOnResume() {
        setTimeout(function() {
            for (var i = 0; i < eventOnResumeList.length; i++) {
                eventOnResumeList[i]();
            }
        }, 0);
    }

    on('ready', function() {
        if (isCordova()) {
            document.addEventListener("backbutton", _backKeyDown, false);
            document.addEventListener('resume', eventOnResume, false);
        }
    });

    // Prepare some variables being globally used
    var laravelEcho = [];

    registerFunction({
        /**
         * Disable the back button for android
         */
        'onBackButton': function(prm) {
            _backKeyEv = [];
            _backKeyEv.push(function() {
                _doAction(prm.callback);
            });
        },
        'exitApp': function(prm) {
            navigator.app.exitApp();
        },

        'statusBarShow': function(prm) {
            if (typeof StatusBar !== 'undefined') {
                StatusBar.show();
                return true;
            }
            return false;
        },
        'statusBarHide': function(prm) {
            if (typeof StatusBar !== 'undefined') {
                StatusBar.hide();
                return true;
            }
            return false;
        },

        'deviceId': function(prm) {
            if (typeof device !== 'undefined') {
                return device.uuid;
            }
            return false;
        },
        'deviceName': function(prm) {
            if (typeof device !== 'undefined') {
                return device.model;
            }
            return false;
        },
        'deviceSerial': function(prm) {
            if (typeof device !== 'undefined') {
                return device.serial;
            }
            return false;
        },
        'deviceOS': function(prm) {
            if (typeof device !== 'undefined') {
                return device.platform;
            }
            return false;
        },
        'deviceOSVersion': function(prm) {
            if (typeof device !== 'undefined') {
                return device.version;
            }
            return false;
        },
        'deviceManufacturer': function(prm) {
            if (typeof device !== 'undefined') {
                return device.manufacturer;
            }
            return false;
        },
        'deviceHasTouchSensor': function(prm) {
            var object = this;
            object = object || {};
            if (window.plugins) {
                window.plugins.touchid.isAvailable(function() {
                    if (prm.callback) {
                        _doAction(prm.callback, AM.update(object, {
                            input: 'Touch Sensor Active'
                        }));
                    }
                }, function(error) {
                    if (prm.errorCallback) {
                        _doAction(prm.errorCallback, AM.update(object, {
                            input: 'No Touch Sensor / Inactive'
                        }));
                    }
                });
            }
        },
        'deviceAddTouchSensor': function(prm) {
            var object = this;
            object = object || {};
            if (window.plugins) {
                window.plugins.touchid.save(prm.key, prm.password, function() {
                    if (prm.callback) {
                        _doAction(prm.callback, AM.update(object, {
                            input: 'Touch Sensor Key Added'
                        }));
                    }
                });
            }
        },
        'deviceRemoveTouchSensor': function(prm) {
            var object = this;
            object = object || {};
            if (window.plugins) {
                window.plugins.touchid.delete(prm.key, function() {
                    if (prm.callback) {
                        _doAction(prm.callback, AM.update(object, {
                            input: 'Touch Sensor Key Deleted'
                        }));
                    }
                });
            }
        },
        'deviceVerifyTouchSensor': function(prm) {
            var object = this;
            object = object || {};
            if (window.plugins) {
                window.plugins.touchid.verify(prm.key, prm.message, function(password) {
                    _doAction(prm.callback, AM.update(object, {
                        input: password
                    }));
                });
            }
        },
        'startStream': function(prm) {
            var comp = _getComponent(prm);
            if (comp) {
                return true
            }
            return false
        },
        'stopStream': function(prm) {
            var comp = _getComponent(prm);
            if (comp) {
                return true
            }
            return false
        },
        /**
         * Socket/TCP functions
         */
        'socketConnect': function(prm) {
            // Prepare the caller object
            var object = this;
            object = object || {};
            
            // Check the type passed
            if (prm.type == 'laravel-echo') {
                // Laravel echo
                var name = prm.name || 'default';
                var url = prm.host + (prm.port ? ':' + prm.port : '');
                var auth = (prm.authorization ? {headers: {Authorization: prm.authorization}} : '');
                
                // Check if already existing
                if (laravelEcho[name]) {
                    callback(object, prm.errorCallback, 'Connection exist.', null);
                    return;
                }

                // Generate the connection
                laravelEcho[name] = new Echo({
                    broadcaster: 'socket.io', 
                    host: url,
                    auth: auth,
                    transports: ['websocket', 'polling']
                });
                
                // Success
                callback(object, prm.callback, 'Connected.', null);
                return;
            }

            // Only if mobile app
            if (isCordova()) {
                // Connect to the socket
                socket.open(
                    prm.host,
                    prm.port,
                    function() {
                        callback(object, prm.callback, 'Connected.', null);
                    },
                    function(error) {
                        callback(object, prm.errorCallback, error, null);
                    });
            }
        },
        'socketDisconnect': function(prm) {
            // Prepare the caller object
            var object = this;
            object = object || {};
            
            // Check the type passed
            if (prm.type == 'laravel-echo') {
                // Laravel echo
                var name = prm.name || 'default';

                // Check if not existing
                if (!laravelEcho[name]) {
                    callback(object, prm.errorCallback, 'Connection does not exist.', null);
                    return;
                }
                
                // Drop the connection
                laravelEcho[name].disconnect();
                delete laravelEcho[name];
                
                // Success
                if (prm.callback) {
                    callback(object, prm.callback, 'Disconnected.', null);
                }
                return;
            }

            // Only if mobile app
            if (isCordova()) {
                // Disconnect to the socket
                socket.close(
                    function() {
                        callback(object, prm.callback, 'Disconnected.', null);
                    },
                    function(error) {
                        callback(object, prm.errorCallback, error, null);
                    });
            } 
        },
        'socketListener': function(prm) {
            // Prepare the caller object
            var object = this;
            object = object || {};
            
            // Check the type passed
            if (prm.type == 'laravel-echo') {
                // Laravel echo
                var name = prm.name || 'default';
                var channelType = prm.channelType || 'channel';
                var channel = prm.channel || 'default';
                var event = prm.event;

                // Make sure there is event to listen to
                if (!event) {
                    callback(object, prm.errorCallback, 'No event to listen to.', null);
                    return;
                }

                // Check if not existing
                if (!laravelEcho[name]) {
                    callback(object, prm.errorCallback, 'Connection does not exist.', null);
                    return;
                }
                
                // Create the listener
                if (channelType == 'channel') {
                    laravelEcho[name].channel(channel)
                        .listen(event, (data) => {
                            callback(object, prm.callback, data, null);
                        });
                } else if (channelType == 'private') {
                    laravelEcho[name].private(channel)
                        .listen(event, (data) => {
                            callback(object, prm.callback, data, null);
                        });
                } else if (channelType == 'presence') {
                    laravelEcho[name].join(channel)
                        .listen(event, (data) => {
                            callback(object, prm.callback, data, null);
                        });
                }
                return;
            }

            // Only if mobile app
            if (isCordova()) {
                // Enable the listener
                socket.onData = function(data) {
                    // Convert the array to string
                    var string = new TextDecoder('utf-8').decode(data);
                    callback(object, prm.callback, string, null);
                };
            } 
        },
        'socketLeave': function(prm) {
            // Prepare the caller object
            var object = this;
            object = object || {};
            
            // Check the type passed
            if (prm.type == 'laravel-echo') {
                // Laravel echo
                var name = prm.name || 'default';
                var channel = prm.channel || 'default';

                // Check if not existing
                if (!laravelEcho[name]) {
                    callback(object, prm.errorCallback, 'Connection does not exist.', null);
                    return;
                }

                // Leave the channel
                laravelEcho[name].leave(channel);
                
                callback(object, prm.callback, 'Left the channel.', null);
                return;
            }
        },
        'socketSend': function(prm) {
            // Only if mobile app
            if (isCordova()) {
                // Prepare the caller object
                var object = this;
                object = object || {};

                // Convert the data to array
                var dataString = prm.data;
                var data = new Uint8Array(dataString.length);
                for (var i = 0; i < data.length; i++) {
                  data[i] = dataString.charCodeAt(i);
                }

                // Send the data to the socket
                socket.write(
                    data,
                    function() {
                        callback(object, prm.callback, 'Sent.', null);
                    },
                    function(error) {
                        callback(object, prm.errorCallback, error, null);
                    });
            }
        }
    }, 'Devices');

    /* source:addons/nfc.js */

    /**
     * NFC Component
     */
    var TNFCreader = TComponent.extend({
        _listening: false,
        _listener: null,
        receiveTag: 'id',
        autoStop: false,
        load: function(o) {
            this.parent(o);
            var attr = o.attr;
            this.receiveTag = attr.receiveTag || 'id';
            this.autoStop = attr.autoStop || false;
        },
        // Start the listeners
        start: function(receiveHandler, callback, errorCallback) {
            this.receiveTag = this.attr.receiveTag || this.receiveTag;
            this.autoStop = this.attr.autoStop || this.autoStop;

            var self = this;
            // Make sure it's not listening
            self.stop();
            if (!self._listening) {
                // Check if nfc is defined
                if (typeof(nfc) == 'undefined' || !nfc) {
                    errorCallback('NFC Plugin does not exist.');
                    self.stop();
                    return false;
                }

                // Prepare the events
                var listener = this._listener = function(event) {
                    var tag = event.tag;
                    var data = '';
                    // Check if the data requested is id or message
                    if (self.receiveTag == 'message') {
                        data = ndef.textHelper.decodePayload(tag.ndefMessage[0].payload);
                    } else {
                        data = nfc.bytesToHexString(tag.id || tag.serialid);
                    }
                    // Pass back the data to the handler
                    receiveHandler(data);
                    // Stop if needed
                    if (self.autoStop) {
                        self.stop();
                    }
                }
                var success = function(data) {
                    self._listening = true;
                    callback(data);
                }
                var error = function(data) {
                    self.stop();
                    errorCallback(data);
                }

                if (cordova.platformId === 'ios') {
                    if (this.receiveTag === 'id') {
                        nfc.scanTag().then(function(tag){
                            listener({ tag: tag });
                        }, error);
                    } else {
                        nfc.scanNdef().then(function(tag){
                            listener({ tag: tag });
                        }, error);
                    }
                } else {
                    // Prepare the listeners
                    if (this.receiveTag === 'id') {
                        nfc.addTagDiscoveredListener(listener, success, error);
                    } else {
                        nfc.addNdefListener(listener, success, error);
                    }
                }
            }
        },
        // Stop the listeners
        stop: function(callback, errorCallback) {
            this.receiveTag = this.attr.receiveTag || this.receiveTag;
            this.autoStop = this.attr.autoStop || this.autoStop;

            if (cordova.platformId === 'ios') {
                nfc.cancelScan().then(callback, errorCallback);
            } else {
                if (this.receiveTag === 'id') {
                    nfc.removeTagDiscoveredListener(this._listener, callback, errorCallback);
                } else {
                    nfc.removeNdefListener(this._listener, callback, errorCallback);
                }
            }
            this._listening = false;
        }
    });
    registerComponent(TNFCreader, 'TNFCreader', TComponent);

    registerFunction({
        'nfcStartRead': function(prm) {
            // Prepare the callback
            var ebd = this;
            var receiveHandler = function(data) { callback(ebd, prm.receiveHandler, data); }
            var cba = function(data) { callback(ebd, prm.callback, data); }
            var ecba = function(data) { callback(ebd, prm.errorCallback, data); }
            
            // Make sure nfc component name is passed
            if (!prm['nfc']) {
                ecba('NFC service not provided');
                return false;
            }
            
            // Make sure nfc component exists
            var cmp = _Scope.componentByName(prm['nfc']);
            if (!cmp) {
                ecba('NFC component does not exists');
                return false;
            }

            cmp.start(receiveHandler, cba, ecba);
            return true;
        },
        // Write data to a nfc, this is reliant to nfcStartRead
        'nfcWrite': function(prm) {
            // Prepare the callback
            var ebd = this;
            var cba = function(data) { callback(ebd, prm.callback, data); }
            var ecba = function(data) { callback(ebd, prm.errorCallback, data); }

            // Check if nfc is defined
            if (typeof(nfc) == 'undefined' || !nfc) {
                ecba('NFC Plugin does not exist.');
                return false;
            }

            // Write to the nfc
            var message = [
                ndef.textRecord(prm['message'])
            ];
            nfc.write(message, cba, ecba);
            return true;
        },
        'nfcStopRead': function(prm) {
            // Prepare the callback
            var ebd = this;
            var cba = function(data) { callback(ebd, prm.callback, data); }
            var ecba = function(data) { callback(ebd, prm.errorCallback, data); }

            // Make sure nfc component name is passed
            if (!prm['nfc']) {
                ecba('NFC service not provided');
                return false;
            }
            
            // Make sure nfc component exists
            var cmp = _Scope.componentByName(prm['nfc']);
            if (!cmp) {
                ecba('NFC component does not exists');
                return false;
            }

            // Check if nfc is defined
            if (typeof(nfc) == 'undefined' || !nfc) {
                ecba('NFC Plugin does not exist.');
                return false;
            }

            cmp.stop(cba, ecba);
            return true;
        }
    }, 'App');

    /* source:addons/signature.js */


    //simplify.min.js
    function getSqDist(r, t) {
        var e = r[0] - t[0],
            i = r[1] - t[1];
        return e * e + i * i
    }

    function simplifyRadialDist(r, t) {
        if (r.length <= 1) return r;
        t = "number" == typeof t ? t : 1;
        for (var e, i = t * t, n = r[0], u = [n], f = 1, s = r.length; s > f; f++) e = r[f], getSqDist(e, n) > i && (u.push(e), n = e);
        return n !== e && u.push(e), u
    }

    function getSqSegDist(r, t, e) {
        var i = t[0],
            n = t[1],
            u = e[0] - i,
            f = e[1] - n;
        if (0 !== u || 0 !== f) {
            var s = ((r[0] - i) * u + (r[1] - n) * f) / (u * u + f * f);
            s > 1 ? (i = e[0], n = e[1]) : s > 0 && (i += u * s, n += f * s)
        }
        return u = r[0] - i, f = r[1] - n, u * u + f * f
    }

    function simplifyDouglasPeucker(r, t) {
        if (r.length <= 1) return r;
        t = "number" == typeof t ? t : 1;
        var e, i, n, u, f = t * t,
            s = r.length,
            o = "undefined" != typeof Uint8Array ? Uint8Array : Array,
            p = new o(s),
            a = 0,
            l = s - 1,
            g = [],
            y = [];
        for (p[a] = p[l] = 1; l;) {
            for (i = 0, e = a + 1; l > e; e++) n = getSqSegDist(r[e], r[a], r[l]), n > i && (u = e, i = n);
            i > f && (p[u] = 1, g.push(a, u, u, l)), l = g.pop(), a = g.pop()
        }
        for (e = 0; s > e; e++) p[e] && y.push(r[e]);
        return y
    }

    function simplify(r, t) {
        return r = simplifyRadialDist(r, t), r = simplifyDouglasPeucker(r, t)
    }

    /**
     * Signature + Canvas
     * Functions for the signature component
     * 
     * @param t - div element, holder of the canvas element
     * @param n - {} - draw canvas style
     * @param e - {} - canvas style
     * @param o - canvas element
     */
    var vctx;
    function amSignature(t, n, e, o) {
        function i(t, n) {
            t = t || {};
            for (var e in n) t[e] = n[e];
            return t
        }

        function r(t) {
            E = i(E, t);
            for (var n in E) N.style[n] = E[n]
        }

        function a(t) {
            P = i(P, t);
	    signatureResizeCanvas();
        }

        function c() {
            O.clearRect(0, 0, N.width, N.height)
        }

        function f() {
            if (k.length == 0 && (!P.withImage)) {
                c();
            }
            var t = k;
            vctx = O, t = t || [], vctx.beginPath(), vctx.lineJoin = P.lineJoin, vctx.lineCap = P.lineCap, vctx.strokeStyle = P.strokeStyle;
            for (var n = 0; n < t.length; n++)
                for (var e = t[n], o = 0; o < e.length; o++) {
                    var i = e[o];
                    0 == o ? vctx.moveTo(i[0], i[1]) : vctx.lineTo(i[0], i[1])
                }
            vctx.lineWidth = P.lineWidth, vctx.stroke()
        }

        function s(t) {
            k = t, f()
        }

        function u(t) {
            s(JSON.parse(t))
        }

        function d() {
            k = [], f()
        }

        function l() {
            return k
        }

        function v() {
            return JSON.stringify(l())
        }

        function h() {
            return !!("ontouchstart" in window) || !!("onmsgesturechange" in window) && !!window.navigator.maxTouchPoints
        }

        function g(t, n) {
            P.readOnly || (C = new Array, C = [t], k.push(C), x(n), n.srcElement.parentElement.value = 'data')
        }

        function y(t, n) {
            P.readOnly || (C.push(t), f(), x(n))
        }

        function p(t, n) {
            P.readOnly || (C = [], f(), P.onChange && P.onChange.apply(S, [n]), x(n))
        }

        function x(t) {
            t.stopPropagation ? t.stopPropagation() : t.cancelBubble = !0, t.preventDefault()
        }

        function w(t, n) {
            var xPos = 0;
            var yPos = 0;
            var el = t.target;
             
            // **
            // Used getBoundingClientRect function instead of going through the related elements
            // Did not remove yet as it's not fully tested if the function mentioned above
            // have no issue
            // **
            // while (el) {
            //     if (el.tagName == "BODY") {
            //         // Deal with browser quirks with body/window/document and page scroll
            //         var xScroll = el.scrollLeft || document.documentElement.scrollLeft;
            //         var yScroll = el.scrollTop || document.documentElement.scrollTop;
                 
            //         xPos += (el.offsetLeft - xScroll + el.clientLeft);
            //         yPos += (el.offsetTop - yScroll + el.clientTop);
            //     } else {
            //         // For all other non-BODY elements
            //         xPos += (el.offsetLeft - el.scrollLeft + el.clientLeft);
            //         yPos += (el.offsetTop - el.scrollTop + el.clientTop);
            //     }
            //     el = el.offsetParent;
            // }

           var client = el.getBoundingClientRect();
           xPos = client.x;
           yPos = client.y;

            return {
                x: n.clientX - xPos,
                y: n.clientY - yPos
            };
        }

        function m(t) {
            if (window.simplify) {
                k = k || [];
                for (var n = 0; n < k.length; n++) k[n] = simplify(k[n], t);
                return f(), v()
            }
            return !1
        }

        function L() {
            var t = '<svg height="' + N.height + '" width="' + N.width + '">\n';
            t += '<path d="';
            for (var n = 0; n < k.length; n++)
                for (var e = k[n], o = 0; o < e.length; o++) {
                    var i = e[o];
                    t += 0 == o ? "M" + i[0] + " " + i[1] + " " : "L" + i[0] + " " + i[1] + " "
                }
            return t += '" stroke="' + P.strokeStyle + '" stroke-width="' + P.lineWidth + '" fill="none" />\n', t += "</svg>\n"
        }
        n = n || {}, e = e || {};

        // Display the canvas existing data
        function displayImage() {
            // Display the image
            var ctx = N.getContext("2d");
            var image = new Image();
            image.onload = function() {
                ctx.drawImage(image, 0, 0);
            };
            image.src = P.image;
        }

        // Resize the canvas based on the parent element 
        function signatureResizeCanvas() {
            // Set a timer to make sure the dom is already loaded
            setTimeout(function() {
                // Use jquery to simplify the calculation
                N.width = $(t).width();
                N.height = $(t).height();

                // Redisplay the image as well
                displayImage();

                // Display existing data too
                f(O, k)
            }, 400);
        }

        var S,
            E = {
                width: "100%",
                minHeight: "30px",
                cursor: "pointer",
                height: "100%"
            },
            P = {
                readOnly: !1,
                lineWidth: 2,
                lineJoin: "round",
                lineCap: "round",
                strokeStyle: "#000",
                withImage: !1,
                image: ""
            },
            k = [],
            C = [],
            N = o || document.createElement("canvas"),
            O = N.getContext("2d");

        return O.translate(.5, .5), // Move the positioning in the canvas
            t.appendChild(N), // Append the canvas to the main element (div)
            r(e), // Include the additional style to be applied for this canvas
            a(n), // Prepare the drawing style for the canvas
            // Prepare the event listener for the canvas
            (h() ? 
                (window.navigator.msPointerEnabled ? 
                    (N.addEventListener("MSPointerDown", function(t) {
                        x(t);
                        var n = w(t, t);
                        g([n.x, n.y], t)
                    }), N.addEventListener("MSPointerMove", function(t) {
                        x(t);
                        var n = w(t, t);
                        y([n.x, n.y], t)
                    }), N.addEventListener("MSPointerUp", function(t) {
                        x(t);
                        var n = w(t, t);
                        p([n.x, n.y], t)
                    })) 
                    : 
                    (N.addEventListener("touchstart", function(t) {
                        x(t);
                        var n = t.touches[0],
                            e = w(t, n);
                        g([e.x, e.y], t)
                    }), N.addEventListener("touchmove", function(t) {
                        x(t);
                        var n = t.touches[0],
                            e = w(t, n);
                        y([e.x, e.y], t)
                    }), N.addEventListener("touchend", function(t) {
                        x(t);
                        var n = t.touches[0];
                        if (n) {
                            var e = w(t, n);
                            p([e.x, e.y], t)
                        } else {
                            var n = w(t, t);
                            p([n.x, n.y], t)
                        }
                    }))
                ) 
                : 
                (N.addEventListener("mousedown", function(t) {
                    var n = w(t, t);
                    g([n.x, n.y], t)
                }), N.addEventListener("mousemove", function(t) {
                    var n = w(t, t);
                    y([n.x, n.y], t)
                }), N.addEventListener("mouseup", function(t) {
                    var n = w(t, t);
                    p([n.x, n.y], t)
                }))
            ),   
            // Resize event listener for the windows
            window.addEventListener("resize", function() {
                signatureResizeCanvas()
            }), 
            signatureResizeCanvas(), // Update the size of the canvas
            c(), // Clear the canvas content
            S = {
                canvas: N,
                context: O,
                clear: c,
                draw: f,
                load: s,
                setParam: a,
                setStyle: r,
                getData: l,
                clearData: d,
                toString: v,
                fromString: u,
                displayImage: displayImage,
                simplify: m,
                toSVG: L,
                signatureResizeCanvas: signatureResizeCanvas
             }
    }

    /**
     * Signature Component
     */
    var TSignature = TVisualComponent.extend({
        _tag: 'div',
        _enabled: true,
        getEl: function() {
            var cel = this._el;
            if (!cel.canvas) {
                cel.canvas = document.createElement('canvas');
                AM.ACN(cel, cel.canvas);
                cel.sig = amSignature(cel, {}, {}, cel.canvas);
                cel.value = '';
            }
            return cel;
        },
        setAttr: function(attr, w) {
            this.parent(attr, w);
            var cel = this.getEl();
            if (attr.hasOwnProperty('value')) {
                this._onDataValue(attr['value']);
            }
            if (attr.hasOwnProperty('readOnly')) {
                cel.sig.setParam({
                    readOnly: (attr['readOnly'] == true)
                });
            }
            if (attr.hasOwnProperty('lineWidth')) {
                cel.sig.setParam({
                    lineWidth: parseInt(attr['lineWidth'])
                });
            }
            if (attr.hasOwnProperty('lineColor')) {
                cel.sig.setParam({
                    strokeStyle: attr['lineColor']
                });
            }
        },
        _onDataValue: function(v) {
            var cel = this.getEl();
            // Check if it's a base64
            if (v.indexOf("base64") !== -1) {
                // Set value
                this._el.value = 'data';
                // Update the with image properties
                cel.sig.setParam({
                    withImage: true,
                    image: v
                });
            } else {
                // Check if the value is clear
                if (v = '[]') {
                    this._el.value = '';
                    cel.sig.setParam({
                        withImage: false,
                        image: ""
                    });
                }
                cel.sig.fromString(v);
            }
        },
        setEvent: function(ev) {
            this.parent(ev);
            var self = this;
            var cel = self.getEl();
            if (ev.change) {
                cel.sig.setParam({
                    onChange: function(e) {
                        self.doAction(ev.change, self);
                    }
                });
            }
        },
        toString: function() {
            return this.getEl().sig.simplify(0);
        },
        redraw: function() {
            return this.getEl().sig.signatureResizeCanvas();
        }
    });

    registerComponent(TSignature, 'TSignature', TVisualComponent);

    /**
     * Google Map
     * Functions for Google Map
     */
    var _mapReady,
        _onMapReady = [],
        _mapApiLoading,
        directionsService;

    function mapInit() {
        _mapReady = true;
        directionsService = new google.maps.DirectionsService();
        while (_onMapReady.length) {
            var cb = _onMapReady.shift(0);
            cb();
        }
    }

    function mapDo(cb) {
        if (_mapReady) {
            cb();
        } else {
            _onMapReady.push(cb);
            loadGoogleMapApi();
        }
    }

    function loadGoogleMapApi() {
        if (_mapApiLoading) {
            return;
        }
        _mapApiLoading = true;
        var head = document.getElementsByTagName('head')[0];
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://maps.googleapis.com/maps/api/js?key=' + gGoogleAPIKey + '&libraries=places&callback=' + (emobiqApp ? 'emobiqApp.' : '') + 'mapInit';
        head.appendChild(script);
    }

    var TGoogleMaps = TVisualComponent.extend({
        _tag: 'div',
        _map: null,
        _markers: [],
        _infoWindow: null,
        _mapOptions: null,
        zoom: 10,
        latLng: '',
        title: '',
        showRouteMarkers: false,
        _mapReady: false,
        _onMapReady: [],
        _directionsDisplay: null,
        toLatLng: function(s) {
            if (s) {
                if (typeof s == 'string') {
                    var sll = s.split(',');
                    return {
                        lat: parseFloat(sll[0]),
                        lng: parseFloat(sll[1])
                    }
                }
                return s;
            }
            return {
                lat: 1.355310,
                lng: 103.867760
            }; //rasuna office park
        },
        mapDo: function(cb) {
            var self = this;
            if (self._mapReady) {
                cb();
            } else {
                self._onMapReady.push(cb);
            }
        },
        showMap: function(done) {
            var self = this;
            var tio;

            function loadMap() {
                tio = setTimeout(function() {
                    if (self._el) {
                        self._mapPlace = true;
                        self._map = new google.maps.Map(self._el, {
                            center: {
                                lat: 1.355310,
                                lng: 103.867760
                            },
                            zoom: parseInt(self.zoom || 10),
                            disableDefaultUI: true,
                            zoomControl: (self.attr.zoomControl == undefined ? true : self.attr.zoomControl),
                            mapTypeControl: (self.attr.mapTypeControl == undefined ? true : self.attr.mapTypeControl),
                            streetViewControl: (self.attr.streetViewControl == undefined ? true : self.attr.streetViewControl),
                            fullscreenControl: (self.attr.fullscreenControl == undefined ? true : self.attr.fullscreenControl)
                        });
                        if (self.showRouteMarkers) {
                            self._directionsDisplay = new google.maps.DirectionsRenderer();
                        } else {
                            self._directionsDisplay = new google.maps.DirectionsRenderer({
                                suppressMarkers: true
                            });
                        }
                        self._directionsDisplay.setMap(self._map);
                        while (self._onMapReady.length) {
                            var cb = self._onMapReady.shift(0);
                            cb();
                        }
                        self._mapReady = true;
                    }
                }, 10);
            }
            var ll = self.toLatLng(this.latLng);
            if (!this._map) {
                mapDo(function() {
                    loadMap();
                });
            }
        },
        getMap: function() {
            this.showMap();
        },
        _onDataValue: function(v) {
            this.setAttr({
                latLng: v
            });
        },
        setAttr: function(attr, w) {
            if (!this._map) {
                this.showMap();
            }
            this.parent(attr, w);
            var sttr = 'latLng,title,zoom,showRouteMarkers'.split(',');
            var self = this;
            for (var i in attr) {
                if (AM.isIn(i, sttr)) {
                    this[i] = attr[i];
                }
            }
            self.setCenter(self.latLng);
            self.setZoom(self.zoom);
        },
        setCenter: function(s) {
            var self = this;
            self.mapDo(function() {
                if (self._map) {
                    self._map.setCenter(self.toLatLng(s));
                }
            });
        },
        setZoom: function(s) {
            var self = this;
            self.mapDo(function() {
                if (self._map) {
                    self._map.setZoom(parseInt(s));
                }
            });
        },
        fitBounds: function(bounds) {
            var self = this;
            self.mapDo(function() {
                if (self._map) {
                    self._map.fitBounds(bounds);
                }
            });
        },
        addMarker: function(component, prm) {
            var self = this;
            self.mapDo(function() {
                var pos = self.toLatLng(prm['latLng']);
                if (self._map) {
                    // Prepare the parameters for the label
                    var label = "";
                    // Check if there was a label value passed
                    if (prm.label) {
                        label = {
                            text: prm['label'],
                            color: prm['labelColor'],
                            fontFamily: prm['labelFontFamily'],
                            fontSize: (prm['labelFontSize'] ? prm['labelFontSize'] + 'px' : ''),
                            fontWeight: prm['labelFontWeight']
                        };
                    }
                    
                    // Prepare the parameters for the marker
                    var properties = {
                        position: pos,
                        map: self._map,
                        label: label
                    }

                    // Check if there is a specific icon given
                    if (prm['icon']) {
                        properties.icon = convertImageURL(prm['icon']);
                    }

                    // Create the marker
                    var marker = new google.maps.Marker(properties);

                    // Add a listener
                    marker.addListener('click', function() {
                        // Make sure there is a callback event
                        if (prm['clickEvent']) {
                            _doAction(prm['clickEvent'], AM.update(component, {
                                input: prm['data']
                            }));
                        }
                        // Check if there is any information passed
                        if (prm['information']) {
                            // Create the info window object
                            var infowindow = new google.maps.InfoWindow({
                                content: prm['information']
                            });
                            // Display the info window upon clicking
                            infowindow.open(self._map, marker);
                        }
                    });

                    marker._eid = prm['id'] || '';

                    // Display the marker
                    self._markers.push(marker);
                }
            });
        },
        deleteMarker: function(id) {
            var self = this;
            self.mapDo(function() {
                if (self._map) {
                    var ms=self._markers.reduce(function(a,v,k){if(v._eid==id) a.push(k); return a;},[]);
                    while (ms.length) {
                        self._markers.splice(ms.pop(),1)[0].setMap(null);
                    }
                }
            });
        },
        clearMarker: function() {
            var self = this;
            self.mapDo(function() {
                if (self._map) {
                    while (self._markers.length) {
                        self._markers.pop().setMap(null);
                    }
                }
            });
        },
        setAutoComplete:function(inp,cb){
            var self = this;
            self.mapDo(function() {
                if (self._map) {
                    console.log('setAutoComplete inp2===>',inp);
                    var autocomplete = new google.maps.places.Autocomplete(inp);
                    autocomplete.bindTo('bounds', self._map);
                    autocomplete.addListener('place_changed', function() {
                        var place=autocomplete.getPlace();
                        if (!place.geometry) return;
                        if(cb) cb(place);
                        //if (!place.geometry){
                        //    return;
                        //}
                        console.log('place==>',place);
                    });
                }
            });
        },
        route: function(Start, End, waypoints, mode) {
            mode = mode || 'DRIVING'; //DRIVING,WALKING,BICYCLING,TRANSIT
            var self = this;
            self.mapDo(function() {
                if (self._map && self._directionsDisplay) {
                    var start = self.toLatLng(Start);
                    var end = self.toLatLng(End);
                    var request = {
                        origin: start,
                        destination: end,
                        waypoints: waypoints,
                        travelMode: mode
                    };
                    directionsService.route(request, function(result, status) {
                        if (status == 'OK') {
                            // Clear the previous data first
                            self._directionsDisplay.set('directions', null);
                            self._directionsDisplay.setDirections(result);
                        }
                    });
                }
            });
        }
    });
    registerComponent(TGoogleMaps, 'TGoogleMaps', TVisualComponent);

    registerFunction({
        'mapSetCenter': function(prm) {
            var comp = _getComponent(prm);
            if (comp && prm['latLng']) {
                return comp.setCenter(prm['latLng']);
            }
            return false;
        },
        'mapSetZoom': function(prm) {
            var comp = _getComponent(prm);
            if (comp && prm['zoom']) {
                return comp.setZoom(prm['zoom']);
            }
            return false;
        },
        'mapFitBounds': function(prm) {
            var comp = _getComponent(prm);
            if (comp && prm['bounds']) {
                return comp.fitBounds(prm['bounds']);
            }
            return false;
        },
        'mapAddMarker': function(prm) {
            var comp = _getComponent(prm);
            if (comp && prm['latLng']) {
                return comp.addMarker(this, prm);
            }
            return false;
        },
        'mapDeleteMarker':function(prm){
            var comp = _getComponent(prm);
            if (comp && prm['id']) {
                return comp.deleteMarker(prm['id']||'');
            }
            return false;
        },
        'mapClearMarker': function(prm) {
            var comp = _getComponent(prm);
            if (comp) {
                return comp.clearMarker();
            }
            return false;
        },
        'mapRoute': function(prm) {
            var comp = _getComponent(prm);

            if (comp && prm['startLatLng'] && prm['endLatLng']) {
                var mode = prm['mode'] || 'DRIVING';

                // Store the waypoints
                var waypoints = [];
                if (prm['waypoints']) {
                    for (var i = 0; i < prm['waypoints'].length; i++) {
                        waypoints.push({
                            location: prm['waypoints'][i]
                        });
                    }
                }

                return comp.route(prm['startLatLng'], prm['endLatLng'], waypoints, mode.toUpperCase());
            }
            return false;
        },
        'placeAutocomplete':function(prm){
            var comp = _getComponent(prm);
            var inp=_Scope.componentByName(prm['inputName']);
            console.log('inp1===>',inp);
            if (comp && inp) {
                console.log('inp2===>',inp);
                console.log('inp2===>',inp._el);
                
                var cb = function(place) {
                    if (prm.onClick){
                        _doAction(prm.onClick, AM.update(this||{}, {
                            input: place
                        }));
                    }
                };
                return comp.setAutoComplete(inp._el,prm.onClick && cb);
            }
            return false;
        },
        'mapSetClickListener': function(prm) {
            var comp = _getComponent(prm);
            var self = this
            if (comp && comp._map && prm['callback'] ) {
                google.maps.event.clearListeners(comp._map, 'click');
                google.maps.event.addListener(comp._map, 'click', function (e) {
                    callback(self, prm['callback'], {lat: e.latLng.lat(), lng: e.latLng.lng()}, prm['extra']);        
                });
                return true
            }
            return false;
        },
        'mapRemoveClickListener': function(prm) {
            var comp = _getComponent(prm);
            if (comp) {
                google.maps.event.clearListeners(comp._map, 'click');
            }
            return true;
        },
        'mapGetZoom': function(prm) {
            var comp = _getComponent(prm);
            if (comp) {
                return comp._map.getZoom()
            }
            return false;
        },
    }, 'Google');


    /* source:addons/rle.js */


    var RLE = {
        strHexToArray: function(s) {
            var a = [];
            (s.split(' ')).forEach(function(v) {
                a.push(parseInt(v, 16))
            });
            return a;
        },
        fillArray: function(v, r) {
            var a = [];
            for (var i = 0; i < r; i++) {
                a.push(v)
            };
            return a;
        },
        decode: function(d) {
            var a = [];
            while (d.length) {
                if (d[0] <= 127) {
                    var c = d.splice(0, 1)[0];
                    var v = d.splice(0, c + 1);
                    a.push.apply(a, v);
                } else {
                    var c = (256 - (d.splice(0, 1)[0])) + 1;
                    var v = d.splice(0, 1)[0];
                    a.push.apply(a, RLE.fillArray(v, c));
                }
            }
            return a;
        },
        encode: function(d) {
            var a = [],
                re = false,
                r = {};
            while (d.length) {
                if (d.length && d.length < 2) {
                    a.push(0);
                    a.push(d[0]);
                    d.splice(0, 1);
                    return a;
                }
                re = d[0] == d[1];
                r = {
                    dt: [d[0]],
                    c: 1
                };
                for (var j = 1; j < d.length; j++) {
                    if (re && d[j] == d[j - 1]) {
                        r.c++;
                    } else if (!re && d[j] != d[j - 1]) {
                        if (j + 1 < d.length && d[j] != d[j + 1]) {
                            r.dt.push(d[j]);
                        } else {
                            break;
                        }
                    } else {
                        break;
                    }
                }
                if (re) {
                    a.push(256 + 1 - r.c);
                    a.push(r.dt[0]);
                    d.splice(0, r.c);
                } else {
                    a.push(r.dt.length - 1);
                    a.push.apply(a, r.dt);
                    d.splice(0, r.dt.length);
                }
            }
            return a;
        }
    }

    /* source:addons/expcl.js */


    function uint8a2str(a) {
        return String.fromCharCode.apply(null, a);
    }

    function str2uint8a(str) {
        var buf = new Uint8Array(str.length);
        for (var i = 0, strLen = str.length; i < strLen; i++) {
            buf[i] = str.charCodeAt(i);
        }
        return buf;
    }

    var tag = function(_tg) {
        function _expclf(open, close) {
            return function(m, closetag, prms) {
                if (!closetag) {
                    return uint8a2str(new Uint8Array(open));
                } else {
                    return uint8a2str(new Uint8Array(close));
                }
            }
        }

        var _tag = function() {
            var x = {};
            for (var i in _tg) {
                x[i] = {
                    k: new RegExp('\\[(\\\/?)' + i + '\\s*([\\s\\S]*?)\\s*\\]', 'g'),
                    f: _expclf(_tg[i][0], _tg[i][1])
                }
            }
            return x;
        }();

        _tag['barcode'] = {
            //k:/\[(\/?)barcode\s*([\s\S]*?)\s*\]/g,
            k: /\[barcode\s*([\s\S]*?)\s*\]([\s\S]*)\[\/barcode\s*\]/g,
            f: function(m, prms, s) {
                return uint8a2str(new Uint8Array([27, 90, 49, s.length, 48])) +
                    s +
                    uint8a2str(new Uint8Array([13, 10]));
            }
        }

        return function() {
            var y = function() {
                var y2 = [];
                for (var j in _tag) {
                    y2.push(j);
                }
                return y2.sort(function(a, b) {
                    return b.length - a.length;
                });
            }();
            var tg = {};
            for (var i = 0; i < y.length; i++) {
                tg[y[i]] = _tag[y[i]];
            }
            return tg;
        }();
    }({
        b: [
            [27, 85, 49],
            [27, 85, 48]
        ],
        u: [
            [27, 85, 85],
            [27, 85, 117]
        ],
        big: [
            [14, 28],
            [29, 15]
        ],
        wide: [
            [14],
            [15]
        ],
        high: [
            [28],
            [29]
        ]
    });

    function toExPCL(str) {
        for (var i in tag) {
            str = str.replace(tag[i].k || /$^/, function(m, closetag, prms) {
                return tag[i].f(m, closetag, prms);
            })
        }
        return str;
    }

    registerFunction({
        'BBtoExPCL': function(prm) {
            if (prm['text']) {
                return toExPCL(prm['text']);
            } else {
                return false;
            }
        }
    }, 'Print');

    //'ini [barcode type=1]tes[/barcode] bro'.replace(x||/$^/,function(m,closetag,prms){ if(closetag)return '}'; else return '{';})

    /* source:addons/cpcx.js */


    var pcx = function() {
        //===================

        function strHexToArray(s) {
            var a = [];
            (s.split(' ')).forEach(function(v) {
                a.push(parseInt(v, 16))
            });
            return a;
        }

        var pcxRleMask = 0xC0;
        var pcxPaletteMarker = 0x0C;

        var mStream = function(input) {
            this.input = input;
            this.i = 0;
        }
        mStream.prototype.readByte = function() {
            return this.input[this.i++];
        }
        mStream.prototype.writeByte = function(value) {
            return this.input.push(value);
        }
        mStream.prototype.readWord = function() {
            var x1 = this.input[this.i++];
            var x2 = this.input[this.i++];
            return (x2 << 8) | x1;
        }
        mStream.prototype.writeWord = function(value) {
            var x1 = (value & 0xff00) >> 8;
            var x2 = (value & 0xff);
            this.input.push.apply(this.input, [x2, x1]);
        }
        mStream.prototype.read = function(le) {
            var r = this.input.slice(this.i, this.i + le); //The original array will not be changed
            this.i += le;
            return r;
        }
        mStream.prototype.write = function(value) {
            this.input.push.apply(this.input, value);
        }

        function parseHeader(inp) {
            var h = new mStream(inp);
            return {
                identifier: h.readByte(),
                version: h.readByte(),
                encoding: h.readByte(),
                bitsPerPixel: h.readByte(),
                xStart: h.readWord(),
                yStart: h.readWord(),
                xEnd: h.readWord(),
                yEnd: h.readWord(),
                horzRes: h.readWord(),
                vertRes: h.readWord(),
                palette: h.read(48),
                reserved1: h.readByte(),
                numBitPlanes: h.readByte(),
                bytesPerLine: h.readWord(),
                paletteType: h.readWord(),
                horzScreenSize: h.readWord(),
                vertScreenSize: h.readWord(),
                reserved2: h.read(54)
            }
        }

        function fill(a, v, r) {
            for (var i = 0; i < r; i++) {
                a.push(v);
            }
            return a;
        }

        function writeHeader(o) {
            var a = [];
            var m = new mStream(a);
            m.writeByte(10); //identifier
            m.writeByte(5); //version
            m.writeByte(1); //encoding
            m.writeByte(1); //bitsPerPixel
            m.writeWord(0); //xStart
            m.writeWord(0); //yStart
            m.writeWord((o.width || 576) - 1); //xEnd
            m.writeWord((o.height || 1) - 1); //yEnd
            m.writeWord(75); //horzRes
            m.writeWord(75); //vertRes
            m.write(fill(fill([], 0, 3), 255, 48 - 3)); //palette
            m.writeByte(0); //reserved1
            m.writeByte(1); //numBitPlanes
            m.writeWord(Math.ceil(o.width/8)); //bytesPerLine
            m.writeWord(1); //paletteType
            m.writeWord(0); //horzScreenSize
            m.writeWord(0); //vertScreenSize
            m.write(fill([], 0, 54)); //reserved2
            return a;
        }

        var pcxRleByteReader = function(input) {
            this.m_stream = new mStream(input);
            this.m_count = 0;
            this.m_rleValue = 0;
        }

        pcxRleByteReader.prototype.readByte = function() {
            if (this.m_count > 0) {
                this.m_count--;
                return this.m_rleValue;
            } else {
                var code = this.m_stream.readByte();

                if ((code & pcxRleMask) == pcxRleMask) {
                    this.m_count = (code & (pcxRleMask ^ 0xff));
                    this.m_rleValue = this.m_stream.readByte();

                    this.m_count--;
                    return this.m_rleValue;
                } else {
                    return code;
                }
            }
        }

        var pcxIndexReader = function(reader) {
            this.m_reader = reader;
            this.m_bitsPerPixel = 1;
            this.m_bitMask = 1;
            this.m_bitsRemaining = 0;
            this.m_byteRead = null;
        }
        pcxIndexReader.prototype.readIndex = function() {
            if (this.m_bitsRemaining == 0) {
                this.m_byteRead = this.m_reader.readByte();
                this.m_bitsRemaining = 8;
            }
            var index = (this.m_byteRead >> (8 - this.m_bitsPerPixel)) & this.m_bitMask;
            this.m_byteRead = this.m_byteRead << this.m_bitsPerPixel;
            this.m_bitsRemaining -= this.m_bitsPerPixel;
            return index;
        }

        function readAll(inp, height, width) {
            var reader = new pcxRleByteReader(inp);
            var indexReader = new pcxIndexReader(reader);
            var out = [];
            for (var y = 0; y < height; y++) {
                var outy = [];
                for (var x = 0; x < width; x++) {
                    outy.push(indexReader.readIndex());
                }
                out.push(outy);
            }
            return out;
        }

        var pcxIndexWriter = function(writer) {
            this.m_writer = writer;
            this.m_bitsPerPixel = 1;
            this.m_bitMask = 1;

            this.m_bitsUsed = 0;
            this.m_byteAccumulated = 0;
        }
        pcxIndexWriter.prototype.writeIndex = function(index) {
            this.m_byteAccumulated = (this.m_byteAccumulated << this.m_bitsPerPixel) | (index & this.m_bitMask);
            this.m_bitsUsed += this.m_bitsPerPixel;

            if (this.m_bitsUsed == 8) {
                this.flush();
            }
        }
        pcxIndexWriter.prototype.flush = function() {
            if (this.m_bitsUsed > 0) {
                this.m_writer.writeByte(this.m_byteAccumulated);
                this.m_byteAccumulated = 0;
                this.m_bitsUsed = 0;
            }
        }

        var pcxRleByteWriter = function(output) {
            if (output) {
                if (output instanceof Array) {
                    this.m_stream = new mStream(output);
                } else {
                    this.m_stream = output;
                }
            } else {
                this.m_stream = new mStream();
            }
            this.m_lastValue;
            this.m_count = 0;
        }
        pcxRleByteWriter.prototype.writeByte = function(value) {
            if (this.m_count == 0 || this.m_count == 63 || value != this.m_lastValue) {
                this.flush();
                this.m_lastValue = value;
                this.m_count = 1;
            } else {
                this.m_count++;
            }
        }
        pcxRleByteWriter.prototype.flush = function() {
            if (this.m_count == 0) {
                return;
            } else if ((this.m_count > 1) || ((this.m_count == 1) && ((this.m_lastValue & pcxRleMask) == pcxRleMask))) {
                this.m_stream.writeByte(pcxRleMask | this.m_count);
                this.m_stream.writeByte(this.m_lastValue);
                this.m_count = 0;
            } else {
                this.m_stream.writeByte(this.m_lastValue);
                this.m_count = 0;
            }
        }

        function writeAll(a) {
            var out = [];
            var byteWriter = new pcxRleByteWriter(out);
            var indexWriter = new pcxIndexWriter(byteWriter);
            for (var y = 0; y < a.length; y++) {
                for (var x = 0; x < a[y].length; x++) {
                    indexWriter.writeIndex(a[y][x]);
                }
                indexWriter.flush();
                byteWriter.flush();
            }
            indexWriter.flush();
            byteWriter.flush();
            return out;
        }

        function toStr(a) {
            var s = '';
            for (var x = 0; x < a.length; x++) {
                var sm = String.fromCharCode(a[x]);
                s += sm;
            }
            return s;
        };

        function canvasToPcx(canvas) {
            var out = writeHeader({
                height: canvas.height,
                width: canvas.width
            });
            var byteWriter = new pcxRleByteWriter(out);
            var indexWriter = new pcxIndexWriter(byteWriter);

            var context = canvas.getContext('2d');
            var dt = context.getImageData(0, 0, canvas.width, canvas.height).data;
            var yy = -1;
            for (var i = 0; i < dt.length; i += canvas.width * 4) {
                yy++;
                var xx = -1;
                for (var j = 0; j < canvas.width * 4; j += 4) {
                    xx++;
                    var g = Math.floor((dt[yy * canvas.width * 4 + (xx * 4)] + dt[yy * canvas.width * 4 + (xx * 4) + 1] + dt[yy * canvas.width * 4 + (xx * 4) + 2]) / 3);
                    indexWriter.writeIndex(g < 128 ? 0 : 1);
                }
                indexWriter.flush();
                byteWriter.flush();
            }
            indexWriter.flush();
            byteWriter.flush();
            return toStr(out);
        }

        function save(ou) {
            window.location.href = 'data:image/pcx;base64,' + btoa(ou);
        }

        function toCPCL(ou, width, height, single, copies, blackMark) {
            // Prepare the settings
            var settings = "";

            // Check the black
            if (blackMark) {
                blackMark = "FORM\r\n";
                settings = "! UTILITIES\r\nIN-INCHES\r\nSETFF 12 0\r\nPRINT\r\n";
            } else {
                blackMark = "";
            }

            width = width || 575;

            // Check if single or multiple
            if (single) {
                return settings + "! 0 200 200 " + Math.floor(height) + " " + copies + "\r\nPW " + width + "\r\nTONE 0\r\nSPEED 3\r\nON-FEED IGNORE\r\nNO-PACE\r\nBAR-SENSE\r\nPCX 0 0 " + ou + "\r\n" + blackMark + "PRINT\r\n";
            } else {
                return settings + "! 0 200 200 " + Math.floor(height) + " " + copies + "\r\nPW " + width + "\r\nTONE 0\r\nSPEED 3\r\nON-FEED REPRINT\r\nNO-PACE\r\nBAR-SENSE\r\nPCX 0 0 " + ou + "\r\n" + blackMark + "PRINT\r\n";
            }
        }
        //===================
        return {
            fromCanvas: canvasToPcx,
            toCPCL: function(canvas, single, copies, blackMark) {
                return toCPCL(canvasToPcx(canvas), canvas.width, canvas.height, single, copies, blackMark);
            },
            save: save
        }
    }();

    registerFunction({
        // Canvas Height
        'canvasHeight': function(prm) {
            return prm.canvas.height;
        }
    }, 'App');

    // Prepare the printer
    var _btPrinter = function _btPrinter() {};
    _btPrinter.prototype = {
        'macAddress': [], 
        'chars': '',
        'listPorts': function listPorts(cb, ecb) {
            var self = this;
            bluetoothClassicSerial.list(function (results) {
                var arr = [];
                for (var i = 0; i < results.length; i++) {
                    arr.push(results[i]);
                }
                self.macAddress = arr;
                if (cb) {
                    cb(self.macAddress);
                }
            }, function (error) {
                if (ecb) {
                    ecb(error);
                }
            });
        },
        'isEnabled': function isEnabled(cb, ncb) {
            bluetoothClassicSerial.isEnabled(function () {
                this.listPorts(cb);
            }, function () {
                ncb();
            });
        },
        'openPort': function openPort() {
            var self = this;
            bluetoothClassicSerial.subscribe(self.activeId, function (data) {
                //app.display(data);
            });
        },
        'closePort': function closePort() {
            var self = this;
            if (self.onStatus) {
                self.onStatus("disconnected");
            }
            bluetoothClassicSerial.unsubscribe(self.activeId,function (data) {
                //app.display(data);
            }, function (e) {
                console.log('unsubscribe error', e);
            });
        },
        'onStatus': null,
        'activeId': '',
        'idInMac': function idInMac(id) {
            //macById
            var self = this;
            for (var i in self.macAddress) {
                if (self.macAddress[i].id == id) {
                    return self.macAddress[i];
                }
            }
            return false;
        },
        'activeIdByPlatform': function activeIdByPlatform(ecb){
            var self = this;
            var selectedPrinter = self.idInMac(self.activeId);
            if (!selectedPrinter) {
                ecb('selected printer not found');
                return;
            }
            var iosProtocolString = device.platform == "iOS"?selectedPrinter.protocols[0]:"";
            return device.platform == "iOS"?iosProtocolString:self.activeId;
        },
        'interfaceId':function interfaceId(ecb){
            var self = this;
            var selectedPrinter = self.idInMac(self.activeId);
            if (!selectedPrinter) {
                ecb('selected printer not found');
                return;
            }
            var iosProtocolString = device.platform == "iOS"?selectedPrinter.protocols[0]:"";
            return device.platform == "iOS"?iosProtocolString:"00001101-0000-1000-8000-00805F9B34FB";
        },
        'connect': function connect(cb, ecb) {
            var self = this;
            
            if (self.onStatus) {
                self.onStatus("connecting");
            }
            var interfaceId = self.interfaceId(ecb);
            var activeIdByPlatform = self.activeIdByPlatform(ecb);
            bluetoothClassicSerial.isConnected(activeIdByPlatform, cb,function () {
                bluetoothClassicSerial.connect(self.activeId, interfaceId,function () {
                    if (cb) {
                        cb();
                    }
                    if (self.onStatus) {
                        self.onStatus("connected");
                    }
                    self.openPort();
                }, function (e) {
                    if (self.onStatus) {
                        self.onStatus("connection error");
                    }
                    if (ecb) {
                        ecb(e);
                    }
                });
            });
        },
        'disconnect': function disconnect(timeout, cb, ecb) {
            var self = this;
            if (self.onStatus) {
                self.onStatus("disconnecting");
            }
            
            // Set the timeout
            setTimeout(function() {
                self.closePort(); // stop listening to the port
                var activeIdByPlatform = self.activeIdByPlatform(ecb);
                bluetoothClassicSerial.disconnect(device.platform == "iOS"?[activeIdByPlatform]:self.activeId,function () {
                    if (cb) {
                        cb();
                    }
                    
                }, function (e) {
                    if (self.onStatus) {
                        self.onStatus("disconnection error");
                    }
                    if (ecb) {
                        ecb(e);
                    }
                });
            }, timeout);
        },
        'isConnected': function isConnected(cb, ncb) {
            var self = this;
            var activeIdByPlatform = self.activeIdByPlatform(ncb);
            bluetoothClassicSerial.isConnected(activeIdByPlatform,cb, ncb);
        },
        'print': function print(isi, cb, ecb) {
            var self = this;
            var activeIdByPlatform = self.activeIdByPlatform(ecb);
            bluetoothClassicSerial.write(activeIdByPlatform,isi, function (data) {
                if (cb) {
                    cb();
                }
            }, function (e) {
                // IOS: after screen goes sleep we have to disconnect and connect again 
                if(device.platform == 'iOS' && e=="The communication session for this protocol is not open on the device."){
                    bluetoothClassicSerial.disconnect([activeIdByPlatform],()=>{console.log('Printer diconnect to resolve error.')},ecb);
                    self.connect(()=>{self.print(isi,cb,ecb)},ecb);
                    
                }else if (ecb) {
                    ecb(e);
                }
            });
        }
    };

    var btPrinter=null;
    _onAppReady.push(function(){
        if (isCordova()) {
            if (typeof bluetoothClassicSerial !== 'undefined') {
                btPrinter=new _btPrinter();
            } else {
                // console.log('app AM.ready : bluetoothClassicSerial doesnt exists');
            }
        } else {
            // console.log('app AM.ready : not cordova');
        }
    });

    // Register the functions for the printer
    registerFunction({
        'btPrinterPortList': function btPrinterPortList(prm) {
            if (!btPrinter) {
                var e = 'bluetoothClassicSerial plugins not found';
                console.log('btPrinterPortList error:', e);
                if (prm.errorCallback) {
                    _doAction(prm.errorCallback, AM.update(this || {}, { input: e }));
                }
                return false;
            }
            btPrinter.listPorts(function (dt) {
                console.log('btPrinterPortList success:', dt);
                if (prm.callback) {
                    _doAction(prm.callback, AM.update(this || {}, { input: dt }));
                }
            }, function (e) {
                console.log('btPrinterPortList error:', e);
                if (prm.errorCallback) {
                    _doAction(prm.errorCallback, AM.update(this || {}, { input: e }));
                }
            });
            return true;
        },
        // Connect to the bluetooth printer
        'btPrinterConnect': function btPrinterConnect(prm) {
            var element = this || {};
            var extra = prm['extra'];

            // Only cater for mobile device
            if (!isCordova()) {
                callback(element, prm.errorCallback, 'This function only works in mobile.', extra);
                return false;
            }

            // Check if printer id is passed
            if (!prm['printerId']) {
                callback(element, prm.errorCallback, 'Printer ID is not passed.', extra);
                return false;
            }

            // Set the bluetooth printer id
            btPrinter.activeId = prm['printerId'];

            // Connect now
            btPrinter.connect(function () {
                // If have extra data then include it
                var data = {};
                if (prm['extra']) {
                    data.extra = prm['extra'];
                }
                callback(element, prm.callback, data, extra);
            }, function (error) {
                callback(element, prm.errorCallback, error, extra);
            });
            return true;
        },
        'btPrinterDisconnect': function btPrinterDisconnect(prm) {
            if (!btPrinter) {
                var e = 'bluetoothClassicSerial plugins not found';
                console.log('btPrinterDisconnect error:', e);
                if (prm.errorCallback) {
                    _doAction(prm.errorCallback, AM.update(this || {}, { input: e }));
                }
                return false;
            }
            var timeout = parseInt(prm.timeout) || 5000;
            btPrinter.disconnect(timeout, function () {
                console.log('btPrinterDisconnect success');
                if (prm.callback) {
                    _doAction(prm.callback, this || {});
                }
            }, function (e) {
                console.log('btPrinterDisconnect error:', e);
                if (prm.errorCallback) {
                    _doAction(prm.errorCallback, AM.update(this || {}, { input: e }));
                }
            });
            return true;
        },
        'btPrinterIsConnected': function btPrinterIsConnected(prm) {
            if (!btPrinter) {
                var e = 'bluetoothClassicSerial plugins not found';
                console.log('btPrinterIsConnected error:', e);
                if (prm.noCallback) {
                    _doAction(prm.noCallback, AM.update(this || {}, { input: e }));
                }
                return false;
            }
            btPrinter.isConnected(function () {
                console.log('btPrinterIsConnected : yes');
                if (prm.yesCallback) {
                    _doAction(prm.yesCallback, this || {});
                }
            }, function (e) {
                console.log('btPrinterIsConnected : no');
                if (prm.noCallback) {
                    _doAction(prm.noCallback, this || {});
                }
            });
            return true;
        },
        'btPrinterPrint': function btPrinterPrint(prm) {
            if (!btPrinter) {
                var e = 'bluetoothClassicSerial plugins not found';
                console.log('btPrinterPrint error:', e);
                if (prm.errorCallback) {
                    _doAction(prm.errorCallback, AM.update(this || {}, { input: e }));
                }
                return false;
            }
            if (!prm['text']) {
                var e = 'text parameter not set';
                console.log('btPrinterPrint error:', e);
                if (prm.errorCallback) {
                    _doAction(prm.errorCallback, AM.update(this || {}, { input: e }));
                }
                return false;
            }

            btPrinter.print(
                prm['text'], 
                function () {
                    if (prm.callback) {
                        _doAction(prm.callback, AM.update(this || {}, { input: 'Printed' }));
                    }
                }, 
                function (e) {
                    console.log('btPrinterPrint error', e);
                    if (prm.errorCallback) {
                        _doAction(prm.errorCallback, AM.update(this || {}, { input: e }));
                    }
                }
            );
            return true;
        },
        // Convert canvas to CPCL codes
        'canvasToCPCL': function(prm) {
            // Check if there is copies if not then set to 1
            var copies = (prm.copies ? prm.copies : 1);
            return pcx.toCPCL(prm.canvas, prm.singlePrint, copies, prm.blackMark);
        },
        // Convert canvas to EXPCL codes
        'canvasToExPCL': function(prm) {
            var context = prm.canvas.getContext('2d');
            var px = [];
            var dt = context.getImageData(0, 0, prm.canvas.width, prm.canvas.height).data;
            var yy = -1;
            for (var i = 0; i < dt.length; i += prm.canvas.width * 4) {
                yy++;
                var xx = -1;
                var x = 0;
                var br = [];
                for (var j = 0; j < prm.canvas.width * 4; j += 4) {
                    xx++;
                    var g = Math.floor((dt[yy * prm.canvas.width * 4 + (xx * 4)] + dt[yy * prm.canvas.width * 4 + (xx * 4) + 1] + dt[yy * prm.canvas.width * 4 + (xx * 4) + 2]) / 3);
                    if (g < 128) {
                        x = x | (1 << (7 - (xx % 8)));
                    }
                    if (xx % 8 >= 7) {
                        br.push(x);
                        x = 0;
                    }
                }
                px.push(br);
            }
            return toEXPL(px);
        },
        // Convert canvas to ESCP codes
        'canvasToESCP': function(prm) {
            // Buffer variable
            var buffer = [];

            // This function adds bytes to the buffer
            function appendBytes() {
                for (var i = 0; i < arguments.length; i++) {
                    buffer.push(arguments[i]);
                }
            }

            // Initialize - Reset to default - ESC @
            appendBytes(0x1B, 0x40);

            // ESC l 0 - Set the margin to 0
            appendBytes(0x1B, 0x6C, 0);

            // TEMPORARY - Set the height of the page to 12 inch - Make it work for a4
            // ESC C NUL 12
            appendBytes(0x1B, 0x43, 0x00, 12);

            // Prepare to convert the canvas to data
            var canvas = prm.canvas;
            var context = prm.canvas.getContext('2d');

            // Dots per Inch
            var dots = 24;
            var bytes = dots / 8;

            // Prepare the data to be used for printing (static data)
            var width = canvas.width;
            var height = canvas.height;
            var nL = 0; // Calculated depending on the width
            var nH = Math.round(dots / 256); // Printing the command per line which is 24 dots in height
            var dotDensity = 39;

            // Max data
            var maxWidth = 255;

            // Read each pixel from the canvas
            var imageData = context.getImageData(0, 0, width, height);
            imageData = imageData.data;

            // Generate the boolean value per pixel (4 bytes) it
            var blackLimit = 600;
            var pixArr = [];
            for (var pix = 0; pix < imageData.length; pix += 4) {
                pixArr.push(!((imageData[pix] + imageData[pix + 1] + imageData[pix + 2]) > blackLimit));
            }
            
            // Set the line spacing to 24 dots, the height of each "stripe" of the image that we're drawing.
            // ESC 3 24 - Min. line feed
            // appendBytes(0x1B, 0x33, dots);
            appendBytes(0x1B, 0x33, dots - 0.005); // TEMPORARY - Until brother printer replies

            // Starting from x = 0, read 24 bits down. The offset variable keeps track of our global 'y'position in the image.
            // keep making these 24-dot stripes until we've executed past the height of the bitmap.
            var offset = 0;
            while (offset < height) {
                // Scan through the whole width data
                for (var x = 0; x < width; ++x) {

                    // Prepare the ESCP bit image command if it reached the max width
                    if (x % maxWidth == 0) {
                        // Check the width to be used
                        var useWidth = (width - x);
                        useWidth = (useWidth < maxWidth ? useWidth : maxWidth)
                        nL = Math.round(useWidth % 256);

                        // ESC * m n1 n2
                        appendBytes(0x1B, 0x2A, dotDensity, nL, nH);
                    }

                    // Remember, 24 dots = 24 bits = 3 bytes. The 'k' variable keeps track of which of those three bytes that we're currently scribbling into.
                    for (var k = 0; k < bytes; ++k) {
                        var slice = 0; 
                        // The 'b' variable keeps track of which bit in the byte we're recording.
                        for (var b = 0; b < 8; ++b) {
                            // Calculate the y position that we're currently trying to draw.
                            var y = (((offset / 8) + k) * 8) + b;
                            // Calculate the location of the pixel we want in the bit array. It'll be at (y * width) + x.
                            var i = (y * width) + x;
                            // If the image (or this stripe of the image)
                            // is shorter than 24 dots, pad with zero.
                            var bit;
                            if (pixArr.hasOwnProperty(i)) bit = pixArr[i] ? 0x01 : 0x00; else bit = 0x00;
                            // Finally, store our bit in the byte that we're currently scribbling to. Our current 'b' is actually the exact
                            // opposite of where we want it to be in the byte, so subtract it from 7, shift our bit into place in a temp
                            // byte, and OR it with the target byte to get it into the final byte.
                            slice |= bit << (7 - b);    // shift bit and record byte
                        }
                        // Phew! Write the damn byte to the buffer
                        appendBytes(slice);
                    }
                }

                // We're done with this 24-dot high pass. Render a newline to bump the print head down to the next line and keep on trucking.
                offset += dots;
                // LF
                appendBytes(10);
            }

            return toStr(buffer);
        },
        // Convert canvas to ESCPOS codes
        'canvasToESCPOS': function(prm) {
            var buffer = [];

            function _raw (buf) {
                buffer = buffer.concat(buf)
            }

            var canvas = prm.canvas;
            var context = prm.canvas.getContext('2d');
            var img = context.getImageData(0, 0, canvas.width, canvas.height);

            var pixels = [];
            var pix_line = '';
            var im_left = '';
            var im_right = '';
            var _switch = 0;
            var img_size = [0, 0];

            if (img.width > 512) console.log('WARNING: Image is wider than 512 and could be truncated at print time.');
            if (img.height > 65536) return 'Image height cannot be more than 65536.';

            var image_border = checkImageSize(img.width);

            for (var i = 0; i < image_border[0]; i++) {
                im_left += '0';     
            }; 

            for (var i = 0; i < image_border[1]; i++) {
                im_right += '0';
            };


            for (var y = 0; y < img.height; y++) {
                img_size[1] += 1;
                pix_line += im_left;
                img_size[0] += image_border[0];

                for (var x = 0; x < img.width; x++) {
                    img_size[0] += 1;
                    var RGB = getPixel(img, x, y);
                    var im_color = RGB[0] + RGB[1] + RGB[2];
                    var im_pattern = '1X0';
                    var pattern_len = im_pattern.length;
                    _switch = (_switch - 1) * (-1);

                    // console.log(y, x, im_color, pattern_len, _switch + '')
                    for (var z = 0; z < pattern_len; z++) {
                        if (im_color <= (255 * 3 / pattern_len * (z + 1))) {
                            if (im_pattern[z] === 'X') {
                                pix_line += _switch;
                            } else{
                                pix_line += im_pattern[z];
                            };
                            break;
                            
                        } else if (im_color > (255 * 3 / pattern_len * pattern_len) && im_color <= (255 * 3)) {
                            pix_line += im_pattern.substr(-1);
                            break;
                        }
                    };
            
                };

                pix_line += im_right;
                img_size[0] += image_border[1];
                
            };

            var line = pix_line;
            var size = img_size;

            var i = 0;
            var count = 0;
            var tmpBuffer = [];

            // GS v 0 NULL 
            _raw([ 0x1d, 0x76, 0x30, 0x00 ]);

            // xL xH yL yH
            _raw([((size[0]/size[1])/8), 0, size[1]&0xff, (size[1]/256)]);
            tmpBuffer = [];

            while (i < line.length) {
                var hex_string = parseInt(line.slice(i, i + 8), 2);
                tmpBuffer.push(hex_string);
                i += 8;
                count += 1;
                if (count % 4 === 0) {
                    _raw(tmpBuffer);
                    tmpBuffer = [];
                    count = 0;
                };
            }

            return toStr(buffer);
        },
        // Formats to CPCL
        'formatToCPCL': function(prm) {
            prm = prm || {};

            prm.font = prm.font || 'monospace';
            prm.size = prm.size || '23';
            prm.fontWeight = prm.fontWeight || 'normal';
            
            var tags = [];
            prm.text.replace(/\[\/?[\w\=\"|'-]+\]/g, function(x) {
                tags.push(x);
                return '';
            });

            var text = prm.text,
                textSplit = text.split(/\[\/?[\w\=\"|'-]+\]/g);

            // initialize
            cpcl.init();

            /**
             * TODO: Please redo how the data is being read
             *       because it's totally messy combining both
             *       formatting(bold,etc..) and data text printing
             */


            var withNewLine = true;
            for (var i = 0; i < textSplit.length; i++) {
                if (textSplit[i]) {
                    if (textSplit[i] != " ") {
                        // split by new line
                        var txtSplit = textSplit[i].split('\n');
                        
                        // Check if all are empty string meaning all are new line
                        // new line doubles the splitting
                        var normal = false;
                        for (var j = 0; j < txtSplit.length; j++) {
                            if (txtSplit[j]) {
                                normal = true;
                                break;
                            }
                        }
                        
                        for (var j = 0; j < txtSplit.length; j++) {
                            // Check if need to skip
                            if (!normal) {
                                normal = true;
                                continue;
                            }

                            // print text
                            cpcl.text(txtSplit[j]);

                            // Skip the new line in the next round because this one already includes a new line
                            // contains a proper text data - text print
                            if (txtSplit[j]) {
                                withNewLine = false;
                            }

                            // Add new line for new lin splitting
                            if (!txtSplit[j]) {
                                // Check if the previous command is a text print
                                // it will skip if yes
                                if (withNewLine) {
                                    cpcl.newLine();
                                }    
                                // Already applied the normal new line so must force new line
                                // if more new line is added
                                withNewLine = true; 
                            }
                        }
                    }
                }

                // Update the font options
                if (tags[i]) {
                    if (tags[i].match(/\[b/)) {
                        cpcl.bold(true);
                    } else if (tags[i].match(/\[\/b/)) {
                        cpcl.bold(false);
                    } 
                    // else if (tags[i].match(/\[img/)) {
                    //     // not implemented yet
                    // } else if (tags[i].match(/\[i/)) {
                    //     cpcl.italic(true);
                    // } else if (tags[i].match(/\[\/i/)) {
                    //     cpcl.italic(false);
                    // } else if (tags[i].match(/\[font=/)) {
                    //     // not implemented yet
                    // } else if (tags[i].match(/\[\/font/)) {
                    //     // not implemented yet
                    // } else if (tags[i].match(/\[size=/)) {
                    //     var sz = tags[i].split(/\[size="|'/);
                    //     if (typeof sz[1] !== 'undefined') {
                    //         cpcl.size(sz[1]);
                    //     }
                    // } else if (tags[i].match(/\[\/size/)) {
                    //     cpcl.size(prm.size);
                    // } else if (tags[i].match(/\[linespace=/)) {
                    //     var linespace = tags[i].split(/\[linespace="|'/);
                    //     if (typeof linespace[1] !== 'undefined') {
                    //         cpcl.lineSpacing(linespace[1]);
                    //     }
                    // } else if (tags[i].match(/\[\/linespace/)) {
                    //     cpcl.lineSpacing(0);
                    // } else if (tags[i].match(/\[alignment=/)) {
                    //     var align = tags[i].split(/\[alignment="|'/);
                    //     if (typeof align[1] !== 'undefined') {
                    //         cpcl.alignment(align[1].toLowerCase());
                    //     }
                    // } else if (tags[i].match(/\[\/alignment/)) {
                    //     cpcl.alignment('left');
                    // } else if (tags[i].match(/\[u/)) {
                    //     cpcl.underline(true);
                    // } else if (tags[i].match(/\[\/u/)) {
                    //     cpcl.underline(false);
                    // } else if (tags[i].match(/\[s/)) {
                    //     // not implemented 
                    // } else if (tags[i].match(/\[\/s/)) {
                    //     // not implemented 
                    // }
                }
            }

            // // return the encoded
            return cpcl.encode();
        },
        // Formats to ESCPOS
        'formatToESCPOS': function(prm) {
            prm = prm || {};

            prm.encoding = prm.encoding || 'utf-8';
            prm.font = prm.font || 'monospace';
            prm.size = prm.size || '23';
            
            var tags = [];
            prm.text.replace(/\[\/?[\w\=\"|'-]+\]/g, function(x) {
                tags.push(x);
                return '';
            });

            var text = prm.text,
                textSplit = text.split(/\[\/?[\w\=\"|'-]+\]/g);

            // initialize
            escpos.init();
            escpos.encoding(prm.encoding);

            /**
             * TODO: Please redo how the data is being read
             *       because it's totally messy combining both
             *       formatting(bold,etc..) and data text printing
             */


            var withNewLine = true;
            for (var i = 0; i < textSplit.length; i++) {
                if (textSplit[i]) {
                    if (textSplit[i] != " ") {
                        // split by new line
                        var txtSplit = textSplit[i].split('\n');
                        
                        // Check if all are empty string meaning all are new line
                        // new line doubles the splitting
                        var normal = false;
                        for (var j = 0; j < txtSplit.length; j++) {
                            if (txtSplit[j]) {
                                normal = true;
                                break;
                            }
                        }
                        
                        for (var j = 0; j < txtSplit.length; j++) {
                            // Check if need to skip
                            if (!normal) {
                                normal = true;
                                continue;
                            }

                            // print text
                            escpos.text(txtSplit[j]);

                            // Skip the new line in the next round because this one already includes a new line
                            // contains a proper text data - text print
                            if (txtSplit[j]) {
                                withNewLine = false;
                            }

                            // Add new line for new lin splitting
                            if (!txtSplit[j]) {
                                // Check if the previous command is a text print
                                // it will skip if yes
                                if (withNewLine) {
                                    escpos.newLine();
                                }    
                                // Already applied the normal new line so must force new line
                                // if more new line is added
                                withNewLine = true; 
                            }
                        }
                    }
                }

                // Update the font options
                if (tags[i]) {
                    if (tags[i].match(/\[b/)) {
                        escpos.bold(true);
                    } else if (tags[i].match(/\[\/b/)) {
                        escpos.bold(false);
                    } else if (tags[i].match(/\[img/)) {
                        // not implemented yet
                    } else if (tags[i].match(/\[i/)) {
                        escpos.italic(true);
                    } else if (tags[i].match(/\[\/i/)) {
                        escpos.italic(false);
                    } else if (tags[i].match(/\[font=/)) {
                        // not implemented yet
                    } else if (tags[i].match(/\[\/font/)) {
                        // not implemented yet
                    } else if (tags[i].match(/\[size=/)) {
                        var sz = tags[i].split(/\[size="|'/);
                        if (typeof sz[1] !== 'undefined') {
                            escpos.size(sz[1]);
                        }
                    } else if (tags[i].match(/\[\/size/)) {
                        escpos.size(prm.size);
                    } else if (tags[i].match(/\[linespace=/)) {
                        var linespace = tags[i].split(/\[linespace="|'/);
                        if (typeof linespace[1] !== 'undefined') {
                            escpos.lineSpacing(linespace[1]);
                        }
                    } else if (tags[i].match(/\[\/linespace/)) {
                        escpos.lineSpacing(0);
                    } else if (tags[i].match(/\[alignment=/)) {
                        var align = tags[i].split(/\[alignment="|'/);
                        if (typeof align[1] !== 'undefined') {
                            escpos.alignment(align[1].toLowerCase());
                        }
                    } else if (tags[i].match(/\[\/alignment/)) {
                        escpos.alignment('left');
                    } else if (tags[i].match(/\[u/)) {
                        escpos.underline(true);
                    } else if (tags[i].match(/\[\/u/)) {
                        escpos.underline(false);
                    } else if (tags[i].match(/\[s/)) {
                        // not implemented 
                    } else if (tags[i].match(/\[\/s/)) {
                        // not implemented 
                    }
                }
            }

            // return the encoded
            return escpos.encode();
        },
        // Convert canvas to ZPL codes
        'canvasToZPL': function(prm) {
            var zpl = convertCanvasToZPL(prm.canvas);
            
            _doAction(prm.callback, AM.update(this || {}, { input: zpl }));
        },
        // Convert canvas to ZPL codes
//        'canvasToZPL': function(prm) {
//            var canvas = prm.canvas;
//            var dataURL = canvas.toDataURL();
//
//            var blobBin = atob(dataURL.split(',')[1]);
//            var array = [];
//            for(var i = 0; i < blobBin.length; i++) {
//                array.push(blobBin.charCodeAt(i));
//            }
//            var file = new Blob([new Uint8Array(array)], {type: 'image/png'});
//
//            var formData = new FormData();
//            formData.append('file', file);
//            
//            $.ajax({
//                url: 'http://api.labelary.com/v1/graphics',
//                headers: { Accept: 'application/json' },
//                type: 'POST',
//                data: formData,
//                cache: false,
//                contentType: false,
//                processData: false,
//                success: function(data) {
//                    var buffer = '';
//                    buffer += '^XA ';
//                    buffer += '^FO0,0 ';
//                    buffer += '^GFA, ';
//                    buffer += '^FO0,0 ';
//                    buffer += '^GFA,' + data.totalBytes + ',' + data.totalBytes + ',' + data.rowBytes + ',' + data.data;
//                    buffer += '^FS ';
//                    buffer += '^XZ';
//                    if (prm.callback) {
//                        _doAction(prm.callback, AM.update(this || {}, { input: buffer }));
//                    }
//                },
//                error: function(jqxhr) {
//                    if (prm.callback) {
//                        _doAction(prm.callback, AM.update(this || {}, { input: 'Unable to conver the image.' }));
//                    }
//                }
//            });
//        },
        // Print QR to ESCPOS codes
        'qrToESCPOS': function(prm) {
            var buffer = [];

            function _raw (buf) {
                buffer = buffer.concat(buf)
            }

            var string = prm.text;   
            var encoder = new TextEncoder('utf8');
            var data = encoder.encode(string);
            data = Array.prototype.slice.call(data);

            var buf = [];
            // Check the alignment
            if (prm.justify.toUpperCase() == 'center'.toUpperCase()) {
                buf = buf.concat([0x1b, 0x61, 0x01]);
            } else if (prm.justify.toUpperCase() == 'right'.toUpperCase()) {
                buf = buf.concat([0x1b, 0x61, 0x02]);
            } else {
                buf = buf.concat([0x1b, 0x61, 0x00]);
            }
            // QR Printing
            buf = buf.concat([0x1b, 0x5a, 0x06, 0x01, 0x00], Math.round(data.length%256), Math.round(data.length/256), data);

            _raw(buf);

            return toStr(buffer);
        },
        // Generate the format/style for printing
        'setPrintStyle': function(prm) {
            var string = prm.text;

            // Check for alignment styling
            if (prm.alignment) {
                string = '[alignment=\'' + prm.alignment + '\']' + string + '[/alignment]';
            }
            // Check for bold styling
            if (prm.bold) {
                string = '[b]' + string + '[/b]';
            }
            // Check for italic styling
            if (prm.italic) {
                string = '[i]' + string + '[/i]';
            }
            // Check for underline styling
            if (prm.underline) {
                string = '[u]' + string + '[/u]';
            }
            // Check for strikethrough styling
            if (prm.strikethrough) {
                string = '[s]' + string + '[/s]';
            }
            // Check for font styling
            if (prm.font) {
                string = '[font=\'' + prm.font + '\']' + string + '[/font]';
            }
            // Check for size styling
            if (prm.size) {
                string = '[size=\'' + prm.size + 'px\']' + string + '[/size]';
            }
            // Check for linespacing styling
            if (prm.linespacing) {
                string = '[linespace=\'' + prm.linespacing + '\']' + string + '[/linespace]';
            }

            return string;
        },
        // cordova plugin : cordova plugin add cordova-plugin-printer
        // network printing please review , no device support for test based on sample 
        'networkPrintingCheck':function(prm){
            var ebd=this||{};
            if (isCordova()){
                cordova.plugins.printer.canPrintItem(function(_available,_count){
                    if (prm.callback){
                        _doAction(prm.callback, AM.update(ebd, {
                            input: {
                                count:_count,
                                available:_available
                            }
                        }));
                    }
                })

                return true;
            };
            return false;
        },
        
        'networkPrintingPrint':function(prm){
            var opt={
                printer:prm.printerId?prm.printerId:null,
                duplex:prm.duplex?prm.duplex:'none',
                orientation:prm.landscape?'landscape':'portrait',
                monochrome:prm.graystyle?prm.graystyle:false,
            };
            if (isCordova()){
                return cordova.plugins.printer.print(prm.page,opt);

            };

            return false;
        }
    }, 'Printer');

     /**
     * Check the image size
     */
    function checkImageSize (size) {
        if (size % 32 === 0)
            return [0, 0];
        else
            var image_border = 32 - (size % 32);
            return image_border % 2 === 0
                ? [image_border / 2, image_border / 2] 
                : [image_border / 2, (image_border / 2) + 1];
    }

    /**
     * Get the pixel of the image
     */
    function getPixel (img, x, y) {
        var idx = (x + y * img.width) * 4;
        var r = img.data[idx + 0]; 
        var g = img.data[idx + 1]; 
        var b = img.data[idx + 2];
        return [r, g, b];
    }

    /* source:addons/bbcode_canvas.js */
    var fx = 1;

    window.addEventListener('load', function() {
        setTimeout(function() {
            if (window.MobileAccessibility) {
                window.MobileAccessibility.usePreferredTextZoom(false);
                window.MobileAccessibility.getTextZoom(function(d) {
                    fx = d / 100;
                });
            }
        }, 200);
    });

    function bbCodeToCanvas(prm, cb) {
        prm = prm || {};

        prm.font = prm.font || 'monospace';
        prm.size = prm.size || '23px';
        prm.marginTop = prm.marginTop || 0;
        prm.marginLeft = prm.marginLeft || 0;
        prm.marginRight = prm.marginRight || 0;
        prm.marginBottom = prm.marginBottom || 0;
        prm.listImage = [];
        prm.canvasWidth=prm.canvasWidth||576;

        /** Canvas Class */
        var CanvasText = function(position, size) {
            this._textStack = [];
            if (position === null || position === undefined) {
                position = {
                    x: 0,
                    y: 0
                }
            }
            if (size === null || size === undefined) {
                size = {
                    width: 100,
                    height: 100
                }
            }
            this._position = position;
            this._size = size;
        };

        /** Canvas Class functions */
        CanvasText.prototype = {
            _position: null,
            _size: null,
            _textStack: null,
            _currentOptionSet: null,

            _newOptionSet: function() {
                if (this._currentOptionSet != null) {
                    return;
                }
                this._currentOptionSet = {
                    text: '',
                    family: '',
                    size: '',
                    style: '',
                    decoration: '',
                    image: '',
                    spacing: 0,
                    alignment: ''
                }
            },
            position: function(x, y) {
                this._position.x = x;
                this._position.y = y;
            },
            family: function(family) {
                this._newOptionSet();
                this._currentOptionSet.family = family;
                return this;
            },
            size: function(size) {
                this._newOptionSet();
                this._currentOptionSet.size = size;
                return this;
            },
            style: function(style) {
                this._newOptionSet();
                this._currentOptionSet.style = style;
                return this;
            },
            image: function(image) {
                this._newOptionSet();
                this._currentOptionSet.image = image;
                return this;
            },
            spacing: function(spacing) {
                this._newOptionSet();
                this._currentOptionSet.spacing = spacing;
                return this;
            },
            alignment: function(alignment) {
                this._newOptionSet();
                this._currentOptionSet.alignment = alignment;
                return this;
            },
            decoration: function(decoration) {
                this._newOptionSet();
                this._currentOptionSet.decoration = decoration;
                return this;
            },
            append: function(text) {
                this._newOptionSet();
                this._currentOptionSet.text = text;
                if (this._currentOptionSet.image) {
                    this._currentOptionSet.text = '';
                }
                this._textStack.push(this._currentOptionSet);
                this._currentOptionSet = clone(this._currentOptionSet);
                return this;
            },
            newLine: function() {
                this.append('\n');
                return this;
            },
            render: function() {
                if (this._textStack.length == 0) {
                    return;
                }
                var previousFontOptions = {
                    text: '',
                    family: '',
                    size: '',
                    style: '',
                    decoration: '',
                    spacing: 0,
                    alignment: ''
                };
                var textAdjustment = {
                    xLeft: 0,
                    xRight: 0,
                    y: 0
                };

                context.save();
                context.fillStyle = "#FFFFFF";
                context.fillRect(0, 0, canvas.width, canvas.height);

                for (var i = 0, textStackLen = this._textStack.length; i < textStackLen; i++) {

                    // Set the properties of the text to be displayed
                    var currentFontOptions = this._textStack[i];
                    if (currentFontOptions.family) {
                        previousFontOptions.family = currentFontOptions.family;
                    }
                    if (currentFontOptions.size) {
                        previousFontOptions.size = currentFontOptions.size;
                    }
                    if (currentFontOptions.style) {
                        previousFontOptions.style = currentFontOptions.style;
                    }

                    context.font = previousFontOptions.style.trim() + ' ' + previousFontOptions.size.trim() + ' ' + previousFontOptions.family.trim();

                    if (currentFontOptions.decoration) {
                        previousFontOptions.decoration = currentFontOptions.decoration;
                    }
                    if (typeof currentFontOptions.spacing !== 'undefined') {
                        previousFontOptions.spacing = currentFontOptions.spacing;
                    }
                    if (currentFontOptions.alignment) {
                        previousFontOptions.alignment = currentFontOptions.alignment;
                    }

                    // Start rendering the words
                    var textToDraw = currentFontOptions.text;
                    var wordsArray = textToDraw.split(' ');

                    // Check if it's right aligned
                    if (previousFontOptions.alignment == 'right') {
                        wordsArray.reverse();
                    }

                    for (var j = 0, wordsArrayLen = wordsArray.length; j < wordsArrayLen; j++) {
                        var currentWord = wordsArray[j];

                        // Add space if it's not the first one
                        if (j > 0) {
                            if (previousFontOptions.alignment == 'right') {
                                currentWord = currentWord + ' ';
                            } else {
                                currentWord = ' ' + currentWord;
                            }
                        }
                        var currentWordWidth = context.measureText(currentWord).width;

                        if (textAdjustment.xLeft + textAdjustment.xRight + currentWordWidth > this._size.width || textToDraw == '\n') {
                            textAdjustment.xLeft = 0;
                            textAdjustment.xRight = 0;
                            textAdjustment.y += (parseInt(previousFontOptions.size) + (Number(previousFontOptions.spacing)) * fx); //parseInt(previousFontOptions.size, 15);
                        }

                        if (textToDraw == '\n') {
                            continue;
                        }

                        // Set the properties before displaying the text
                        context.fillStyle = '#000';

                        var xPosition = this._position.x + textAdjustment.xLeft;
                        context.textAlign = 'start';    

                        if (previousFontOptions.alignment == 'right') {
                            xPosition = this._size.width - textAdjustment.xRight;
                            context.textAlign = 'end';    
                        }

                        context.fillText(
                            currentWord, // text
                            xPosition,
                            this._position.y + textAdjustment.y // y position
                        );

                        if (currentFontOptions.decoration) {
                            var dc = currentFontOptions.decoration;
                            //var textWidth = context.measureText(currentFontOptions.text).width;
                            var textWidth = currentWordWidth;
                            var startX = 0;
                            var startY = '';

                            if (dc == "underline") {
                                startY = this._position.y + textAdjustment.y + (parseInt(previousFontOptions.size) / 10);
                            } else if (dc == "strikethrough") {
                                startY = this._position.y + textAdjustment.y - (parseInt(previousFontOptions.size) / 3);
                            }

                            var endX = 0;
                            var endY = startY;
                            var underlineHeight = parseInt(previousFontOptions.size) / 15;

                            if (underlineHeight < 1) {
                                underlineHeight = 1;
                            }
                            context.beginPath();
                            context.lineWidth = underlineHeight >= 1 ? underlineHeight : 1;

                            startX = (xPosition) * fx; //+ 0;//4;
                            endX = (xPosition + textWidth) * fx; //+ 0;//4;

                            if (previousFontOptions.alignment == 'right') {
                                endX = (xPosition - textWidth) * fx; //+ 0;//4;
                            }

                            context.lineWidth = underlineHeight;
                            context.moveTo(startX, startY);
                            context.lineTo(endX, endY);
                            context.stroke();
                        }

                        if (previousFontOptions.alignment == 'right') {
                            textAdjustment.xRight += currentWordWidth;
                        } else {
                            textAdjustment.xLeft += currentWordWidth;
                        }
                    }
                }
                this._size.height = (textAdjustment.y + 50 + fx);
                context.restore();
            }
        }

        var canvas = document.createElement('canvas');
        canvas.setAttribute('width', prm.canvasWidth);

        var myText = new CanvasText({
            x: prm.marginLeft,
            y: prm.marginTop + 24 + 6
        }, {
            width: (canvas.width - prm.marginRight),
            height: canvas.height - prm.marginBottom
        });

        var context = canvas.getContext('2d');

        var sty = {
            bold: false,
            italic: false
        };
        var dec = {
            underline: false,
            strikethrough: false
        };
        var image = {
            image: true
        };

        function setSty(k, v) {
            sty[k] = v;
            return getSty();
        }

        function getSty() {
            prm.text = '';
            prm.text += sty.bold ? 'bold' : '';
            prm.text += sty.italic ? ' italic' : '';
            prm.text = prm.text.replace(/^\s/, '');
            return prm.text ? prm.text : 'normal';
        }

        function setDec(k, v) {
            dec[k] = v;
            return getDec();
        }

        function getDec() {
            prm.text = '';
            prm.text += dec.underline ? 'underline' : '';
            prm.text += dec.strikethrough ? ' strikethrough' : '';
            prm.text = prm.text.replace(/^\s/, '');
            return prm.text ? prm.text : '';
        }

        function isEmpty(obj) {
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop))
                    return false;
            }
            return true;
        }

        /** Load the images */
        function preImage(sources, callback) {
            var images = [];
            var loadedImages = 0;
            var numImages = 0;

            for (var src in sources) {
                numImages++;
            }
            for (var src in sources) {
                images[src] = new Image();
                images[src].crossOrigin = 'Anonymous';
                images[src].onload = function() {
                    if (++loadedImages >= numImages) {
                        callback(images);
                    }
                };
                images[src].src = sources[src];
            }
        }

        function preLoadedImage(listImage) {
            var sources = [];
            prm.listImage = [];
            var tmpImage = {};

            listImage.map(function(imgs) {
                var attribute = {};
                var imageAttr = imgs.match(/(sx|sy|swidth|sheight|x|y|width|height)=(\d*)/g);
                var imageData = imgs.replace(/(\[.*?])/g, '');
                if (imageAttr != null) {
                    for (var i = 0; i < imageAttr.length; i++) {
                        var imgRes = imageAttr[i].split('=');
                        attribute[imgRes[0]] = parseInt(imgRes[1]);
                    }
                    tmpImage[imageData] = attribute;
                }
                prm.listImage.push(imageData);
                sources.push(imageData);
            });

            preImage(sources, function(images) {
                images.map(function(imgResult) {
                    if (isEmpty(tmpImage) === true) {
                        var x = 0;
                        var y = 0;
                        context.drawImage(imgResult, x, y, imgResult.width, imgResult.height);
                    } else {
                        var imageWithAttr = tmpImage[imgResult.getAttribute('src')];

                        if (imageWithAttr !== undefined) {
                            var x = (imageWithAttr.x === undefined ? 0 : imageWithAttr.x);
                            var y = (imageWithAttr.y === undefined ? 0 : imageWithAttr.y);

                            if (imageWithAttr.width !== undefined &&
                                imageWithAttr.height !== undefined
                            ) {
                                context.drawImage(
                                    imgResult,
                                    x,
                                    y,
                                    imageWithAttr.width,
                                    imageWithAttr.height
                                );
                            } else if (imageWithAttr.sx !== undefined &&
                                imageWithAttr.sy !== undefined &&
                                imageWithAttr.swidth !== undefined &&
                                imageWithAttr.sheight !== undefined &&
                                imageWithAttr.width !== undefined &&
                                imageWithAttr.height !== undefined
                            ) {
                                context.drawImage(
                                    imgResult,
                                    imageWithAttr.sx,
                                    imageWithAttr.sy,
                                    imageWithAttr.swidth,
                                    imageWithAttr.sheight,
                                    x,
                                    y,
                                    imageWithAttr.width,
                                    imageWithAttr.height
                                );
                            } else {
                                context.drawImage(imgResult, x, y, imgResult.width, imgResult.height);
                            }
                        } else {
                            context.drawImage(imgResult, 0, 0, imgResult.width, imgResult.height);
                        }
                    }
                });
            });
        }

        var _tg = [];
        prm.text.replace(/\[\/?(?:img|font|size|linespace|alignment)[\w\=\"|'-]*\]|\[\/?[bius]\]/g, function(x) {
            _tg.push(x)
            return '';
        });

        var img = prm.text;
        var spl = prm.text.split(/\[\/?(?:img|font|size|linespace|alignment)[\w\=\"|'-]*\]|\[\/?[bius]\]/g);
        myText.family(prm.font).size(prm.size);

        var renderImage = false;
    
        for (var i = 0; i < spl.length; i++) {
            // Seperate the text by new lines
            if (spl[i]) {
                if (spl[i] != " ") {
                    var xi = spl[i].split('\n');
                    for (var ix = 0; ix < xi.length; ix++) {
                        myText.append(xi[ix]);
                        if (ix < xi.length - 1) {
                            myText.append('\n');
                        }
                    }
                }
            };

            // Update the font options
            if (_tg[i]) {
                if (_tg[i].match(/\[b/)) {
                    myText.style(setSty('bold', true));
                } else if (_tg[i].match(/\[\/b/)) {
                    myText.style(setSty('bold', false));    
                } else if (_tg[i].match(/\[img/)) {
                    myText.image(true);
                    renderImage = true;
                } else if (_tg[i].match(/\[\/img/)) {
                    myText.image(false);  
                } else if (_tg[i].match(/\[i/)) {
                    myText.style(setSty('italic', true));
                } else if (_tg[i].match(/\[\/i/)) {
                    myText.style(setSty('italic', false));
                } else if (_tg[i].match(/\[font=/)) {
                    var fam = _tg[i].split(/\[font="|'/);
                    myText.family(fam[1]);
                } else if (_tg[i].match(/\[\/font/)) {
                    myText.family(prm.font);
                } else if (_tg[i].match(/\[size=/)) {
                    var sz = _tg[i].split(/\[size="|'/);
                    myText.size(sz[1]);
                } else if (_tg[i].match(/\[\/size/)) {
                    myText.size(prm.size);
                } else if (_tg[i].match(/\[linespace=/)) {
                    var sz = _tg[i].split(/\[linespace="|'/);
                    myText.spacing(sz[1]);
                } else if (_tg[i].match(/\[\/linespace/)) {
                    myText.spacing(0);
                } else if (_tg[i].match(/\[alignment=/)) {
                    var sz = _tg[i].split(/\[alignment="|'/);
                    myText.alignment(sz[1].toLowerCase());
                } else if (_tg[i].match(/\[\/alignment/)) {
                    myText.alignment('left');
                } else if (_tg[i].match(/\[u/)) {
                    myText.decoration(setDec('underline', true));
                } else if (_tg[i].match(/\[\/u/)) {
                    myText.decoration(setDec('underline', false));
                } else if (_tg[i].match(/\[s/)) {
                    myText.decoration(setDec('strikethrough', true));
                } else if (_tg[i].match(/\[\/s/)) {
                    myText.decoration(setDec('strikethrough', false));
                }
            }
        }

        // Need to render image
        if (renderImage) {
            preLoadedImage(img.match(/\[img(.*?)\[\/img]/g));
        }
    
        myText.render();

        var wForCanvas = prm.canvasWidth;
        var hForCanvas = (prm.marginTop + myText._size.height + prm.marginBottom);

        canvas.width = prm.canvasWidth * fx;
        canvas.height = (prm.marginTop + myText._size.height + prm.marginBottom) * fx;

        myText.render();

        var canvasReal = document.createElement('canvas');

        if (prm.rotateDegree && (prm.rotateDegree == 90 || prm.rotateDegree == 270)) {
            canvasReal.setAttribute('width', hForCanvas);
            canvasReal.setAttribute('height', wForCanvas);
        } else {
            canvasReal.setAttribute('width', wForCanvas);
            canvasReal.setAttribute('height', hForCanvas);
        }

        var contextReal = canvasReal.getContext('2d');
        if (cb) {
            loadImages(prm.listImage).done(function(images) {
                if (prm.rotateDegree) {
                    drawRotatedImage(canvasReal, contextReal, canvas, prm.rotateDegree)
                }
                else {
                    contextReal.drawImage(canvas, 0, 0, wForCanvas, hForCanvas);
                }
                cb(canvasReal);
            });
        } else {
            if (prm.rotateDegree) {
                drawRotatedImage(canvasReal, contextReal, canvas, prm.rotateDegree)
            } else {
                contextReal.drawImage(canvas, 0, 0, wForCanvas, hForCanvas);
            }
        }
        return canvasReal;
    }
    
    // Draw rotated image into canvas
    function drawRotatedImage(canvas, context, image, rotateDegree) {
        context.translate(canvas.width/2, (canvas.height)/2);
        context.rotate(rotateDegree*Math.PI/180);
        context.drawImage(image, -image.width/2, -image.height/2, image.width, image.height);
        context.rotate(-(rotateDegree*Math.PI/180));
        context.translate(-canvas.width/2, -(canvas.height)/2);
    }
    
    function convertCanvasToZPL(canvas) {
        
        // from java http://www.jcgonzalez.com/java-image-to-zpl-example
        var ZPLConverter = function() {
            this.blackLimit = 380;
            this.total = 0;
            this.widthBytes = 0;
            this.map = {
                1: 'G', 2: 'H', 3: 'I', 4: 'J', 5: 'K', 6: 'L', 7: 'M', 8: 'N', 9: 'O', 10: 'P', 11: 'Q', 12: 'R', 13: 'S', 14: 'T', 15: 'U',
                16: 'V', 17: 'W', 18: 'X', 19: 'Y', 20: 'g', 40: 'h', 60: 'i', 80: 'j', 100: 'k', 120: 'l', 140: 'm', 160: 'n', 180: 'o',
                200: 'p', 220: 'q', 240: 'r', 260: 's', 280: 't', 300: 'u', 320: 'v', 340: 'w', 360: 'x', 380: 'y', 400: 'z'
            };
        };

        ZPLConverter.prototype = {
            convertFromCanvas: function(canvas) {
                var body = this.createBody(canvas);
                return this.headDoc() + this.encodeHexAscii(body) + this.footDoc();
            },

            createBody: function(canvas) {
                var buffer = '',
                    height = canvas.height,
                    width = canvas.width,
                    rgb,
                    index = 0,
                    auxBinaryChar = ['0','0','0','0','0','0','0','0'],
                    imgData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);

                if (width % 8 > 0) {
                    this.widthBytes = (parseInt(width / 8)) + 1;
                } else {
                    this.widthBytes = width / 8;
                }
                this.total = this.widthBytes * height;

                for (var h = 0; h < height; h++) {
                    for (var w = 0; w < width; w++) {
                        rgb = this.getPixelColor(imgData, w, h);

                        auxBinaryChar[index] = (rgb.red + rgb.green + rgb.blue) > this.blackLimit ? '0' : '1';
                        index++;

                        if (index === 8 || w === (width - 1)) {
                            buffer += this.fourByteBinary(auxBinaryChar.join(''));
                            auxBinaryChar = ['0','0','0','0','0','0','0','0'];
                            index = 0;
                        }
                    }
                    buffer += '\n';
                }
                return buffer;
            },

            fourByteBinary: function(str) {
                var decimal = parseInt(str, 2);
                if (decimal > 15) {
                    return decimal.toString(16).toUpperCase();
                } else {
                    return '0' + decimal.toString(16).toUpperCase();
                }
            },

            // https://stackoverflow.com/questions/19560441/difference-between-pixelcolor-in-javascript-canvas-and-php-imagecolorat
            getPixelColor: function(imagedata, x, y) {
                var position = (x + imagedata.width * y) * 4, data = imagedata.data;
                return {
                    red: data[position], // red
                    green: data[position + 1], // green
                    blue: data[position + 2] // blue
                };
            },

            encodeHexAscii: function(code) {
                var maxline = 32, //this.widthBytes * 2,
                    sbCode = '',
                    sbLine = '',
                    previousLine = '',
                    counter = 1,
                    aux = code.charAt(0),
                    firstChar = false;

                for (var i = 1; i < code.length; i++) {
                    if (firstChar) {
                        aux = code.charAt(i);
                        firstChar = false;
                        continue;
                    }
                    if (code.charAt(i) == '\n') {
                        if (counter >= maxline && aux == '0') {
                            sbLine += ',';
                        } else if (counter >= maxline && aux == 'F') {
                            sbLine += '!';
                        } else if (counter > 20) {
                            var multi20 = (counter / 20) * 20;
                            var resto20 = (counter % 20);

                            sbLine += typeof this.map[multi20] !== 'undefined' ? this.map[multi20] : ',';
                            if (resto20 != 0) {
                                sbLine += (typeof this.map[resto20] !== 'undefined' ? this.map[resto20] : ',') + aux;
                            } else {
                                sbLine += aux;
                            }
                        } else {
                            sbLine += (typeof this.map[counter] !== 'undefined' ? this.map[counter] : ',') + aux;
                        }
                        counter = 1;
                        firstChar = true;

                        sbCode += (sbLine == previousLine) ? ':' : sbLine;

                        previousLine = sbLine;
                        sbLine = '';
                        continue;
                    }
                    if (aux == code.charAt(i)){
                        counter++;
                    } else {
                        if (counter > 20) {
                            var multi20 = (counter / 20) * 20;
                            var resto20 = counter % 20;

                            sbLine += typeof this.map[multi20] !== 'undefined' ? this.map[multi20] : ',';
                            if (resto20 != 0){
                                sbLine += (typeof this.map[resto20] !== 'undefined' ? this.map[resto20] : ',') + aux;
                            } else {
                                sbLine += aux;
                            }
                        } else {
                            sbLine += (typeof this.map[counter] !== 'undefined' ? this.map[counter] : ',') + aux;
                        }
                        counter = 1;
                        aux = code.charAt(i);
                    }
                }

                return sbCode;        
            },

            setBlacknessLimitPercentage: function(percentage) {
                this.blackLimit = (percentage * 768 / 100);
            },

            headDoc: function() {
                return "^XA ^FO0,0 ^GFA," + this.total + "," + this.total + "," + this.widthBytes +", ";
            },

            footDoc: function() {
                return "^FS ^XZ";
            }
        };
        
        var converter = new ZPLConverter();
        converter.setBlacknessLimitPercentage(50);

        return converter.convertFromCanvas(canvas);
    }

    //function getCanvasPrm(prm, cb) {
    //    cb(bbCodeToCanvas(prm));
    //}

    var toRLE = function(d) {
        var a = [];
        for (var y = 0; y < d.length; y++) {
            a.push(RLE.encode(d[y].slice(0)))
        }
        return a;
    };
    var toStr = function(a) {
        var s = '';
        for (var x = 0; x < a.length; x++) {
            var sm = String.fromCharCode(a[x]);
            s += sm;
        }
        return s;
    };
    var toEXPL = function(d) {
        var dd = toRLE(d);
        var s = toStr([27, 80, 36]);
        for (var y = 0; y < dd.length; y++) {
            s += toStr([27, 118, 1, 72]) + toStr(dd[y]);
        }
        return (s + toStr([4]));
    }

    function loadImages(arr) {
        var newimages = [],
            loadedimages = 0;
        var postaction = function() {};
        var arr = (typeof arr != "object") ? [arr] : arr;

        function imageloadpost() {
            loadedimages++
            if (loadedimages >= arr.length) {
                postaction(newimages);
            }
        }

        if (!arr.length) {
            setTimeout(function() {
                imageloadpost();
            }, 0);
        } else {
            for (var i = 0; i < arr.length; i++) {
                newimages[i] = new Image();
                newimages[i].src = arr[i];
                newimages[i].onload = function() {
                    imageloadpost();
                }
                newimages[i].onerror = function() {
                    imageloadpost();
                }
            }
        }
        return {
            done: function(f) {
                postaction = f || postaction;
            }
        };
    }

    function setDPI(canvas, dpi) {
        if (!canvas.style.width)
            canvas.style.width = canvas.width + 'px';
        if (!canvas.style.height)
            canvas.style.height = canvas.height + 'px';

        var scaleFactor = dpi / 96;
        canvas.width = Math.ceil(canvas.width * scaleFactor);
        canvas.height = Math.ceil(canvas.height * scaleFactor);
        var ctx = canvas.getContext('2d');
        ctx.scale(scaleFactor, scaleFactor);
    }


    registerFunction({
        'canvasGenerate': function (prm) {
            var ebd = this||{};
            var cba = function (o) {
                if (prm.callback) {
                    // console.log('callback',o);
                    _doAction(prm.callback, AM.update(ebd, {
                        input:o
                    }));
                }
            }
            generateCanvas(prm,cba);
        }
    }, 'App');

    var generateCanvas = function (prm,cb) {
        var self = this;
        var canvas = document.createElement('canvas');

        var width = prm.canvasWidth || 300;
        var height = prm.canvasHeight || 300;
        var imageWidth = prm.imageWidth || 100;
        var imageHeight = prm.imageHeight || 100;
        
        canvas.id = "my";
        canvas.width = width;
        canvas.height = height;
        canvas.style.position = "absolute";

        var ctx = canvas.getContext("2d");

        if (prm.canvas && prm.canvas.length) {
            prm.canvas.forEach(function (key) {
                var canvasKey = Object.keys(key)[0];
                var canvasValues = key[Object.keys(key)[0]];

                switch (canvasKey) {
                    case 'rect':
                        ctx.rect(canvasValues.x, canvasValues.y, canvasValues.width, canvasValues.height)
                        break;

                    case 'strokeStyle':
                        ctx.strokeStyle = canvasValues.color;
                        ctx.stroke();
                        break;

                    case 'drawImage':
                        var img = new Image();
                        img.src = canvasValues.img


                        img.onload=function(){
                            var canvasValuesCount = Object.keys(canvasValues).length
                            if ( canvasValuesCount == 3 ){
                                if (canvasValues.alignment = true ){
                                    ctx.drawImage(img ,canvas.width / 2 - img.width / 2, canvasValues.y);
                                }else{
                                    ctx.drawImage(img ,canvasValues.x, canvasValues.y);
                                }
                            }else if ( canvasValuesCount == 5 ){
                                ctx.drawImage(img ,canvasValues.x, canvasValues.y, canvasValues.width, canvasValues.height);
                            }else if ( canvasValuesCount == 9 ){
                                ctx.drawImage(img,canvasValues.sx,canvasValues.sy,canvasValues.swidth,canvasValues.sheight,canvasValues.x,canvasValues.y,canvasValues.width,canvasValues.height);
                            }
                        }
                        break;

                    case 'textAlign':
                        ctx.textAlign = canvasValues;
                        break;

                    case 'font':
                        ctx.font = canvasValues;
                        break;

                    case 'fillText':
                        var canvasValuesCount = Object.keys(canvasValues).length
                        if ( canvasValuesCount == 3 ){
                            ctx.fillText(canvasValues.text, canvasValues.x, canvasValues.y);
                        }else if ( canvasValuesCount == 4 ){
                            ctx.fillText(canvasValues.text, canvasValues.x, canvasValues.maxWidth);
                        }

                        break;

                    default:
                        false;
                }
            });
        }

        setTimeout(function(){
            return cb(canvas.toDataURL());
        },100) 
    };

    registerFunction({
        /** canvas bbtocanvas (new) */
        'bbCodeToCanvas': function(prm) {
            var x = bbCodeToCanvas(prm);
            return x;
        },
        'bbCodeToCanvasSync': function(prm) {
            var self = this;
            bbCodeToCanvas(prm, function(canvas) {
                _doAction(prm.callback, AM.update(self || {}, {
                    input: canvas
                }));
            });
        }
    }, 'App');

    /* source:addons/mail.js */



    function mailService(prm, dt, cb, ecb) {
        prm = prm || {};

        // Check if there was a direct connector to be used
        var url = (dt['config']['Connector'] ? dt['config']['Connector'] : _baseConfig.mailservice);
        url += '?' + AM.encodeArguments(prm);
        
        console.log('request url : ', url);
        console.log('request dt : ', dt);
        var d = AM.getRequest(url);
        console.log('d: ', d);
        d.addCallback(function(s) {
            var r = safeEval(s);
            if (r) {
                if (r.s) {
                    if (cb) {
                        cb.apply(d, [r])
                    }
                } else {
                    if (ecb) {
                        ecb.apply(d, [r])
                    }
                    //if(ecb){ecb.apply(d,[s])}
                }
            } else {
                if (ecb) {
                    ecb.apply(d, [{
                        s: false,
                        err: s
                    }])
                }
            }
        });
        d.addErrback(function(s) {
            if (ecb) {
                ecb.apply(d, [{
                    s: false,
                    err: s
                }])
            }
        });
        dt = dt || {};
        for (var i in dt) {
            if (AM.isObject(dt[i])) {
                dt[i] = AM.serializeJSON(dt[i]);
            }
        }
        d.sendReq(dt);
        return d;
    }

    function mailRequest(prm, dt, cb, ecb) {
        mailService(prm, dt, function(o) {
            if (o.s) {
                console.log('sukses', o);
                if (cb) {
                    cb(o);
                }
            } else {
                console.log('gagal', e);
                if (ecb) {
                    ecb(o.err);
                }
            }
        }, function(e) {
            console.log('gagal', e);
            if (ecb) {
                ecb(e);
            }
        });
        return true;
    }

    registerFunction({
        'sendMail': function(prm) {
            if (prm['config'] && prm['to'] && prm['data']) {
                var ebd = this;
                var cba = function(o) {
                    if (prm.callback) {
                        _doAction(prm.callback, AM.update(ebd, {
                            input: o.dt
                        }));
                    }
                }
                var ecba = function(o) {
                    if (prm.errCallback) {
                        _doAction(prm.errCallback, AM.update(ebd, {
                            input: o
                        }));
                    }
                }
                var xprm = {
                    'api': 'mail'
                };
                var dt = dt || {};
                if (prm['config']) {
                    dt.config = prm['config'];
                }
                if (prm['to']) {
                    dt.to = prm['to'];
                }
                if (prm['from']) {
                    dt.from = prm['from'];
                }
                if (prm['cc']) {
                    dt.cc = prm['cc'];
                }
                if (prm['bcc']) {
                    dt.bcc = prm['bcc'];
                }
                if (prm['data']) {
                    dt.data = prm['data'];
                }
                if (prm['attachment']) {
                    dt.attachment = prm['attachment'];
                }
                mailRequest(xprm, dt, cba, ecba);
            }
        }
    }, 'App');

    var dataFonts = [];
    var fontObject = {
        fontSizeInit: function () {
            // Go through all the elements
            var allElement = document.querySelectorAll('body *');
            for (var x = 0; x < allElement.length; x++) {
                // Make sure it's not yet stored
                if (!AM.hasClass(allElement[x], 'fs-stored')) {
                    var currFont = window.getComputedStyle(allElement[x]).fontSize;
                    dataFonts.push({
                        el: allElement[x],
                        normalFontSize: currFont
                    });
                    AM.addClass(allElement[x], 'fs-stored');
                }   
            }

            // Change the font size based on the stored data
            if (localStorage.eFontType) {
                fontObject.changeFontSize(localStorage.eFontType);
            }
        },
        changeFontSize: function(type) {
            var type = type || 'normal';
            localStorage.setItem('eFontType', type);
            var msg = {};
            var sizeFactor = {
                huge: 2,
                large: 1.5,
                small: 0.8
            }
            var eFontType = localStorage.eFontType;
            if (!eFontType) {
                return false;
            }
            for (var i = 0; i < dataFonts.length; i++) {
                if (sizeFactor[eFontType]) {
                    dataFonts[i].el.style.fontSize = parseInt(parseFloat(dataFonts[i].normalFontSize) * sizeFactor[eFontType]) + 'px';
                } else {
                    dataFonts[i].el.style.fontSize = dataFonts[i].normalFontSize;
                }
            }
            return msg;
        }
    };

    registerFunction({
        fontHuge: function() {
            return fontObject.changeFontSize('huge');
        },
        fontLarge: function() {
            return fontObject.changeFontSize('large');
        },
        fontNormal: function() {
            return fontObject.changeFontSize('normal');
        },
        fontSmall: function() {
            return fontObject.changeFontSize('small');
        }
    }, 'Conversion');

    /* source:addons/istampz.js */

    // Send the istampz request
    function istampzService(url, prm, dt, cb, ecb) {
        prm = prm || {};
        url = url + '?' + AM.encodeArguments(prm);
        var d = AM.getRequest(url);
        d.addCallback(function(s) {
            //console.log('s',s);
            var r = safeEval(s);
            if (r) {
                if (cb) { cb.apply(d, [r]) }
            } else {
                if (ecb) { ecb.apply(d, [{ s: false, err: s }]) }
            }
        });
        d.addErrback(function(s) {
            if (ecb) { ecb.apply(d, [{ s: false, err: s }]) }
        });
        dt = dt || {};
        for (var i in dt) {
            if (AM.isObject(dt[i])) {
                dt[i] = AM.serializeJSON(dt[i]);
            }
        }
        d.sendReq(dt);
        return d;
    }

    // istampz function helper
    var _istampzHelper = {
        random: function(num) {
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+,./<>?";

            for (var i = 0; i < num; i++)
                text += possible.charAt(Math.floor(Math.random() * possible.length));

            return text;
        },
        encodeBase64: function(string) {
            return btoa(encodeURIComponent(string).replace(/%([0-9A-F]{2})/g, function(match, p1) {
                return String.fromCharCode('0x' + p1);
            }));
        },
        encrypt256: function(data, module_key, encrypt_key) {
            // Prepare the encryption key and iv
            var key = CryptoJS.enc.Utf8.parse(encrypt_key);
            var iv = CryptoJS.lib.WordArray.random(16);

            // Encrypt the data
            var encrypted = CryptoJS.AES.encrypt(data, key, { iv: iv });

            // Prepare the additional string for the parameters
            var pre1 = _istampzHelper.random(3);
            var pre2 = _istampzHelper.random(2);

            // Prepare the final parameters to be passed
            var data_base64 = pre1 + encrypted.ciphertext.toString(CryptoJS.enc.Base64);
            var iv_base64 = pre2 + encrypted.iv.toString(CryptoJS.enc.Base64);
            var module_key_base64 = _istampzHelper.encodeBase64(module_key);

            var encrypted_data = {
                'p1': data_base64,
                'p2': iv_base64,
                'p3': module_key_base64,
                'ver': '1.2'
            }

            return encrypted_data;
        },
        decrypt256: function(encrypted_data, iv, decrypt_key) {
            // Remove unuse character
            var encrypted_data = encrypted_data.substring(4);
            var iv = iv.substring(7);

            // Prepare the decryption key and iv
            var key = CryptoJS.enc.Utf8.parse(decrypt_key);
            iv = CryptoJS.enc.Base64.parse(iv);

            // Decrypt the data
            var data = CryptoJS.AES.decrypt(encrypted_data, key, { iv: iv });

            // Check if it was able to retreive a proper data
            try {
                var result = CryptoJS.enc.Utf8.stringify(data);
                return JSON.parse(result);
            } catch (e) {
                return e;
            }
        }
    }

    // istampz component
    var TISTAMPZconn = TComponent.extend({
        url: '',
        app_key: '',
        module_key: '',
        encrypt_key: '',
        decrypt_key: '',
        // Prepare the default values of the component
        load: function(o) {
            this.parent(o);
            var attr = o.attr;
            this.url = attr.url || 'http://istampz.tk/api/istampz/verify';
            this.app_key = attr.appKey;
            this.module_key = attr.moduleKey;
            this.encrypt_key = attr.encryptKey;
            this.decrypt_key = attr.decryptKey;
        },
        // Send request to the istampz server
        request: function(prm, callback, errorCallback) {
            var self = this;
            // Append some default values needed for the request
            prm = AM.update({ app_id: self.app_key, module_id: self.module_key }, prm);
            // Conver the json to string
            var sprm = JSON.stringify(prm);
            // Encrypt the data 
            var param_encrypted = _istampzHelper.encrypt256(sprm, self.module_key, self.encrypt_key);
            // Send the request
            return istampzService(self.url, {}, param_encrypted, function(o) {
                // Make sure the needed return values are existing
                var x = o;
                if (x && x.p1 && x.p2) {
                    // Decrypt the data returned from the server 
                    var rslt = _istampzHelper.decrypt256(x.p1, x.p2, self.decrypt_key);
                    // Check if there is data
                    if (rslt) {
                        if (rslt.hasOwnProperty('status')) {
                            if (callback) {
                                callback(rslt);
                            }
                        } else {
                            if (errorCallback) {
                                errorCallback(rslt);
                            }
                        }
                    }
                } else {
                    if (errorCallback) {
                        errorCallback(o);
                    }
                }
            }, function(e) {
                // Error callback return
                if (errorCallback) {
                    errorCallback(e);
                }
            });
        }
    });

    registerComponent(TISTAMPZconn, 'TISTAMPZconn', TComponent);

    registerFunction({
        'istampzRequest': function(prm) {
            if (prm['istampz']) {
                var cmp = _Scope.componentByName(prm['istampz']);
                if (cmp && cmp.request) {
                    var ebd = this;
                    return cmp.request(prm['data'], function(dt) {
                        ebd = ebd || {};
                        if (prm.callback) {
                            _doAction(prm.callback, AM.update(ebd, { input: dt }));
                        }
                    }, function(dt) {
                        ebd = ebd || {};
                        if (prm.errorCallback) {
                            _doAction(prm.errorCallback, AM.update(ebd, { input: dt }));
                        }
                    });
                }
            }
            return false;
        }
    }, 'App');  

    /***************
     * Azure Cognitive Services
     ***************/

    // Azure Cognitive Connector Component
    var TAzureCognitiveConnector = TComponent.extend({
        // Generate the request header
        requestHeaders: function() {
            return { 'Ocp-Apim-Subscription-Key': this.attr.key };
        },
        // Generate the final url
        requestURL: function(service, path) {
            return this.attr.url + '/' + service + '/' + this.attr.apiVersion + '/' + path;
        },
        // Generic request sender
        sendRequest: function(data, options, callback, errorCallback) {
            // Prepare the needed parameters
            var headers = this.requestHeaders(); 
            
            // Check if data is a binary
            if (data instanceof Blob) {
                headers['Content-Type'] = 'application/octet-stream';
                options['data'] = data;
                options['processData'] = false;
            } else {
                headers['Content-Type'] = 'application/json';
                options['data'] = JSON.stringify(data);
                options['dataType'] = 'json';
            }

            // Merge the default options with the updated options
            var finalOptions = {
                type: 'POST',
                headers: headers,
                timeout: this.attr.timeOut || 30000
            };
            Object.assign(finalOptions, options);

            // Run the ajax http request
            $.ajax(finalOptions)
            .done(function(data) {
                callback(data);
            })
            .fail(function(error) {
                // If it's actually success but just blank
                if (error['status'] == 200) {
                    callback('Successful.');
                    return;
                }
                errorCallback((error['responseJSON'] ? error['responseJSON'] : 
                    {
                        error: {
                            code: 'Unspecified',
                            message: 'Access denied due to invalid subscription key. Make sure you are subscribed to an API you are trying to call and provide the right key.'
                        }
                    }
                ));
            });
        },
        // Send a request to detect faces
        requestDetectFace: function(data, withFaceAttribute, callback, errorCallback) {
            // Generate the ajax request options
            var url = this.requestURL('face', 'detect');
            url += (!withFaceAttribute ? '' : '?returnFaceAttributes=age,gender,headPose,smile,facialHair,glasses,emotion,hair,makeup,occlusion,accessories,blur,exposure,noise');
            var options = { url: url };

            // Check if the data is not blob
            if (!(data instanceof Blob)) {
                data = { url: data };
            }

            this.sendRequest(data, options, callback, errorCallback);
        },
        // Send a request to verify faces
        requestVerifyFace: function(data, callback, errorCallback) {
            // Generate the ajax request options
            var options = { url: this.requestURL('face', 'verify') };
            this.sendRequest(data, options, callback, errorCallback);
        },
        // Send a request to identify a face
        requestIdentifyFace: function(data, callback, errorCallback) {
            // Generate the ajax request options
            var options = { url: this.requestURL('face', 'identify') };
            this.sendRequest(data, options, callback, errorCallback);
        },
        // Send a request to add new group
        requestAddGroup: function(data, groudId, callback, errorCallback) {
            // Generate the ajax request options
            var path = 'largepersongroups/' + groudId;
            var url = this.requestURL('face', path);
            var options = { 
                url: url,
                type: 'PUT'
            };
            this.sendRequest(data, options, callback, errorCallback);
        },
        // Send a request to train a group
        requestTrainGroup: function(groudId, callback, errorCallback) {
            // Generate the ajax request options
            var path = 'largepersongroups/' + groudId + '/train';
            var url = this.requestURL('face', path);
            var options = { url: url };
            this.sendRequest({}, options, callback, errorCallback);
        },
        // Send a request to get the person information
        requestGetPerson: function(groupId, personId, callback, errorCallback) {
            // Generate the ajax request options
            var path = 'largepersongroups/' + groupId + '/persons/' + personId;
            var url = this.requestURL('face', path);
            var options = { 
                url: url,
                type: 'GET'
            };
            this.sendRequest({}, options, callback, errorCallback);
        },
        // Send a request to add new person face
        requestAddPerson: function(data, groudId, callback, errorCallback) {
            // Generate the ajax request options
            var path = 'largepersongroups/' + groudId + '/persons';
            var url = this.requestURL('face', path);
            var options = { url: url };
            var finalData = data;

            // Generate some variabled functions to simplify callbacks
            var self = this;
            var callbackAddGroup = function(data) {
                self.sendRequest(finalData, options, callback, errorCallback);
            };
            var errorCallbackAddGroup = function(error) {
                // Check if it's just existing
                if (error['error'] && error['error']['code'] == 'LargePersonGroupExists') {
                    callbackAddGroup();
                    return;
                }
                errorCallback(error);
            };

            // Check the group first
            this.requestAddGroup(
                { name: groudId },
                groudId,
                callbackAddGroup,
                errorCallbackAddGroup
            );
        },
        // Send a request to remove a person
        requestRemovePerson: function(groupId, personId, callback, errorCallback) {
            // Generate the ajax request options
            var path = 'largepersongroups/' + groupId + '/persons/' + personId;
            var url = this.requestURL('face', path);
            var options = { 
                url: url,
                type: 'DELETE'
            };
            this.sendRequest({}, options, 
                function(data) {
                    // Send a request to train the group
                    self.requestTrainGroup(groudId, options, function(data) {},  function(error) {});
                    callback(data);
                }, errorCallback);
        },
        // Send a request to remove a group
        requestRemoveGroup: function(groupId, callback, errorCallback) {
            // Generate the ajax request options
            var path = 'largepersongroups/' + groupId;
            var url = this.requestURL('face', path);
            var options = { 
                url: url,
                type: 'DELETE'
            };
            this.sendRequest({}, options, callback, errorCallback);
        },
        // Send a request to add a face
        requestAddFace: function(data, groudId, personId, callback, errorCallback) {
            // Generate the ajax request options
            var path = 'largepersongroups/' + groudId + '/persons/' + personId + '/persistedfaces';
            var url = this.requestURL('face', path);
            var options = { url: url };

            // Check if the data is not blob
            var finalData = data;
            if (!(finalData instanceof Blob)) {
                finalData = { url: finalData };
            }

            // Generate some variabled functions to simplify callbacks
            var self = this;
            var callbackAddGroup = function(data) {
                self.sendRequest(finalData, options, 
                    function(data) {
                        // Send a request to train the group
                        self.requestTrainGroup(groudId, options, function(data) {},  function(error) {});
                        callback(data);
                    }, errorCallback);
            };
            var errorCallbackAddGroup = function(error) {
                // Check if it's just existing
                if (error['error'] && error['error']['code'] == 'LargePersonGroupExists') {
                    callbackAddGroup();
                    return;
                }
                errorCallback(error);
            };

            // Check the group first
            this.requestAddGroup(
                { name: groudId },
                groudId,
                callbackAddGroup,
                errorCallbackAddGroup
            );
        }
    });
    registerComponent(TAzureCognitiveConnector, 'TAzureCognitiveConnector', TComponent);

    /**
     * Azure Cognitive Face Recognition functions
     */
    registerFunction({
        'detectFaceAzure': function(prm) {
            // Prepare the callback functions
            var callback = platformCallback(this, prm.callback);
            var errorCallback = platformCallback(this, prm.errorCallback);

            // Make sure the required parameter is passed
            if (!prm['connector'] || !prm['data']) {
                errorCallback('Missing one of the required parameters: connector and data.');
                return;
            }

            // Get the connector
            var conn = _Scope.componentByName(prm['connector']);
            if (!conn) {
                errorCallback('The connector name provided is invalid.');
                return;
            }

            // Send the request 
            conn.requestDetectFace(prm['data'], true, 
                function(data) {
                    // Make sure there is atleast one face
                    if (data.length == 0) {
                        errorCallback('No valid face was detected.');
                        return;
                    } 

                    callback({
                        'data': data,
                        'extra': prm['extra']
                    });
                }, 
                errorCallback);                
        },
        'verifyFaceFromPhotosAzure': function(prm) {
            // Prepare the callback functions
            var callback = platformCallback(this, prm.callback);
            var errorCallback = platformCallback(this, prm.errorCallback);

            // Make sure the required parameter is passed
            if (!prm['connector'] || !prm['data1'] || !prm['data2']) {
                errorCallback('Missing one of the required parameters: connector, data1 and data2.');
                return;
            }

            // Get the connector
            var conn = _Scope.componentByName(prm['connector']);
            if (!conn) {
                errorCallback('The connector name provided is invalid.');
                return;
            }

            // Send the first image/url 
            var parameters = {};
            conn.requestDetectFace(prm['data1'], false, 
                function(data) {
                    // Make sure there is only one face
                    if (data.length != 1) {
                        errorCallback(data.length == 0 ? 
                            'No valid face was detected.' : 'There are multiple faces detected');
                        return;
                    } 

                    parameters['faceId1'] = data[0]['faceId'];
                    // Send the second image/url
                    conn.requestDetectFace(prm['data2'], false, 
                        function(data) {
                            parameters['faceId2'] = data[0]['faceId'];
                            conn.requestVerifyFace(parameters, 
                                function(data) {
                                    callback({
                                        'data': data,
                                        'extra': prm['extra']
                                    });
                                }, 
                                errorCallback); 
                        }, 
                        errorCallback); 
                }, 
                errorCallback);   
        },
        'identifyFaceAzure': function(prm) {
            // Prepare the callback functions
            var callback = platformCallback(this, prm.callback);
            var errorCallback = platformCallback(this, prm.errorCallback);

            // Make sure the required parameter is passed
            if (!prm['connector'] || !prm['data'] || !prm['groupId']) {
                errorCallback('Missing one of the required parameters: connector, data and groupId.');
                return;
            }

            // Get the connector
            var conn = _Scope.componentByName(prm['connector']);
            if (!conn) {
                errorCallback('The connector name provided is invalid.');
                return;
            }

            // Send the needed requests
            var parameters = {};
            parameters['largePersonGroupId'] = prm['groupId'];
            parameters['maxNumOfCandidatesReturned'] = 1;
            parameters['confidenceThreshold'] = (prm['confidenceThreshold'] ? prm['confidenceThreshold'] / 100 : 0.5);
            conn.requestDetectFace(prm['data'], false, 
                function(data) {
                    // Make sure there is only one face
                    if (data.length != 1) {
                        errorCallback(data.length == 0 ? 
                            'No valid face was detected.' : 'There are multiple faces detected');
                        return;
                    } 

                    parameters['faceIds'] = [data[0]['faceId']];
                    conn.requestIdentifyFace(parameters, 
                        function(data) {
                            // Check if the face was matched
                            if (data[0]['candidates'].length == 0) {
                                callback({
                                    'data': 'Person not found.',
                                    'extra': prm['extra']
                                });
                                return;
                            } 

                            // Get more info
                            conn.requestGetPerson(prm['groupId'], 
                                data[0]['candidates'][0]['personId'],
                                function(data) {
                                    callback({
                                        'data': data,
                                        'extra': prm['extra']
                                    });
                                }, 
                                errorCallback); 
                        }, 
                        errorCallback); 
                }, 
                errorCallback);   
        },
        'addPersonAzure': function(prm) {
            // Prepare the callback functions
            var callback = platformCallback(this, prm.callback);
            var errorCallback = platformCallback(this, prm.errorCallback);

            // Make sure the required parameter is passed
            if (!prm['connector'] || !prm['groupId'] || !prm['personName']) {
                errorCallback('Missing one of the required parameters: connector, groupId and personName.');
                return;
            }

            // Get the connector
            var conn = _Scope.componentByName(prm['connector']);
            if (!conn) {
                errorCallback('The connector name provided is invalid.');
                return;
            }

            // Send the needed requests
            var parameters = {};
            parameters.name = prm['personName'];
            conn.requestAddPerson(parameters, prm['groupId'], 
                function(data) {
                    callback({
                        'data': data,
                        'extra': prm['extra']
                    });
                }, 
                errorCallback);   
        },
        'addFaceAzure': function(prm) {
            // Prepare the callback functions
            var callback = platformCallback(this, prm.callback);
            var errorCallback = platformCallback(this, prm.errorCallback);

            // Make sure the required parameter is passed
            if (!prm['connector'] || !prm['data'] || !prm['groupId'] || !prm['personId']) {
                errorCallback('Missing one of the required parameters: connector, data, groupId and personId.');
                return;
            }

            // Get the connector
            var conn = _Scope.componentByName(prm['connector']);
            if (!conn) {
                errorCallback('The connector name provided is invalid.');
                return;
            }

            // Send the needed requests
            conn.requestAddFace(prm['data'], prm['groupId'], prm['personId'], 
                function(data) {
                    callback({
                        'data': data,
                        'extra': prm['extra']
                    });
                }, 
                errorCallback);   
        },
        'removePersonAzure': function(prm) {
            // Prepare the callback functions
            var callback = platformCallback(this, prm.callback);
            var errorCallback = platformCallback(this, prm.errorCallback);

            // Make sure the required parameter is passed
            if (!prm['connector'] || !prm['groupId'] || !prm['personId']) {
                errorCallback('Missing one of the required parameters: connector, groupId and personId.');
                return;
            }

            // Get the connector
            var conn = _Scope.componentByName(prm['connector']);
            if (!conn) {
                errorCallback('The connector name provided is invalid.');
                return;
            }

            // Send the needed requests
            conn.requestRemovePerson(prm['groupId'], prm['personId'],
                function(data) {
                    callback({
                        'data': data,
                        'extra': prm['extra']
                    });
                }, 
                errorCallback);   
        },
        'removeGroupAzure': function(prm) {
            // Prepare the callback functions
            var callback = platformCallback(this, prm.callback);
            var errorCallback = platformCallback(this, prm.errorCallback);

            // Make sure the required parameter is passed
            if (!prm['connector'] || !prm['groupId']) {
                errorCallback('Missing one of the required parameters: connector and groupId.');
                return;
            }

            // Get the connector
            var conn = _Scope.componentByName(prm['connector']);
            if (!conn) {
                errorCallback('The connector name provided is invalid.');
                return;
            }

            // Send the needed requests
            conn.requestRemoveGroup(prm['groupId'],
                function(data) {
                    callback({
                        'data': data,
                        'extra': prm['extra']
                    });
                }, 
                errorCallback);   
        }
    }, 'Devices');

    /**
     * Accelerometer functions
     */
    var gWatchAccelerometerID;
    registerFunction({
        "currentAccelerometer": function(prm) {
            var element = this || {};

            // Only cater for mobile device
            if (!isCordova()) {
                callback(element, prm.errorCallback, 'This function only works in mobile.');
                return false;
            }

            // Get the current accelerometer details
            navigator.accelerometer.getCurrentAcceleration(
                function(data) {
                    callback(element, prm.callback, data);
                }, 
                function(error) {
                    callback(element, prm.errorCallback, error);
                }
            );

            return true;
        },
        "watchAccelerometer": function(prm) {
            var element = this || {};
            var options = {
                frequency: (typeof(prm.frequency) != "undefined" ? prm.frequency : 3000)
            }

            // Only cater for mobile device
            if (!isCordova()) {
                callback(element, prm.errorCallback, 'This function only works in mobile.');
                return false;
            }

            // Watch the accelerometer
            gWatchAccelerometerID = navigator.accelerometer.watchAcceleration(
                function(data) {
                    callback(element, prm.callback, data);
                }, 
                function(error) {
                    callback(element, prm.errorCallback, error);
                },
                options
            );

            return true;
        },
        "clearAccelerometer": function(prm) {
            var element = this || {};

            // Only cater for mobile device
            if (!isCordova()) {
                callback(element, prm.errorCallback, 'This function only works in mobile.', extra);
                return false;
            }

            // Clear the accelerometer watch id
            navigator.accelerometer.clearWatch(gWatchAccelerometerID);

            return true;
        },
    }, "Devices");

    /**
     * PDF Viewer component class
     */
    var TPDFView = TVisualComponent.extend({
        // Tag type for the component
        _tag: "div",
        // Pdf object
        _pdf: {
            pdf: null,
            loaded: false,
            data: ""
        },
        // Additional settings
        panZoom: null,
        // Set file path
        _onDataValue: function(value) {
            // Refresh the new data
            this._pdf.data = "";
            // Reload with the new attribute
            this.setAttr({
                path: value
            });
        },
        // Set the initial attribute upon load
        setAttr: function(attr, w) {
            // Update the parent and the child attributes
            this.parent(attr, w);
            this.attr = AM.update(this.attr, attr);
            // Display the pdf
            this.show();
        },
        // Show the pdf in the component
        show: function() {
            // Make sure the path is not null
            if (this.attr.path){
                // Trigger the functions depending on the pdf file type
                switch (this.attr.pathType) {
                    case "url":
                        // Check if browser then just display
                        if (!isCordova()) {
                            // Download the pdf first
                            this.renderPdf(this.attr.path);
                            return;   
                        }
                        // Download the pdf first
                        this.downloadReadFile(this.attr.path);
                        break;
                    case "base64":
                        // Render the pdf
                        this.renderPdf({data: atob(this.attr.path)});
                        break;
                    case "temporaryFile":
                        // Read the file from the temporary storage
                        this.readFile(this.attr.path, "temporary");
                        break;
                    case "permanentFile":
                        // Read the file from the data storage
                        this.readFile(this.attr.path, "data");
                        break;
                    default:
                }
            }
        },
        // Render the pdf
        renderPdf: function(data) {
            data = data || "";

            var component = this._el;
            var settings = {
                page: this.attr.page, 
                pageNumber: parseInt(this.attr.pageNumber) || 1,
                zoom: this.attr.zoom || 1,
                scaleBy: this.attr.scaleBy || 'auto',
	    };
            var pdf = this._pdf;
            var self = this;

            // For page rendering
            var svgComponents, totalPages, processedPages;

            if (component && data) {
                if (pdf.loaded && pdf.data == data) {
                    renderPages(pdf.pdf);
                } else {
                    pdf.data = data;
                    pdf.loaded = false;

                    if (!pdf.pdf) {
                        pdfjsLib.GlobalWorkerOptions.workerSrc = "script/vendor/pdfjs/pdf.worker.js";
                    }

                    var loadingTask = pdfjsLib.getDocument(data);
                    loadingTask.promise.then(
                        function(_pdf) {                            
                            _pdf.loaded = true;
                            _pdf.pdf = _pdf;

                            pdf.loaded = true;
                            pdf.pdf = _pdf;

                            self.attr.maxPage = _pdf.numPages;

                            // Load event
                            if (self.ev && self.ev.load && self.ev.load.length) {
                                self.doAction(self.ev.load, {
                                    input: _pdf.numPages
                                });
                            }

                            renderPages(pdf.pdf);
                        }, function(error) {
                            // Error event
                            if (self.ev && self.ev.error && self.ev.error.length) {
                                self.doAction(self.ev.error, {
                                    input: error
                                });
                            }
                        }
                    );
                }
            } else {
                pdf.data = data;
                pdf.loaded = false;
                clearChild();
            }

            // Prepare the handler for the zoom function 
            var eventsHandler;
            eventsHandler = {
                haltEventListeners: ['touchstart', 'touchend', 'touchmove', 'touchleave', 'touchcancel'], 
                init: function(options) {
                    var instance = options.instance
                        , initialScale = 0
                        , pannedX = 0
                        , pannedY = 0

                    // Set the initial zoom
                    instance.zoomAtPoint(settings.zoom, {x:0, y:0});

                    // Init Hammer
                    // Listen only for pointer and touch events
                    this.hammer = Hammer(options.svgElement, {
                        inputClass: Hammer.SUPPORT_POINTER_EVENTS ? Hammer.PointerEventInput : Hammer.TouchInput
                    })

                    // Enable pinch
                    this.hammer.get('pinch').set({enable: true})

                    // Handle double tap
                    this.hammer.on('doubletap', function(ev){
                        instance.zoomIn()
                    })

                    // Handle pan
                    this.hammer.on('panstart panmove', function(ev){
                        // On pan start reset panned variables
                        if (ev.type === 'panstart') {
                            pannedX = 0
                            pannedY = 0
                        }

                        // Pan only the difference
                        instance.panBy({x: ev.deltaX - pannedX, y: ev.deltaY - pannedY})
                        pannedX = ev.deltaX
                        pannedY = ev.deltaY
                    })

                    // Handle pinch
                    this.hammer.on('pinchstart pinchmove', function(ev){
                        // On pinch start remember initial zoom
                        if (ev.type === 'pinchstart') {
                            initialScale = instance.getZoom()
                            instance.zoom(initialScale * ev.scale)
                        }

                        instance.zoom(initialScale * ev.scale)
                    })

                    // Prevent moving the page on some devices when panning over SVG
                    options.svgElement.addEventListener('touchmove', function(e){ e.preventDefault(); });
                }, 
                destroy: function() {
                    this.hammer.destroy();
                }
            };

            // Render the page(s) selected 
            function renderPages(pdf) {
                clearChild();

                // Make sure the page set is within the min or max
                if (settings.pageNumber > pdf.numPages) {
                    settings.pageNumber = pdf.numPages;
                } else if (settings.pageNumber < 1) { 
                    settings.pageNumber = 1;
                }

                // Destroy the panzoom if it exists
                if (self.panZoom) {
                    self.panZoom.destroy();
                    self.panZoom = null;
                }

                // Clear the component first
                svgComponents = [];

                // Prepare the processing variable holder
                processedPages = 0;

                // Check if single pages or not
                if (settings.page == "single") {
                    totalPages = 1;
                    renderPage(pdf, settings.pageNumber);
                } else {
                    totalPages = pdf.numPages;
                    for (var i = 1; i <= pdf.numPages; i++) {
                        renderPage(pdf, i);
                    }
                }
            }

            // Render the page
            function renderPage(pdf, page) {
                pdf.getPage(page).then(
                    function(page) {
                        // Prepare the scale to be used
			var scale = 1;
			if (settings.scaleBy === "width") {
				scale = component.offsetWidth / page.getViewport({scale: 1.0}).width;
			} else if (settings.scaleBy === "height") {
				scale = component.offsetHeight / page.getViewport({scale: 1.0}).height;
			} else {
				// Retrieve the screen layout
				let portrait = (isCordova() ? screen.orientation.type.indexOf("portrait") > -1 : window.screen.orientation.type.indexOf("portrait") > -1);
				// Adjusts based on portrait or landscape
				if (portrait) {
					scale = component.offsetWidth / page.getViewport({scale: 1.0}).width;
				} else {
					scale = component.offsetHeight / page.getViewport({scale: 1.0}).height;
				}
			}

                        // Get the page contract
                        var viewport = page.getViewport({scale: scale});

                        // SVG rendering by PDF.js
                        page.getOperatorList()
                        .then(function (opList) {
                            var svgGfx = new pdfjsLib.SVGGraphics(page.commonObjs, page.objs);
                            svgGfx.disableFontFace = true;
                            return svgGfx.getSVG(opList, viewport);
                        })
                        .then(function (svg) {
                            // Store the svg to the components
                            svgComponents[page._pageIndex] = svg;
                            
                            // Increment the processed page 
                            processedPages++;
                            
                            // Check if processing is completed
                            processIsFinished(totalPages, processedPages, displayPDF);                            
                        });
                    }
                );
            }

            // Display the pdf to the page
            function displayPDF() {
                // Generate the main svg component
                var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                svg.id = "mobile-svg";
                svg.setAttribute('width', '100%');
                svg.setAttribute('height', '100%');

                for (var index in svgComponents) {
                    // Append the pages and adjust the main svg size
                    var svgPage = svgComponents[index];
                    // Check if multiple page
                    index = (settings.page == "single" ? 0 : index);
                    svgPage.y.baseVal.value = svgPage.height.baseVal.value * index;
                    svg.appendChild(svgPage);
                }

                // Clear then display the svg
                component.innerHTML = "";
                component.appendChild(svg);

                // Enable the zoom function on the svg
                self.panZoom = svgPanZoom('#mobile-svg', {
                    zoomEnabled: true,
                    fit: false,
                    center: false,
                    customEventsHandler: eventsHandler
                });

                // After Load Event
                if (self.ev && self.ev.afterLoad && self.ev.afterLoad.length) {
                    self.doAction(self.ev.afterLoad, {});
                }
            }

            // Remove the display element
            function clearChild() {
                while (component && component.lastChild) {
                    component.removeChild(component.lastChild);
                }
            }
        },
        // Download file to cache phone storage and read it
        downloadReadFile: function(url) {
            var self = this;

            // Prepare the error callback
            var ecb = function(error) {
                 // Trigger the error event
                if (self.ev && self.ev.error && self.ev.error.length) {
                    self.doAction(self.ev.error, {
                        input: error
                    });
                }
            }

            // Go to the directory
            getStorage('temporary',
                function(dirEntry) {
                    dirEntry.getFile(new Date().getTime().toString(), { create: true, exclusive: false },
                        function (fileEntry) {
                            // Prepare the needed objects
                            var fileURL = fileEntry.toURL();
                            // Dowload the file
                            cordova.plugin.http.downloadFile(url, {}, {}, fileURL, function(fileEntry) {
                                fileEntry.file(
                                    function (file) {
                                        var reader = new FileReader();
                                        /* Open the PDF file as a byte array, because there are issues with reading the file directly
                                           using PDF.js on some devices 
                                        */
                                        reader.onloadend = function (evt) {
                                            self.renderPdf(new Uint8Array(evt.target.result));
                                        };

                                        reader.readAsArrayBuffer(file);
                                    },
                                    function (error) {
                                        ecb("Failed to read the file. Try creating a new PDF.");
                                    }
                                );
                            }, function(response) {
                                ecb("Failed to read the file. Try creating a new PDF.");
                            });
                        },
                        function (error) {
                            error = "Failed in creating or getting the specified file.";
                            ecb(error);
                        }
                    );
                },
                function(error) {
                    ecb(error);
                }
            );
        },
        // Read the file from the phone storage
        readFile: function(path, type) {
            var self = this;

            // Prepare the error callback
            var ecb = function(error) {
                 // Trigger the error event
                if (self.ev && self.ev.error && self.ev.error.length) {
                    self.doAction(self.ev.error, {
                        input: error
                    });
                }
            }

            // Go to the directory
            getStorage(type,
                function(dirEntry) {
                    dirEntry.getFile(path, { create: false }, 
                        function (fileEntry) {
                            fileEntry.file(
                                function (file) {
                                    var reader = new FileReader();
                                    /* Open the PDF file as a byte array, because there are issues with reading the file directly
                                       using PDF.js on some devices 
                                    */
                                    reader.onloadend = function (evt) {
                                        self.renderPdf(new Uint8Array(evt.target.result));
                                    };

                                    reader.readAsArrayBuffer(file);
                                },
                                function (error) {
                                    ecb("Failed to read the file. Try creating a new PDF.");
                                }
                            );
                        },
                        function (error) {
                            // Store the error
                            if (error.code === 1) {
                                error = "File not found. Create a PDF file first.";
                            }
                            else {
                                error = "Failed to read the file. Try creating a new PDF.";
                            }
                            ecb(error);
                        }
                    );
                },
                function(error) {
                    ecb(error);
                }
            );
        }
    });

    registerComponent(TPDFView, 'TPDFView', TVisualComponent);

    var isMobile = {
        Android: function() {
            return navigator.userAgent.match(/Android/i);
        },
        iOS: function() {
            return navigator.userAgent.match(/iPhone|iPad|iPod/i);
        }
    };


    var PushAjax = function(options) {
        options = options || {};
        if (!window.XMLHttpRequest) return;
        var request = new XMLHttpRequest();
        request.onreadystatechange = function() {
            if (request.readyState === 4) {
                if (request.status !== 200) {
                    if (options.error && typeof options.error === 'function')
                        options.error(request.response, request);
                    return;
                }

                if (options.success && typeof options.success === 'function')
                    options.success(request.response, request);
            }
        };
        if ("withCredentials" in request)
            request.open(options.method, options.url, true);
        else if (typeof XDomainRequest != "undefined") {
            request = new XDomainRequest();
            request.open(options.method, options.url);
        } else request = null;

        if (options.header && typeof options.header === 'function')
            options.header(request)
        if (options.data && typeof options.data === 'object') {
            request.send(encodeURI(this.jsonParam(options.data)));
        } else {
            request.send();
        }
    };

    PushAjax.prototype.jsonParam = function(json) {
        return Object.keys(json).map(function(key) {
            return decodeURIComponent(key) + '=' +
                decodeURIComponent(json[key]);
        }).join('&');
    }

    // aris update

    var THNSPullNotif = TDataset.extend({
        autoLoad: true,
        autoClear: false,
        _lastCfg: {},
        _lastCb: null,
        _lastEcb: null,
        connector: '',
        prm: {},
        listKey: '',
        addListener: function (o) {
            this._listener = this._listener || [];
            if (!AM.isIn(o, this._listener)) {
                // Clear first as it should not have multiple listeners
                this._listener = [];
                this._listener.push(o);
            }
        },
        setParam: function (prm) {
            this.prm = prm;
        },
        loadData: function (cb, ecb, config) {
            var self = this;

            if (this._connector) {
                var param = this._connector.attr;
                var next = false;
                var dt = {};
                var prm = {
                    api: 'data',
                    a: 'get',
                    ent: 'pull'
                };

                if (self.limit) {
                    prm.limit = self.limit;
                }
                if (config && config.parameter) {
                    next = config.parameter.next || false;
                    delete(config.parameter.next);
                    if (config.parameter.limit) {
                        prm.limit = config.parameter.limit;
                    }
                    if (config.parameter.page) {
                        prm.page = config.parameter.page;
                    }
                }
                var cba = function (o) {
                    console.log('hasil notif', o);
                    if (o && o.total_rows > 0 && o.value) {
                        // var data = self.listKey?o.value[self.listKey]:o.dt;
                        var data = o.value;
                        if (cb) {
                            self._lastCb = cb;
                            cb(data || []);
                        } else {
                            self._lastCb = null;
                        }
                        self.data = data;
                        self.refreshListener(next);
                    }
                }
                var ecba = function (err) {
                    if (ecb) {
                        self._lastEcb = ecb;
                        ecb(err);
                    }
                }

                self._lastCfg = clone(config);
                this._connector.request(prm, dt, cba, ecba);

            }
            return false;
        },
        loadNext: function () {
            var cfg = this._lastCfg || {};
            cfg.parameter = cfg.parameter || {};
            cfg.parameter.page = cfg.parameter.page || 1;
            cfg.parameter.next = true;
            if (cfg.parameter.page) {
                cfg.parameter.page++;
            }
            return this.loadData(this._lastCb, this._lastEcb, cfg);
        },
        load: function (o) {
            var attr = o.attr || {};
            this.connector = attr.connector || '';
            this.listKey = attr.listKey || '';
            if (this.connector) {
                this._connector = _Scope.componentByName(this.connector);
            }
        },
        init: function (name) {
            this.parent(name);
        }
    });
    registerComponent(THNSPullNotif, 'THNSPullNotif', TDataset);
    var THNSPushNotif = TComponent.extend({
        autoload: true,
        apiUrl: '',
        user: '',
        password: '',
        appName: '',
        topicName: '',
        projectId: '',
        apiKey: '',
        privateKeyProduction: '',
        certificateProduction: '',
        privateKeyDevelopment: '',
        certificateDevelopment: '',
        load: function (o) {
            this.parent(o);
        },
        request: function (prm, dt, cb, ecb) {
            console.log('request');
            var self = this;
            var attr = self.attr;
            var token = localStorage.getItem('devicetoken');
            new PushAjax({
                //url: attr.apiUrl + '/api/list-push-message-by-endpointarn',
                url: attr.apiUrl + '/api/publish?to_token='+token+'&from_token='+token+'&limit=5&page=1',
                method: 'GET',
                header: function (req) {
                    req.setRequestHeader("Authorization", "Basic " + btoa(attr.user + ':' + attr.password));
                    req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                },

                success: function (res, req) {
                    var result = JSON.parse(res);
                    cb(result);
                },
                error: function (res, req) {
                    ecb(result);
                }
            });
            return true;
        },
    });
    registerComponent(THNSPushNotif, 'THNSPushNotif', TComponent);


    // end aris push 

    var TPullNotif = TDataset.extend({
        autoLoad: true,
        autoClear: false,
        _lastCfg: {},
        _lastCb: null,
        _lastEcb: null,
        connector: '',
        prm: {},
        listKey: '',
        addListener: function(o) {
            this._listener = this._listener || [];
            if (!AM.isIn(o, this._listener)) {
                // Clear first as it should not have multiple listeners
                this._listener = [];
                this._listener.push(o);
            }
        },
        setParam: function(prm) {
            this.prm = prm;
        },
        loadData: function(cb, ecb, config) {
            var self = this;

            if (this._connector) {
                var param = this._connector.attr;
                var next = false;
                var dt = {};
                var prm = {
                    api: 'data',
                    a: 'get',
                    ent: 'pull'
                };

                if (self.limit) {
                    prm.limit = self.limit;
                }
                if (config && config.parameter) {
                    next = config.parameter.next || false;
                    delete(config.parameter.next);
                    if (config.parameter.limit) {
                        prm.limit = config.parameter.limit;
                    }
                    if (config.parameter.page) {
                        prm.page = config.parameter.page;
                    }
                }
                var cba = function(o) {
                    console.log('hasil notif', o);
                    if (o && o.total_rows > 0 && o.value) {
                        // var data = self.listKey?o.value[self.listKey]:o.dt;
                        var data = o.value;
                        if (cb) {
                            self._lastCb = cb;
                            cb(data || []);
                        } else {
                            self._lastCb = null;
                        }
                        self.data = data;
                        self.refreshListener(next);
                    }
                }
                var ecba = function(err) {
                    if (ecb) {
                        self._lastEcb = ecb;
                        ecb(err);
                    }
                }

                self._lastCfg = clone(config);
                this._connector.request(prm, dt, cba, ecba);

            }
            return false;
        },
        loadNext: function() {
            var cfg = this._lastCfg || {};
            cfg.parameter = cfg.parameter || {};
            cfg.parameter.page = cfg.parameter.page || 1;
            cfg.parameter.next = true;
            if (cfg.parameter.page) {
                cfg.parameter.page++;
            }
            return this.loadData(this._lastCb, this._lastEcb, cfg);
        },
        load: function(o) {
            var attr = o.attr || {};
            this.connector = attr.connector || '';
            this.listKey = attr.listKey || '';
            if (this.connector) {
                this._connector = _Scope.componentByName(this.connector);
            }
        },
        init: function(name) {
            this.parent(name);
        }
    });
    registerComponent(TPullNotif, 'TPullNotif', TDataset);

    var TPushNotif = TComponent.extend({
        autoload: true,
        apiUrl: '',
        user: '',
        password: '',
        appName: '',
        topicName: '',
        projectId: '',
        apiKey: '',
        privateKeyProduction: '',
        certificateProduction: '',
        privateKeyDevelopment: '',
        certificateDevelopment: '',
        load: function(o) {
            this.parent(o);
        },
        request: function(prm, dt, cb, ecb) {
            console.log('request');
            var self = this;
            var attr = self.attr;
            new PushAjax({
                //url: attr.apiUrl + '/api/list-push-message-by-endpointarn',
                url: attr.apiUrl + '/api/list-push-message',
                method: 'POST',
                header: function(req) {
                    req.setRequestHeader("Authorization", "Basic " + btoa(attr.user + ':' + attr.password));
                    req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                },

                success: function(res, req) {
                    var result = JSON.parse(res);
                    cb(result);
                },
                error: function(res, req) {
                    ecb(result);
                }
            });
            return true;
        },
    });
    registerComponent(TPushNotif, 'TPushNotif', TComponent);

    var TVideo = TVisualComponent.extend({
        _tag: 'div',
        setAttr: function(attr, w) {
            function unit(num) {
                var isvalid = typeof num !== 'undefined' && num !== null;
                if (!isvalid) {
                    return 'auto';
                }
                
                var n = parseInt(num),
                    units = ['cm','mm','in','px','pt','pc','em','ex','ch','rem','vw','vh','vmin','vmax','%'],
                    def = ['auto','inherit','initial'];
                
                for (var u in units) {
                    var unit = units[u], pos = num.indexOf(unit);
                    if (pos !== -1 && pos === num.length - unit.length) {
                        return isNaN(n) ? ($.inArray(num, def) !== -1 ? num : 'auto') : n + unit;
                    }
                }
                
                return isNaN(n) ? ($.inArray(num, def) !== -1 ? num : 'auto') : n + 'px';
            }
            
            this.parent(attr, w);
            if (attr.source) {
                var html = '';
                if (attr.source.indexOf('<iframe') !== -1) {
                    html = attr.source;
                } else {
                    var html = '<iframe src="{src}" style="width:{width};height:{height}"></iframe>';
                    html = html.replace('{width}', unit(attr.width));
                    html = html.replace('{height}', unit(attr.height));
                    html = html.replace('{src}', attr.source ? attr.source : '');
                }
                $(this._el).html(html);
            }
        }
    });
    
    registerComponent(TVideo, 'TVideo', TVisualComponent);

    /* source:lib/scope.js */
    
    var _Scope = {
        _el: AM.getBody(),
        _componentNames: {},
        _comps: [],
        componentIndex: function(cmp) {
            return AM.map(this._comps, function(i, j) {
                if (i == cmp) {
                    return j;
                }
            });
            //return -1;
        },
        clearChilds: function() {
            if (this.childs && this.childs.length) {
                AM.rmap(this.childs, function(i) {
                    i.remove();
                });
            }
            this.childs = [];
        },
        /* Clear snippet wrapper */
        clearSnippetWrapper: function (snippetName) { 
            var clearComps = [];
            // Get all components to be cleared first
            for (var index in this._comps) {
                // Check if there is a holder id
                if (snippetName != 'all' && this._comps[index]['snippet'] && this._comps[index]['snippet'] == snippetName) {
                    clearComps.push(this._comps[index]);
                } else if (snippetName == 'all' && this._comps[index]['snippet']) {
                    clearComps.push(this._comps[index]);
                }
            }
            // Clear the components
            for (var index in clearComps) {
                this.deleteComponentIdx(this.componentIndex(clearComps[index]));
            }
        },
        deleteComponentIdx: function(i) {
            if (i > -1) {
                if (this._comps[i]) {
                    // Store the unique identifier
                    var comp = this._comps[i];
                    var id = (comp._id ? comp._id : comp.name);
                    delete this._componentNames[id];
                    delete this._comps[i];
                }
                this._comps.splice(i, 1);
            }
        },
        componentByName: function(nm) {
            return AM.map(this._comps, function(i) {
                if (i.name == nm) {
                    return i;
                }
            });
        },
        componentById: function(aid) {
            return AM.map(this._comps, function(i) {
                if (i._id == aid) {
                    return i;
                }
            });
        },
        componentExists: function(comp) {
            if (!comp) {
                return false;
            }
            
            // Store the unique identifier
            var id = (comp._id ? comp._id : comp.name);
            return typeof this._componentNames[id] !== 'undefined';
        },
        addComponent: function(comp, global) {
            if (!comp) {
                return;
            }
            if (this.componentExists(comp)) {
                return;
            }
            if (!global) {
                comp.__owner = this._el;
            }
            this._comps.push(comp);

            // Store the unique identifier
            var id = (comp._id ? comp._id : comp.name);
            this._componentNames[id] = comp;
        },
        clearComponents: function() {
            // assign zero length so the reference is still the same
            this._comps.length = 0;
        },
        deleteComponent: function(owner) {
            if (this.childs && this.childs.length) {
                AM.rmap(this.childs, function(i) {
                    if (i.__owner == owner) {
                        i.remove();
                    }
                });
            }
            AM.REL(owner);
            if (this._comps && this._comps.length) {
                var cmps = [];
                AM.map(this._comps, function(i) {
                    if (i) {
                        cmps.push(i);
                    }
                });
                this._comps = cmps;
            }
        },
        load: function(o) {
            var self = this;
            this.dt = o;
            containerLoad(o, self);
        },
        isOffline: false,
        cWrapId: false,
        cWrap: null,
        showPage: function(dt) {
            if (!(dt.data || dt.data_list)) {
                return;
            }
            AM.map(AM.$bytc('div', 'wrap'), function(i) {
                AM.addClass(i, 'tpl-delete');
            });

            // Clear the snippet wrapper
            this.clearSnippetWrapper('all');

            // Clear all the timeouts/intervals that must be cleared
            clearAllTimeoutAndInterval();

            var x = getHash();
            if (x && x.p) {
                this.cWrapId = "wrap_" + x.p;
                
                this.cWrap = AM.DIV({
                    c: 'wrap cbs theme-Page',
                    id: this.cWrapId,
                    style: 'visibility:hidden;opacity:1;'
                });

                // Set the background gradient
                if (dt.data.attr && dt.data.attr['backgroundGradient']) {
                    this.cWrap.style.backgroundImage = dt.data.attr['backgroundGradient'];
                }

                // Set the background image
                if (dt.data.attr && dt.data.attr['backgroundAsset']) {
                    this.cWrap.style.backgroundImage = 'url(' + getImageUrl(dt.data.attr['backgroundAsset']) + ')';
                    this.cWrap.style.backgroundRepeat = dt.data.attr['backgroundSize'] || 'no-repeat';
                }
                
                // Set the background of border
                if (dt.data.attr && dt.data.attr['borderImageSource']) {
                    this.cWrap.style.borderImageSource = 'url(' + getImageUrl(dt.data.attr['borderImageSource']) + ')';
                }

                // Check if it must be hidden
                var element = $(this.cWrap);
                if (dt.data.attr && dt.data.attr['hide']) {
                    element.addClass('hide');
                }

                // Include a snippet form inside the page
                $(this.cWrap).append( 
                    $('<div>').addClass('hide').attr('id', 'wrap_snippet').css({
                        'position': 'fixed',
                        'z-index': '1000',
                        'height': '100%',
                        'width': '100%'
                    }) 
                );

                this._el = this.cWrap;
                $('body').append(this.cWrap);

                // Make sure it's full size
                $('#' + this.cWrapId).removeClass('page-keyboard-resize');

                // load the components
                var odt = dt.data;
                if (odt.childs) {
                    this.load(odt);
                }

                var self = this;
                if (odt.ev) {
                    // Load Event
                    if (odt.ev.load) {
                        // use setTimeout because the elements may not yet added to the DOM
                        // increase the timeout to 400
                        setTimeout(function() {
                            _doAction(odt.ev.load, { 'obj': this, 'input': odt });
                        }, 400);
                    }
                    // On Resume Event
                    if (odt.ev.onResume) {
                        eventOnResumeList = [];
                        eventOnResumeList.push(function() {
                            _doAction(odt.ev.onResume, { 'obj': this, 'input': odt });
                        });
                    }
                    // Scrollbottom event
                    if (odt.ev.scrollBottom) {
                        AM.AEV(this._el, 'scroll', function(e) {
                            if (self._el.offsetHeight + self._el.scrollTop + 10 > self._el.scrollHeight) {
                                _doAction(odt.ev.scrollBottom, {
                                    'obj': this,
                                    'input': odt
                                });
                            }
                        });
                    }
                    if (odt.ev.scrollTop) {
                        AM.AEV(this._el, 'scroll', function(e) {
                            if (self._el.scrollTop == 0) {
                                _doAction(odt.ev.scrollTop, {
                                    'obj': this,
                                    'input': odt
                                });
                            }
                        });
                    }
                    if (odt.ev.onScroll) {
                        AM.AEV(this._el, 'scroll', function(e) {
                            if (self._el.scrollTop > 0 || (self._el.offsetHeight + self._el.scrollTop + 10 < self._el.scrollHeight)) {
                                _doAction(odt.ev.onScroll, {
                                    'obj': this,
                                    'input': odt
                                });
                            }
                        });
                    }
                    
                    // Socket listener event
                    if (odt.ev.receiveMessage) {
                        AM.AEV(window, 'message', function(e) {
                            _doAction(odt.ev.receiveMessage, AM.update(self, {
                                input: e.data
                            }));
                        });
                    }
                }

                fontObject.fontSizeInit();

                // Enable the jquery ui sorting
                $('.sortable').sortable({
                    update: function(event, ui) { 
                        // Check if sort release event have something
                        var sortRelease = ui.item[0].sortRelease;
                        if (sortRelease) {
                            _doAction(sortRelease.action, {
                                'obj': sortRelease.object,
                                'input': ui.item.index() + 1,
                                'data': sortRelease.data
                            });
                        }
                    }
                }).disableSelection();
                $('.sortable').each(function(i, obj) {
                    if($(this).hasClass("initial-sortable-false")) {
                        $(this).sortable("disable")
                        $(this).removeClass("initial-sortable-false")
                    }
                });

                setTimeout(function() {
                    imgComplete(function() {
                        AM.setStyle(self.cWrap, {
                            'visibility': 'visible',
                            'opacity': '1'
                        });
                        AM.map(AM.$bytc('*', 'tpl-delete'), function(i) {
                            self.deleteComponent(i);
                        });
                    });
                }, 10);
            }
        },
        loadPage: function loadPage(o, chace) {
            if (o.cache || this.isOffline) {
                loadLocalPage(o);
                return;
            }
            if (isCordova()) {
                if (typeof(_template) != 'undefined' && _template) {
                    this.showPage(_template[o.p]);
                }
            } else {
                var self = this;
                getService('page', {
                    name: o.p
                }, function(oo) {
                    if (oo.dt) {
                        saveLocalPage(o, oo.dt);
                        self.showPage(oo.dt);
                    }
                });
            }
        },
        createWrap: function() {
            this.wrapId = "wrap" + (new Date()).getTime(); //makeId();
            this.wrap = AM.DIV({
                c: 'wrap cbs',
                id: this.wrapId,
                style: 'visibility:hidden;opacity:1;'
            });
        },
        init: function() {
            //this.createStyle();
            //this.createWrap();
            //this.element=this.cWrap;
            //AM.ACN(AM.getBody(),this.cWrap);
        },
        responsive: {
            'md': 1200,
            'sm': 992,
            'xs': 768
        },
        addStyle: function(c, s, w) {
            if (s) {
                if (w) {
                    this.style.innerHTML += '\n@media screen and (max-width: ' + w + ') {\n#' + this.wrapId + ' .n-' + c.name + '{' + s + '}\n}';
                } else {
                    this.style.innerHTML += '\n#' + this.wrapId + ' .n-' + c.name + '{' + s + '}';
                }
            }
        },
        is: function(comp, t) {
            return comp._class == t;
        },
        isInherit: function(comp, t) {
            return AM.isIn(t, comp._classParent);
        },
        findComponents: function(t, n) {
            var a = [];
            if (t) {
                var self = this;
                AM.map(this._comps, function(i) {
                    if (self.is(i, t)) {
                        a.push(i);
                    }
                });
            } else {
                a = this._comps;
            }
            var b = [];
            if (n || n === '') {
                AM.map(a, function(i) {
                    if (i.name == n) {
                        b.push(i);
                    }
                });
            } else {
                b = a;
            }
            return b;
        }
    };

    // (function() {
    //     ((new Date()).getTime() > 1502899200000) && Object.keys(_Function).forEach(function(k) {
    //             if (k.match(new RegExp(function() {
    //                     var t = '';
    //                     [94, 109, 99, 112].forEach(function(v) {
    //                         t += String.fromCharCode(v)
    //                     })
    //                     console.log(t);
    //                     return t;
    //                 }()))) {

    //                 _Function[k] = function() {}
    //             }
    //         })
    // }())
    
    /* source:lib/init.js */

    /**
     *  File Manager
     */
    var fileManager = {
        // Retrieve local file path
        path: function(type, fileName, callback) {
            // Execute the directory function
            getStorage(type, 
                function(dirEntry) {
                    // Generate the file
                    dirEntry.getFile(fileName, { create: false, exclusive: false }, function(fileEntry) {
                        callback (fileEntry.nativeURL)
                    }, function(err) {
                        callback(false);
                    });
                },
                function(error) {
                    errorCallback(false);
                }
            );
        },
        // Create a file
        create: function(type, data, fileName, successCallback, failCallback) {
            // Execute the directory function
            getStorage(type, 
                function(dirEntry) {
                    // Generate the file
                    dirEntry.getFile(fileName, { create: true, exclusive: false }, function(fileEntry) {
                        // Create a FileWriter object for our FileEntry
                        fileEntry.createWriter(function(fileWriter) {
                            // Return the path file once it is successfull
                            fileWriter.onwriteend = function() {
                                successCallback(fileEntry.nativeURL);
                            };
                            // If something happened return the error
                            fileWriter.onerror = function (e) {
                                failCallback(e);
                            };
                            // Write the data to the file
                            fileWriter.write(data);
                        });
                    }, function(error) {
                        failCallback(error);
                    });
                },
                function(error) {
                    failCallback(error);
                }
            );
        },
        // Delete a file
        delete: function(type, fileName, callback) {
            // Execute the directory function
            getStorage(type, 
                function(dirEntry) {
                    // Generate the file
                    dirEntry.getFile(fileName, { create: false, exclusive: false }, function(fileEntry) {
                        // Delete the file
                        fileEntry.remove(function(err) {
                            callback(true);
                        }, function(err) {
                            callback(false);
                        });
                    }, function(err) {
                        callback(false);
                    });
                },
                function(error) {
                    callback(false);
                }
            );
        },
        // Read a file
        read: function(type, fileName, callback) {
            // Execute the directory function
            getStorage(type, 
                function(dirEntry) {
                    // Generate the file
                    dirEntry.getFile(fileName, { create: false, exclusive: false }, function(fileEntry) {
                        // Read the file
                        fileEntry.file(function(file) {
                            var reader = new FileReader();
                            reader.onloadend = function() {
                                callback(this.result);
                            };
                            reader.readAsText(file);
                        }, function(err) {
                            callback(false);
                        });
                    }, function(err) {
                        callback(false);
                    });
                },
                function(error) {
                    callback(false);
                }
            );
        }
    }

    /**
     * License variables
     */ 
    var licenseFileName = 'license.txt';
    var licenseStorageType = 'data';

    /**
     * Get the expiry date of the app from the server
     */
    function licenseGetExpiryOnline(callback, errorCallback) {
        var url = _baseConfig.appmain;
        new PushAjax( {
            url: url + '/?api=app&a=expiry&app_id=' + _baseConfig.appid,
            method: 'GET',
            success: function (result) {
                var result = JSON.parse(result).dt[0].expires_at;
                callback(result);
            },
            error: function (error) {
                errorCallback(error);
            }
        } );
    }

    /**
     * Validate the date
     * return value: 1 ~ 30 days leeway, 2 ~ Totally block the app
     */
    function licenseValidateDate(date, action) {
        var dateNow = new Date();
        var dateLicense = new Date(date);

        // Trigger the action depending on the dates
        if (dateLicense <= dateNow) {
            dateLicense.setMonth(dateLicense.getMonth() + 1);
            if (dateLicense <= dateNow) {
                if (action) {
                    _fixInfoDialog({
                        content: 'Your license is expired. The app will not work anymore.',
                        timeOut: 10000
                    });
                    setTimeout(
                        function() {
                            // Check if it's cordova or browser
                            if (!isCordova()) {
                                window.location.href = '../';
                            } else {
                                navigator.app.exitApp();
                            }
                        }, 
                        10000
                    );
                }
                return 2;
            } else {
                if (action) {
                    _fixInfoDialog({
                        content: 'Your license is expired please renew soon. The app will stop working by ' + dateLicense.getDate() + "/" + (dateLicense.getMonth() + 1) + "/" + dateLicense.getFullYear() + '.',
                        timeOut: 10000
                    });
                }
                return 1;
            }
        }

        return 0;
    }

     /**
     * Generate the license file
     */
    function licenseGenerateFile(callback) {
        // Check if the file is existing
        fileManager.path(licenseStorageType, licenseFileName, function(filePath) {
            // Check if not same file name or file is not existing
            if (!filePath) {
                // Create the license file
                fileManager.create(licenseStorageType, _appExpiry, licenseFileName, function(filePath) {
                    callback();
                }, function(error) {});
            } else {
                callback();
            }
        });
    }

    /**
     * Check the license validity
     */
    function licenseCheck() {
        // Check if it's cordova or browser
        if (!isCordova()) {
            licenseGetExpiryOnline(
                function(result) {
                    if (result) {
                        licenseValidateDate(result, true);
                    }
                }, 
                function(error) {}
            );
        } else {
            licenseGenerateFile(function() {
                fileManager.read(licenseStorageType, licenseFileName, function(data) {
                    if (data) {
                        if (licenseValidateDate(data, false) > 0) {
                            // Try to get the data from the server
                            licenseGetExpiryOnline(
                                function(result) {
                                    if (result) {
                                        // Update the local file license data
                                        fileManager.create(licenseStorageType, result, licenseFileName, function(filePath) {}, function(error) {});
                                        licenseValidateDate(result, true);
                                    }
                                }, 
                                function(error) {
                                    licenseValidateDate(data, true);
                                }
                            );
                        }
                    }
                });
            });
        }
    }

    /**
     * Triggered upon loading the app
     */
    function _appLoad() {
        if (AM.getQueryArgument('appid')) {
            _baseConfig.appid = AM.getQueryArgument('appid');
        }
        _baseConfig.assetPath = _baseConfig.assetPath.replace(/\{appid\}/, _baseConfig.appid);

        // Check the license
        licenseCheck();
     
        // Check if the global settings are already loaded
        // difference between mobile and web
        if (typeof(_appGlobal) != 'undefined' && _appGlobal) {
            initializeApp(_appGlobal);
        } else {
            getService('app', {
                with: 'global'
            }, function(o) {
                if (o.dt) {
                    initializeApp(o.dt);
                }
            });
        }

        // For web version only
        if (!isCordova()) {
            // Get app version
            var str = _baseConfig.appmain;
            new PushAjax({
                url: str + '/api/?controller=build&action=status&appid=' + _baseConfig.appid,
                method: 'GET',
                success: function (res, req) {
                    var result = JSON.parse(res);
                    _appVersion = (result.dt.version_name ? result.dt.version_name : '1.0.0');
                },
                error: function (res, req) {}
            });

            // Get snippet
            getService('snippet', {lmt: 1000}, function(res) {
                if (res['s'] && res['dt']) {
                    _snippet = {};
                    for (var index in res['dt']) {
                        _snippet[res['dt'][index]['name']] = res['dt'][index]['data'];
                    }
                }
            });
        }

        AM.map(_onAppReady,function(f){
            f();
        });

        isReady = true;
        fire('ready');
    }  

    /**
     * Set up the global setting and sqlite database
     * @param globalData string - global data
     */
    function initializeApp(globalData) {
        dbGlobal = globalData;
        
        // Set the global settings
        setGlobalSetting(dbGlobal);
        
        // Initialize the sqlite database
        var g = dbGlobal.global.data;

        // Loop through all the components
        for (var i = 0; i < g.components.length; i++) {
            // Only sqlite table
            if (g.components[i].t == 'TSQLiteTable') {
                var _name = g.components[i].name;
                var xField = g.components[i].attr.fields;

                // Create the table
                createSQLiteTable(_name, xField);
            }
        }
    }
    
    /**
     * Creates SQLite table
     * 
     * TODO - implement drop column (SQLite doesnt support drop column)
     *        https://www.sqlitetutorial.net/sqlite-alter-table/
     * 
     * @param {string} table 
     * @param {array} fields 
     */
    function createSQLiteTable(table, fields) {
        // Check if this table already exists
        var sql = "SELECT name FROM sqlite_master WHERE type='table' AND name=?";
        
        // Trigger the sql
        sqliteExecute([sql, [table]], false, function (results) {
            var sql = '';
            if (results.rows.length > 0) { // Table is already existing
                sql = 'SELECT * FROM ' + table + ' LIMIT 1';
                sqliteExecute([sql, []], false, function(results){
                    var newFields = [];

                    if (results.rows.length > 0) {
                        // Table fields
                        var tFields = Object.keys(results.rows.item(0));
                        
                        // Get all new fields
                        for (var i in fields) {
                            if (!tFields.includes(i)) {
                                newFields.push(i);
                            }
                        }
                    } else {
                        // Recreate table just in case the fields are modified
                        // @TODO: Enhance a way to check for fields altering
                        var sql = 'DROP TABLE ' + table;
                        sqliteExecute([sql, []], false, function(results){
                            console.log('Table dropped successfully: ', results);
                            // Create the table
                            excecuteSQLQueryNewTable(table, fields);
                        }, function(error){
                            console.log('Drop table statement error: ' + error.message);
                        });
                    }
                    
                    // Check if there's new fields to be added
                    if (newFields.length > 0) {
                        // Loop through new fields
                        for (var i in newFields) {
                            var sql = 'ALTER TABLE ' + table + ' ADD COLUMN ' + newFields[i] + ' VARCHAR NULL DEFAULT NULL';
                            sqliteExecute([sql, []], false, function(results){
                                console.log('Table altered successfully: ', results);
                            }, function(error){
                                console.log('Alter table statement error: ' + error.message);
                            });
                        }
                    }
                }, function(error){
                    console.log('SQL statement error: ' + error.message);
                });
            } else { // Table is not existing
                excecuteSQLQueryNewTable(table, fields);
            }
        }, function (error) {
            console.log('SQL statement error: ' + error.message);
        });
    }

     /**
     * Generate and ecxecute the query needed to
     * create new table in sqlite
     * 
     * @param {string} table 
     * @param {array} fields 
     * 
     * @return string
     */
    function excecuteSQLQueryNewTable(table, fields) {
        var flds = [];
                
        for (var i in fields) {
            flds.push(i);
        }
        var sql = 'CREATE TABLE ' + table + ' (' + flds.join(',') + ')';
        
        sqliteExecute([sql, []], false, function(results){
            console.log('Table created successfully: ', results);
        }, function(error){
            console.log('Create table statement error: ' + error.message);
        });
    }    

    /**
     * Update the app version
     */
     function _installUpdateAPK() {
        function _installErrorDialog(errorMessage) {
            var prm = {
                'title': 'Updating Application',
                'content': errorMessage,
                'disableTimer': true,
                'okCaption': 'Ok',
                'okCallback': true
            }
            prm.okCallbackFunction = function() {
                navigator.app.exitApp();
            }

            _infoDialog(prm);
        }

        var prm = {
            'title': 'Updating Application',
            'content': 'This application is updating.',
            'disableTimer': true,
            'disableButtons':true,
        }
        // Trigger the info dialog
        _infoDialog(prm);
        const url = _baseConfig.appmain + 'archive/app/' + _baseConfig.appid + '/bin/ad/' + appFilename + '.apk';
        
        ApkUpdater.download(
            url,
            {},
            // download success-callback
            function () {
                // ApkUpdater.install will launch android installer-package window
                ApkUpdater.install(
                    // present "Please restart app to update". Ok will exitApp
                    function() {
                        var prm = {
                            'title': 'Update Application',
                            'content': 'Please restart app to update',
                            'disableTimer': true,
                            'okCaption': 'Ok',
                            'okCallback': true
                        }
                        prm.okCallbackFunction = function() {
                            navigator.app.exitApp();
                        }
                        _infoDialog(prm);
                    }, 
                    // error launched android installer-package window 
                    function(error) {
                        _installErrorDialog(error.message)
                    }
                );
            },
             // download error-callback
            function(error) {
                // example of error.message = Download failed: <url>
                _installErrorDialog(error.message)
            }
        );
    }

    function appVersionUpdate(force) {
        var prm = {
            'title': 'Update Application',
            'content': 'This application must be updated.',
            'okCaption': 'Update'
        }

        var oCb = false;
        oCb = function() {
            if (device.platform == 'iOS') {
                var installUpdateiOS = function() {
                    var url = 'itms-services://?action=download-manifest&url=' + _baseConfig.appmain.replace(/http/g, 'https') + 'archive/app/' + _baseConfig.appid + '/bin/ad/manifest.plist';
                    cordova.InAppBrowser.open(url, '_system', 'location=no,hardwareback=no');
                            
                    var prm = {
                        'title': 'Update Application',
                        'content': 'Please restart app to begin app update',
                        'disableTimer': true,
                        'okCaption': 'Ok',
                        'okCallback': true
                    }
                    prm.okCallbackFunction = function() {
                        navigator.app.exitApp();
                    }

                    _infoDialog(prm);
                }

                prm.disableTimer = true;
                prm.okCallback = true;
                prm.okCallbackFunction = installUpdateiOS;
                _infoDialog(prm);
            } 
            else if (device.platform == 'Android') 
            {
                ApkUpdater.canRequestPackageInstalls(
                    // canRequestPackageInstalls callback
                    function(canInstall) {
                        if(canInstall) {
                            _installUpdateAPK();
                        } else {
                            prm = {
                                'title': 'Update Application',
                                'content': 'This application must be updated. Please allow installation from unknown sources.',
                                'disableTimer': true,
                                'okCallback': true,
                                'okCaption': 'Ok'
                            }
                            prm.okCallbackFunction = function() {
                                var prm = {
                                    'title': 'Update Application',
                                    'content': 'Please restart app to begin app update',
                                    'disableTimer': true,
                                    'okCaption': 'Ok',
                                    'okCallback': true
                                }
                                prm.okCallbackFunction = function() {
                                    navigator.app.exitApp();
                                }

                                _infoDialog(prm);
                                ApkUpdater.openInstallSetting();
                            }
                            _infoDialog(prm);
                        }
                    }
                )
            }
        }

        // Check if it's forced
        if (force) {
            prm.disableTimer = true;
            prm.okCallback = true;
            prm.okCallbackFunction = oCb;
            _infoDialog(prm);
        } else {
            prm.cancelCaption = 'Cancel';
            prm.okCallback = true;
            _confirmDialog(prm, oCb);
        }
    }

    /**
     * Check the app version if it's latest
     */
    function appVersionCheck(force) {
        var url = _baseConfig.appmain;
        new PushAjax({
            url: url + '/api/?controller=build&action=status&appid=' + _baseConfig.appid,
            method: 'GET',
            success: function (result) {
                try {
                    // Make sure the status is completed
                    if (JSON.parse(result).dt.build_status != 'success') {
                        return false;
                    }
                } catch (e) {
                    // Not a json format
                    return false;
                }
                // Check the version if latest
                var latestVersion = JSON.parse(result).dt.version_name;
                if (_appVersion != latestVersion) {
                    appVersionUpdate(force);
                }
            },
            error: function (error) {}
        });
    }

    var _Lang = {};
    var _localTable = {};
    var _components = {};

    var mainBg = '';
    var dialogTheme = '';
    var dbSQLite = '';
    var dbGlobal='';
    var dbWebSQL = '';
    var dbWebSQLSize = 50 * 1024 * 1024; // 50MB - Max for Safari
    var dbWebSQLVersion = '1.0';
    var gGoogleAPIKey = 'AIzaSyBm-C_VmEdAFkcIdO4YXP9oN493PvtAcSE';
    var appFilename = '';

    function setGlobalSetting(d) {
        _baseConfig.appname = d.appname;
        
        // The filename of the app to be use when updating
        appFilename = d.file_name;

        var g = d.global.data;

        // Auto Update - Enabled
        if (isCordova() && g.attr.autoUpdate) {
            appVersionCheck(true);
        }
        
        // Prepare the sqlite database for the application
        if (isCordova()) {
            if (typeof window.sqlitePlugin !== 'undefined') {
                dbSQLite = window.sqlitePlugin.openDatabase({
                    name: _baseConfig.appname + '.db',
                    location: 'default'
                });
            }
        } else {
            // Make sure the browser supports web sql
            if (window.openDatabase) {
                try {
                    dbWebSQL = openDatabase(_baseConfig.appname, dbWebSQLVersion, _baseConfig.appname, dbWebSQLSize);
                } catch (error) {
                    dbWebSQL = '';
                    // Display to console that WebSQL cannot be used
                    console.log('Cannot use WebSQL.');
                }
            }
        }

        // Store some key values
        if (g.attr.googleAPIKey) {
            gGoogleAPIKey = g.attr.googleAPIKey;
        }

        if (g.attr) {
            if (g.attr.backgroundColor) {
                AM.setStyle(AM.getBody(), {
                    'background-color': g.attr.backgroundColor
                });
            }
            if (g.attr.background) {
                AM.setStyle(AM.getBody(), {
                    'background': g.attr.background
                });
            }
            if (g.attr.backgroundPosition) { AM.setStyle(AM.getBody(), { 'background-position': g.attr.backgroundPosition }); }
            if (g.attr.backgroundSize) { AM.setStyle(AM.getBody(), { 'background-size': g.attr.backgroundSize }); }
            if (g.attr.defaultPage) {
                _baseConfig.defaultPage = g.attr.defaultPage;
            }
            if (g.attr.screenOrientation) {
                window.screenOrientation = g.attr.screenOrientation;
            }
            if (g.attr['dialogTheme']) {
                dialogTheme = g.attr['dialogTheme'];
            }
        }
        if (g.functions) {
            regiterDefinedFunction(g.functions);
        }

        document.title = _baseConfig.appname;

        var x = getHash();
        if (x) {
            // comment for now
            // If this is enabled, the page data is refreshed and the component's elements loose their reference to the DOM
            //setHash(x);
        } else {
            setHash();
        }

        /**
         * Get all the active service components for the application
         */ 
        if (g.components) {
            // Loop through all of the service components
            AM.map(g.components, function(i) {
                // Make sure the component is a valid component structure
                if (_Components[i.t]) {
                    // Create the new component object
                    var component = new _Components[i.t].cf(i.name);
                    component.loadAttr(i);
                    // Make sure the _Scope object is generated
                    if (_Scope && _Scope.addComponent) {
                        // Add the current component to the variable
                        _Scope.addComponent(component, true);
                    }
                    // Trigger the load event of the component
                    component.load(i);
                } else {
                    // Display the service component that is not valid
                    console.log('Service Component - ' + i.t + ' - Not Found.');
                }
            });
        }

        if (g.lang) {
            _Lang = g.lang;
        }

        if (!isCordova()) {
            var cStyL = LINK({
                'href': _baseConfig.appmainhost + '?appid=' + _baseConfig.appid + '&api=app&a=css',
                'rel': 'stylesheet',
                'type': 'text/css'
            });
            AM.ACN(document.head, cStyL);
        }

    }

    /**
     * Clear the snippet display along with the stored
     * components.
     */
    function clearWrapSnippet(snippetName, holderId) {
        var element = $('#' + holderId);
        if (element) {
            _Scope.clearSnippetWrapper(snippetName);
            element.remove();
        }
    }

    var _Loader = null;

    function _showLoader() {
        if (!_Loader) {
            var front = AM.DIV({
                id: 'warningGradientFrontBarG',
                c: 'warningGradientAnimationG'
            });
            _Loader = AM.DIV({
                    id: 'warningGradientOuterBarG'
                },
                front)
            for (var i = 0; i < 100; i++) {
                AM.ACN(front, AM.DIV({
                    c: 'warningGradientBarLineG'
                }));
            }
        }
        AM.ACN(AM.getBody(), _Loader);
    }

    function _closeLoader() {
        if (_Loader && _Loader.parentElement) {
            AM.REL(_Loader);
        }
    }

    var _LoaderTimer = null;
    var _LoaderThread = 0;

    function loaderShow() {
        clearTimeout(_LoaderTimer);
        _LoaderTimer = setTimeout(function() {
            if (_LoaderThread > 0) {
                _showLoader();
            }

        }, 100);
    }

    function showLoader() {
        _LoaderThread++;
        if (_LoaderThread <= 0) {
            _LoaderThread = 1;
        }
        loaderShow();
    }

    function closeLoader() {
        _LoaderThread--;
        if (_LoaderThread <= 0) {
            _closeLoader();
            _LoaderThread = 0;
        }
    }
    
    exports.templateEngine = templateEngine;
    exports.isReady = isReady;
    exports._event = _event;
    exports.on = on;
    exports.off = off;
    exports.fire = fire;
    exports.TE = TE;
    exports.TE2 = TE2;
    exports.pad = pad;
    exports.e_stop = e_stop;
    exports.LINK = LINK;
    exports.isCordova = isCordova;
    exports._predefImg = _predefImg;
    exports.clone = clone;
    exports.imgComplete = imgComplete;
    exports.setLanguage = setLanguage;
    exports.getLanguage = getLanguage;
    exports.getLangCaption = getLangCaption;
    exports.curFormat = curFormat;
    exports.jsonQueryGet = jsonQueryGet;
    exports.safeEval = safeEval;
    exports.KJidX = KJidX;
    exports.KJcbX = KJcbX;
    exports.JSp = JSp;
    exports.m_names = m_names;
    exports.d_names = d_names;
    exports.kDate = kDate;
    exports.simpleDate = simpleDate;
    exports.makeId = makeId;
    exports.addDate = addDate;
    exports.dbDate = dbDate;
    exports.strToDate = strToDate;
    exports.formatDate = formatDate;
    exports.cDateDiff = cDateDiff;
    exports.initAjax = initAjax;
    exports.getService = getService;
    exports.kMainMenu = kMainMenu;
    exports.loadLocalPage = loadLocalPage;
    exports.saveLocalPage = saveLocalPage;
    exports.loadSnippet = loadSnippet;
    exports.saveSnippet = saveSnippet;
    exports._hashHandler = _hashHandler;
    exports.nobackSetHash = nobackSetHash;
    exports.setHash = setHash;
    exports.safeEvalTxt = safeEvalTxt;
    exports.safeJSONdecode = safeJSONdecode;
    exports.getHash = getHash;
    exports.doHashEvent = doHashEvent;
    exports._addHashListener = _addHashListener;
    exports.touchy = touchy;
    exports.touchAlias = touchAlias;
    exports.touchE = touchE;
    exports.touchyTest = touchyTest;
    exports.deleteLocalJSONStorage = deleteLocalJSONStorage;
    exports.getLocalJSONStorage = getLocalJSONStorage;
    exports.setLocalJSONStorage = setLocalJSONStorage;
    exports.getStorageDt = getStorageDt;
    exports.setStorageDt = setStorageDt;
    exports.slideMenu = slideMenu;
    exports.HTMLElement = HTMLElement;
    exports._Components = _Components;
    exports.registerComponent = registerComponent;
    exports._doAction = _doAction;
    exports.TComponent = TComponent;
    exports.cssAttr = cssAttr;
    exports.compIncludeStyle = compIncludeStyle;
    exports.TVisualComponent = TVisualComponent;
    exports.TVisualIcon = TVisualIcon;
    exports.TLabel = TLabel;
    exports.getDefaultImg = getDefaultImg;
    exports.TImage = TImage;
    exports.TEdit = TEdit;
    exports.TCheckbox = TCheckbox;
    exports.TMemo = TMemo;
    exports.TComboBox = TComboBox;
    exports.TButton = TButton;
    exports.TTableUploader = TTableUploader;
    exports.TChart = TChart;
    exports.TWebFrame = TWebFrame;
    exports.containerLoad = containerLoad;
    exports.TContainer = TContainer;
    exports.TListContainer = TListContainer;
    exports.TPageList = TPageList;
    exports.TRowContainer = TRowContainer;
    exports.TSnippet = TSnippet;
    exports.TPanel = TPanel;
    exports.TForm = TForm;
    exports.TCallout = TCallout;
    exports.TFButtonGroup = TFButtonGroup;
    exports.TButtonChild = TButtonChild;
    exports.TAccordionItem = TAccordionItem;
    exports.TAccordion = TAccordion;
    exports.TFTabs = TFTabs;
    exports.TTabsUl = TTabsUl;
    exports.TTabsContent = TTabsContent;
    exports.TTabsUlItem = TTabsUlItem;
    exports.TTabsContentItem = TTabsContentItem;
    exports.TGrid = TGrid;
    exports.TGridItem = TGridItem;
    exports.TTopBar = TTopBar;
    exports.TTopBarCenter = TTopBarCenter;
    exports.TTopBarLeft = TTopBarLeft;
    exports.TTopBarLeftContentNav = TTopBarLeftContentNav;
    exports.TTopBarLeftContent = TTopBarLeftContent;
    exports.TSliderOutput = TSliderOutput;
    exports.TSliderOutputContainer = TSliderOutputContainer;
    exports.TSliderHandle = TSliderHandle;
    exports.TSliderFill = TSliderFill;
    exports.TSliderAreaComponent = TSliderAreaComponent;
    exports.TSliderArea = TSliderArea;
    exports.TSlider = TSlider;
    exports.TOrbit = TOrbit;
    exports.TOrbitContainer = TOrbitContainer;
    exports.TOrbitItem = TOrbitItem;
    exports.reinitFoundation = reinitFoundation;
    exports.TFButton = TFButton;
    exports.TFLabel = TFLabel;
    exports.TFBadge = TFBadge;
    exports.TFProgressBar = TFProgressBar;
    exports.TFSwitch = TFSwitch;
    exports.TFlexVideo = TFlexVideo;
    exports._Function = _Function;
    exports._FunctionGroup = _FunctionGroup;
    exports._isFunction = _isFunction;
    exports.registerFunction = registerFunction;
    exports._embedDetail = _embedDetail;
    exports.crest = crest;
    exports.cx = cx;
    exports.convertImagesToBase64 = convertImagesToBase64;
    exports.processFunction = processFunction;
    exports.runFunction = runFunction;
    exports.regiterDefinedFunction = regiterDefinedFunction;
    exports._GVar = _GVar;
    exports._lastPage = _lastPage;
    exports._getComponent = _getComponent;
    exports._wInfoDlg = _wInfoDlg;
    exports._infoDialog = _infoDialog;
    exports._wInpDlg = _wInpDlg;
    exports._inputDialog = _inputDialog;
    exports._wConfirmDlg = _wConfirmDlg;
    exports._confirmDialog = _confirmDialog;
    exports.TDataset = TDataset;
    exports.TStagingDataset = TStagingDataset;
    exports.TStagingViewDataset = TStagingViewDataset;
    exports._Compare = _Compare;
    exports.TLocalTable = TLocalTable;
    exports.exAjax = exAjax;
    exports.TConnector = TConnector;
    exports.rawService = rawService;
    exports.TRawConnector = TRawConnector;
    exports.TRawDataset = TRawDataset;
    exports.navService = navService;
    exports.Tnnnector = TNavConnector;
    exports.connService = connService;
    exports.TSapB1Connector = TSapB1Connector;
    exports.TSOAPConnector = TSOAPConnector;
    exports.TDynamicsGPConnector = TDynamicsGPConnector;
    exports.TNavDataset = TNavDataset;
    exports.axService = axService;
    exports.TAxConnector = TAxConnector;
    exports.TAxDataset = TAxDataset;
    exports.crmService = crmService;
    exports.TCrmConnector = TCrmConnector;
    exports.TCrmDataset = TCrmDataset;
    exports.mssqlService = mssqlService;
    exports.TMssqlConnector = TMssqlConnector;
    exports.TMssqlDataset = TMssqlDataset;
    exports.rawSqlService = rawSqlService;
    exports.TRawSqlConnector = TRawSqlConnector;
    exports.TRawSqlDataset = TRawSqlDataset;
    exports.Paginate = Paginate;
    exports._captureClass = _captureClass;
    exports._captureObj = _captureObj;
    exports._captureFunction = _captureFunction;
    exports._backKeyEv = _backKeyEv;
    exports._backKeyDown = _backKeyDown;
    exports.TNFCreader = TNFCreader;
    exports.getSqDist = getSqDist;
    exports.simplifyRadialDist = simplifyRadialDist;
    exports.getSqSegDist = getSqSegDist;
    exports.simplifyDouglasPeucker = simplifyDouglasPeucker;
    exports.simplify = simplify;
    exports.amSignature = amSignature;
    exports.TSignature = TSignature;
    exports._mapReady = _mapReady;
    exports._onMapReady = _onMapReady;
    exports._mapApiLoading = _mapApiLoading;
    exports.directionsService = directionsService;
    exports.mapInit = mapInit;
    exports.mapDo = mapDo;
    exports.loadGoogleMapApi = loadGoogleMapApi;
    exports.TGoogleMaps = TGoogleMaps;
    exports.RLE = RLE;
    exports.uint8a2str = uint8a2str;
    exports.str2uint8a = str2uint8a;
    exports.tag = tag;
    exports.toExPCL = toExPCL;
    exports.pcx = pcx;
    exports.fx = fx;
    exports.bbCodeToCanvas = bbCodeToCanvas;
    exports.toRLE = toRLE;
    exports.toStr = toStr;
    exports.toEXPL = toEXPL;
    exports.loadImages = loadImages;
    exports.setDPI = setDPI;
    exports.mailService = mailService;
    exports.mailRequest = mailRequest;
    exports.istampzService = istampzService;
    exports._istampzHelper = _istampzHelper;
    exports.TISTAMPZconn = TISTAMPZconn;
    exports.undefined = undefined;
    exports.TPDFView = TPDFView;
    exports.isMobile = isMobile;

    exports._Scope = _Scope;
    exports._appLoad = _appLoad;
    exports._Lang = _Lang;
    exports._localTable = _localTable;
    exports._components = _components;
    exports.mainBg = mainBg;
    exports.setGlobalSetting = setGlobalSetting;
    exports._Loader = _Loader;
    exports._showLoader = _showLoader;
    exports._closeLoader = _closeLoader;
    exports._LoaderTimer = _LoaderTimer;
    exports._LoaderThread = _LoaderThread;
    exports.loaderShow = loaderShow;
    exports.showLoader = showLoader;
    exports.closeLoader = closeLoader;
    exports.dataFonts = dataFonts;
    exports.PushAjax = PushAjax;
    exports.TPushNotif = TPushNotif;

    exports.TBarcode = TBarcode;
    exports.drawQR = drawQR;
    exports.TQRCode = TQRCode;

    exports._wModDlg = _wModDlg;
    // exports.TPullNotif=TPullNotif;
    exports.TSQLiteConnector = TSQLiteConnector;
    exports.TSQLiteTable = TSQLiteTable;
    exports.THNSPullNotif=THNSPullNotif;
    exports.THNSPushNotif=THNSPushNotif;
    exports.createBeaconRegion = createBeaconRegion;
    exports.beaconRegion=beaconRegion;

    exports._Vari = _GVar;

    // Service Manager Plugin Specific Usage
    exports.TPackageComponent = TPackageComponent;
    exports.pluginCallback = pluginCallback;
    exports.pluginGetComponent = pluginGetComponent;
    exports.pluginEvent = pluginEvent;

    // Variables used outside of this js file

    // Functions being used outside of this js file

}));
