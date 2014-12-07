(function ($hx_exports) { "use strict";
$hx_exports.Main = $hx_exports.Main || {};
var HxOverrides = function() { };
HxOverrides.__name__ = true;
HxOverrides.cca = function(s,index) {
	var x = s.charCodeAt(index);
	if(x != x) return undefined;
	return x;
};
HxOverrides.substr = function(s,pos,len) {
	if(pos != null && pos != 0 && len != null && len < 0) return "";
	if(len == null) len = s.length;
	if(pos < 0) {
		pos = s.length + pos;
		if(pos < 0) pos = 0;
	} else if(len < 0) len = s.length + len - pos;
	return s.substr(pos,len);
};
HxOverrides.iter = function(a) {
	return { cur : 0, arr : a, hasNext : function() {
		return this.cur < this.arr.length;
	}, next : function() {
		return this.arr[this.cur++];
	}};
};
var Lambda = function() { };
Lambda.__name__ = true;
Lambda.array = function(it) {
	var a = new Array();
	var $it0 = $iterator(it)();
	while( $it0.hasNext() ) {
		var i = $it0.next();
		a.push(i);
	}
	return a;
};
Lambda.iter = function(it,f) {
	var $it0 = $iterator(it)();
	while( $it0.hasNext() ) {
		var x = $it0.next();
		f(x);
	}
};
var Main = function() {
	this.currentXTimeline = .0;
	this.delta = .0;
	this.currentTime = .0;
	this.lastTime = .0;
	var _g = this;
	this.initUI();
	this.frontCanvas.addEventListener("mouseup",function(e) {
		var mousePos = _g.getMousePos(_g.frontCanvas,e);
		var pos = mousePos.x / _g.frontCanvas.width;
		_g.jumpTo(pos);
	});
	this.btnPlay.onclick = $bind(this,this.onBtnPlayClick);
	this.btnPause.onclick = $bind(this,this.pauseAllTracks);
	this.btnStop.onclick = $bind(this,this.stopAllTracks);
	this.masterVolume.oninput = $bind(this,this.setMasterVolume);
	this.waveformDrawer = new audio.js.WavefromDrawer();
	this.context = this.getAudioContext();
	this.loadSong(Main.songData);
	Main.animationCallback = $bind(this,this.onAnimate);
	
			window.requestAnimFrame = (function() {
			    return window.requestAnimationFrame ||
				window.webkitRequestAnimationFrame ||
				window.mozRequestAnimationFrame ||
				window.oRequestAnimationFrame ||
				window.msRequestAnimationFrame ||
				function(/* function */ callback, /* DOMElement */ element) {
				    window.setTimeout(callback, 1000 / 60);
				};
			})();		 
		 ;
	this.onAnimate();
};
Main.__name__ = true;
Main.main = function() {
	new Main();
};
Main.animationCallback = $hx_exports.Main.animationCallback = function() {
};
Main.prototype = {
	getAudioContext: function() {
		var context = null;
		
			if (typeof AudioContext == "function") {
				context = new AudioContext();
				console.log("USING STANDARD WEB AUDIO API");
				//alert("Standard Web Audio Api");
			} else if ((typeof webkitAudioContext == "function") || (typeof webkitAudioContext == "object")) {
				context = new webkitAudioContext();
				console.log("USING WEBKIT AUDIO API");
				alert("Using Webkit Web Audio Api");
			} else {
				alert("AudioContext is not supported.");
				throw new Error("AudioContext is not supported. :(");
			}
		;
		return context;
	}
	,onBtnPlayClick: function(e) {
		this.playAllTracks(0);
	}
	,jumpTo: function(pos) {
		if(this.currentSong == null) return;
		this.stopAllTracks();
		var totalTime = this.currentSong.getDuration();
		var startTime = pos * totalTime;
		this.currentSong.elapsedTimeSinceStart = startTime;
		this.playAllTracks(startTime);
	}
	,getMousePos: function(element,event) {
		var obj = element;
		var top = 0;
		var left = 0;
		while(obj != null && obj.tagName != "BODY") {
			top += obj.offsetTop;
			left += obj.offsetLeft;
			obj = obj.offsetParent;
		}
		var mouseX = event.clientX - left + window.pageXOffset;
		var mouseY = event.clientY - top + window.pageYOffset;
		return { x : mouseX, y : mouseY};
	}
	,loadSong: function(songdata) {
		this.currentSong = new audio.js.Song(songdata.id,this.context);
		this.resizeSampleCanvas(songdata.instruments.length);
		var trackNumber = 0;
		var _g = 0;
		var _g1 = songdata.instruments;
		while(_g < _g1.length) {
			var instrument = _g1[_g];
			++_g;
			this.currentSong.addTrack(instrument);
			var trackRow;
			var _this = window.document;
			trackRow = _this.createElement("tr");
			this.tracks.appendChild(trackRow);
			var trackCell;
			var _this1 = window.document;
			trackCell = _this1.createElement("td");
			trackCell.classList.add("trackBox");
			trackCell.setAttribute("style","height : " + 50 + "px");
			trackRow.appendChild(trackCell);
			var progress;
			var _this2 = window.document;
			progress = _this2.createElement("progress");
			progress.classList.add("pisteProgress");
			progress.id = "progress" + trackNumber;
			progress.value = 0;
			progress.max = 100;
			progress.setAttribute("style","width : " + 50 + "px");
			trackCell.appendChild(progress);
			var instrumentName;
			var _this3 = window.document;
			instrumentName = _this3.createElement("span");
			instrumentName.textContent = instrument.name;
			trackCell.appendChild(instrumentName);
			var span;
			var _this4 = window.document;
			span = _this4.createElement("span");
			span.id = "volspan";
			trackCell.appendChild(span);
			var range;
			var _this5 = window.document;
			range = _this5.createElement("input");
			range.type = "range";
			range.classList.add("volumeSlider");
			range.classList.add("custom");
			range.id = "volume" + trackNumber;
			range.min = "0";
			range.max = "100";
			range.value = "100";
			range.oninput = $bind(this,this.setVolumeOfTrackDependingOnSliderValue);
			span.appendChild(range);
			trackNumber++;
		}
		this.loadAllSoundSamples();
	}
	,loadAllSoundSamples: function() {
		var bufferLoader = new audio.js.BufferLoader(this.context,this.currentSong.getUrlsOfTracks(),$bind(this,this.finishedLoading),$bind(this,this.drawTrack));
		bufferLoader.load();
	}
	,drawTrack: function(decodedBuffer,trackNumber) {
		console.log("drawTrack : let's draw sample waveform for track No" + trackNumber + " named " + this.currentSong.tracks[trackNumber].name);
		var trackName = this.currentSong.tracks[trackNumber].name;
		this.waveformDrawer.init(decodedBuffer,this.masterCanvas,8644670);
		var x = .0;
		var y = trackNumber * 50;
		this.waveformDrawer.drawWave(y,50);
		this.masterCanvasContext.strokeStyle = "white";
		this.masterCanvasContext.strokeRect(x,y,this.masterCanvas.width,50);
		this.masterCanvasContext.font = "14pt Arial";
		this.masterCanvasContext.fillStyle = "white";
		this.masterCanvasContext.fillText(trackName,x + 10,y + 20);
	}
	,finishedLoading: function(bufferList) {
		this.currentSong.setDecodedAudioBuffers(bufferList);
		this.btnPlay.disabled = false;
	}
	,resizeSampleCanvas: function(numTracks) {
		this.masterCanvas.height = 50 * numTracks;
		this.frontCanvas.height = this.masterCanvas.height;
		this.frontCanvas.width = this.masterCanvas.width;
	}
	,playAllTracks: function(startTime) {
		this.setMasterVolume();
		this.currentSong.play(startTime);
		var _g1 = 0;
		var _g = this.currentSong.tracks.length;
		while(_g1 < _g) {
			var trackNr = _g1++;
			this.setTrackVolume("volume" + trackNr);
		}
		this.btnPlay.disabled = true;
		this.btnStop.disabled = false;
		this.btnPause.disabled = false;
		this.lastTime = this.context.currentTime;
	}
	,stopAllTracks: function(e) {
		if(this.currentSong == null) return;
		this.currentSong.stop();
		this.btnStop.disabled = true;
		this.btnPause.disabled = true;
		this.btnPlay.disabled = false;
		this.currentSong.elapsedTimeSinceStart = 0;
	}
	,pauseAllTracks: function(e) {
		this.currentSong.pause();
		this.lastTime = this.context.currentTime;
	}
	,setMasterVolume: function(e) {
		if(this.currentSong == null) return;
		var slider = this.getElement("masterVolume");
		var fraction = Std.parseFloat(slider.value) / 100;
		this.currentSong.setVolume(fraction * fraction);
	}
	,setTrackVolume: function(trackId) {
		var slider = this.getElement(trackId);
		if(slider == null) throw "Can 't find slider with id " + trackId;
		var fraction = Std.parseFloat(slider.value) / 100;
		var trackNr = Std.parseInt(HxOverrides.substr(trackId,6,null));
		this.currentSong.setVolumeOfTrack(fraction * fraction,trackNr);
	}
	,setVolumeOfTrackDependingOnSliderValue: function(e) {
		this.setTrackVolume(e.target.id);
	}
	,onAnimate: function() {
		this.frontCanvasContext.clearRect(0,0,this.masterCanvas.width,this.masterCanvas.height);
		if(this.currentSong != null && this.currentSong.decodedAudioBuffers != null) {
			if(!this.currentSong.paused) {
				this.currentTime = this.context.currentTime;
				var delta = this.currentTime - this.lastTime;
				var totalTime = .0;
				this.labelPosition.innerHTML = Std.string(this.currentSong.elapsedTimeSinceStart);
				if(this.currentSong.decodedAudioBuffers[0] != null) {
					totalTime = this.currentSong.getDuration();
					this.currentXTimeline = this.currentSong.elapsedTimeSinceStart * this.masterCanvas.width / totalTime;
					this.drawFrequencies();
					this.frontCanvasContext.strokeStyle = "white";
					this.frontCanvasContext.lineWidth = 3;
					this.frontCanvasContext.beginPath();
					this.frontCanvasContext.moveTo(this.currentXTimeline,0);
					this.frontCanvasContext.lineTo(this.currentXTimeline,this.masterCanvas.height);
					this.frontCanvasContext.stroke();
					this.currentSong.elapsedTimeSinceStart += delta;
					this.lastTime = this.currentTime;
					if(this.currentSong.elapsedTimeSinceStart > this.currentSong.getDuration()) this.stopAllTracks();
				}
			}
		} else {
		}
		requestAnimFrame(Main.animationCallback);;
	}
	,drawFrequencies: function() {
		this.waveCanvasContext.save();
		this.waveCanvasContext.fillStyle = "rgba(0, 0, 0, 0.05)";
		this.waveCanvasContext.fillRect(0,0,this.waveCanvas.width,this.waveCanvas.height);
		var freqByteData = new Uint8Array(this.currentSong.analyserNode.frequencyBinCount);
		this.currentSong.analyserNode.getByteFrequencyData(freqByteData);
		var nbFreq = freqByteData.length;
		var SPACER_WIDTH = 5;
		var BAR_WIDTH = 2;
		var OFFSET = 100;
		var CUTOFF = 23;
		var HALF_HEIGHT = this.waveCanvas.height / 2;
		var numBars = Std["int"](1.7 * Math.round(this.waveCanvas.width / SPACER_WIDTH));
		this.waveCanvasContext.lineCap = "round";
		var _g = 0;
		while(_g < numBars) {
			var i = _g++;
			var magnitude = 0.3 * freqByteData[Math.round(i * nbFreq / numBars)];
			this.waveCanvasContext.fillStyle = "hsl( " + Math.round(i * 360 / numBars) + ", 100%, 50%)";
			this.waveCanvasContext.fillRect(i * SPACER_WIDTH,HALF_HEIGHT,BAR_WIDTH,-magnitude);
			this.waveCanvasContext.fillRect(i * SPACER_WIDTH,HALF_HEIGHT,BAR_WIDTH,magnitude);
		}
		this.waveCanvasContext.strokeStyle = "white";
		this.waveCanvasContext.beginPath();
		var _g1 = 0;
		while(_g1 < numBars) {
			var i1 = _g1++;
			var magnitude1 = 0.3 * freqByteData[Math.round(i1 * nbFreq / numBars)];
			if(i1 > 0) this.waveCanvasContext.lineTo(i1 * SPACER_WIDTH,HALF_HEIGHT - magnitude1); else this.waveCanvasContext.moveTo(i1 * SPACER_WIDTH,HALF_HEIGHT - magnitude1);
		}
		var _g2 = 0;
		while(_g2 < numBars) {
			var i2 = _g2++;
			var magnitude2 = 0.3 * freqByteData[Math.round(i2 * nbFreq / numBars)];
			if(i2 > 0) this.waveCanvasContext.lineTo(i2 * SPACER_WIDTH,HALF_HEIGHT + magnitude2); else this.waveCanvasContext.moveTo(i2 * SPACER_WIDTH,HALF_HEIGHT + magnitude2);
		}
		this.waveCanvasContext.stroke();
		this.waveCanvasContext.restore();
	}
	,initUI: function() {
		this.masterCanvas = this.getElement("myCanvas");
		this.masterCanvasContext = this.masterCanvas.getContext("2d");
		this.frontCanvas = this.getElement("frontCanvas");
		this.frontCanvasContext = this.frontCanvas.getContext("2d");
		this.waveCanvas = this.getElement("waveCanvas");
		this.waveCanvasContext = this.waveCanvas.getContext("2d");
		this.btnPlay = this.getElement("bplay");
		this.btnPause = this.getElement("bpause");
		this.btnStop = this.getElement("bstop");
		this.tracks = this.getElement("tracks");
		this.console = this.getElement("messages");
		this.consoleTab = this.getElement("consoleTab");
		this.waveTab = this.getElement("waveTab");
		this.masterVolume = this.getElement("masterVolume");
		this.labelPosition = this.getElement("position");
	}
	,getElement: function(id) {
		return window.document.getElementById(id);
	}
};
Math.__name__ = true;
var Std = function() { };
Std.__name__ = true;
Std.string = function(s) {
	return js.Boot.__string_rec(s,"");
};
Std["int"] = function(x) {
	return x | 0;
};
Std.parseInt = function(x) {
	var v = parseInt(x,10);
	if(v == 0 && (HxOverrides.cca(x,1) == 120 || HxOverrides.cca(x,1) == 88)) v = parseInt(x);
	if(isNaN(v)) return null;
	return v;
};
Std.parseFloat = function(x) {
	return parseFloat(x);
};
var StringTools = function() { };
StringTools.__name__ = true;
StringTools.hex = function(n,digits) {
	var s = "";
	var hexChars = "0123456789ABCDEF";
	do {
		s = hexChars.charAt(n & 15) + s;
		n >>>= 4;
	} while(n > 0);
	if(digits != null) while(s.length < digits) s = "0" + s;
	return s;
};
var audio = {};
audio.js = {};
audio.js.BufferLoader = function(context,urlList,onloadCallback,drawCallback) {
	this.context = context;
	this.urlList = urlList;
	this.onload = onloadCallback;
	this.bufferList = [];
	this.loadCount = 0;
	this.drawSample = drawCallback;
};
audio.js.BufferLoader.__name__ = true;
audio.js.BufferLoader.prototype = {
	loadBuffer: function(url,index) {
		var _g = this;
		console.log("file : " + url + "loading and decoding");
		var request = new XMLHttpRequest();
		request.open("GET",url,true);
		request.responseType = "arraybuffer";
		request.onload = function(_) {
			_g.context.decodeAudioData(request.response,function(buffer) {
				console.log("Loaded and decoded track " + (_g.loadCount + 1) + "/" + _g.urlList.length + "...");
				if(buffer == null) {
					js.Lib.alert("error decoding file data: " + url);
					return false;
				}
				_g.bufferList[index] = buffer;
				_g.drawSample(buffer,index);
				if(++_g.loadCount == _g.urlList.length) _g.onload(_g.bufferList);
				return true;
			},function(error) {
				js.Lib.alert("decodeAudioData error " + Std.string(error));
				return false;
			});
		};
		request.onprogress = function(e) {
			if(e.total != 0) {
				var progress = window.document.getElementById("progress" + index);
				progress.value = e.loaded;
				progress.max = e.total;
			}
		};
		request.onerror = function(e1) {
			js.Lib.alert("BufferLoader: XHR error");
		};
		request.send();
	}
	,load: function() {
		this.bufferList = [];
		this.loadCount = 0;
		console.log("Loading tracks... please wait...");
		console.log("BufferLoader.prototype.load urlList size = " + this.urlList.length);
		var _g1 = 0;
		var _g = this.urlList.length;
		while(_g1 < _g) {
			var i = _g1++;
			this.loadBuffer(this.urlList[i],i);
		}
	}
};
audio.js.Song = function(songName,context) {
	this.name = songName;
	this.tracks = [];
	this.audioContext = context;
	this.sampleNodes = [];
	this.trackVolumeNodes = [];
	this.masterVolumeNode = this.audioContext.createGain();
	this.analyserNode = this.audioContext.createAnalyser();
};
audio.js.Song.__name__ = true;
audio.js.Song.prototype = {
	addTrack: function(instrument) {
		this.tracks.push(new audio.js.Track(this.name,instrument));
	}
	,getUrlsOfTracks: function() {
		return Lambda.array(this.tracks.map(function(track) {
			return track.url;
		}));
	}
	,setDecodedAudioBuffers: function(buffers) {
		this.decodedAudioBuffers = buffers;
	}
	,play: function(startTime) {
		if(startTime == null) startTime = 0;
		this.buildGraph();
		this.setTrackVolumesDependingOnMuteSoloStatus();
		this.elapsedTimeSinceStart = startTime;
		Lambda.iter(this.sampleNodes,function(s) {
			s.start(0,startTime);
		});
		this.paused = false;
	}
	,stop: function() {
		if(this.paused) return;
		Lambda.iter(this.sampleNodes,function(s) {
			s.stop(0);
			s = null;
		});
		this.paused = true;
	}
	,pause: function() {
		if(!this.paused) this.stop(); else this.play(this.elapsedTimeSinceStart);
	}
	,buildGraph: function() {
		var sources = new Array();
		var _g1 = 0;
		var _g = this.decodedAudioBuffers.length;
		while(_g1 < _g) {
			var i = _g1++;
			var sample = this.decodedAudioBuffers[i];
			sources[i] = this.audioContext.createBufferSource();
			this.audioContext.createBufferSource();
			sources[i].buffer = sample;
			this.trackVolumeNodes[i] = this.audioContext.createGain();
			if(this.tracks[i].muted) this.trackVolumeNodes[i].gain.value = 0; else this.trackVolumeNodes[i].gain.value = this.tracks[i].volume;
			sources[i].connect(this.trackVolumeNodes[i],0,0);
			this.trackVolumeNodes[i].connect(this.masterVolumeNode,0,0);
			this.masterVolumeNode.connect(this.analyserNode,0,0);
			this.analyserNode.connect(this.audioContext.destination,0,0);
		}
		this.sampleNodes = sources;
	}
	,setTrackVolumesDependingOnMuteSoloStatus: function() {
	}
	,getDuration: function() {
		if(this.decodedAudioBuffers[0] != null) return this.decodedAudioBuffers[0].duration;
		return 0;
	}
	,setVolumeOfTrack: function(volume,trackNr) {
		if(this.trackVolumeNodes == null || this.trackVolumeNodes == []) return;
		if(this.trackVolumeNodes[trackNr] == null) return;
		this.trackVolumeNodes[trackNr].gain.value = volume;
		this.tracks[trackNr].volume = volume;
	}
	,setVolume: function(volume) {
		this.volume = volume;
		this.masterVolumeNode.gain.value = volume;
	}
};
audio.js.Track = function(songName,instrument) {
	this.name = instrument.name;
	this.url = "multitrack/" + songName + "/" + instrument.sound;
	this.decodedBuffer = null;
	this.peaks = 0;
	this.volume = 1.0;
	this.panning = 0;
	this.muted = false;
	this.solo = false;
	this.sampleNode = null;
	this.volumeNode = null;
};
audio.js.Track.__name__ = true;
audio.js.WavefromDrawer = function() {
	this.sampleStep = 10;
};
audio.js.WavefromDrawer.__name__ = true;
audio.js.WavefromDrawer.prototype = {
	init: function(decodedAudioBuffer,canvas,color) {
		this.decodedAudioBuffer = decodedAudioBuffer;
		this.canvas = canvas;
		this.displayWidth = canvas.width;
		this.displayHeight = canvas.height;
		this.color = "#" + StringTools.hex(color);
		this.getPeaks();
	}
	,getPeaks: function() {
		var buffer = this.decodedAudioBuffer;
		var sampleSize = Math.ceil(buffer.length / this.displayWidth);
		console.log("sample size = " + buffer.length);
		console.log("this.sampleStep " + this.sampleStep);
		var channels = buffer.numberOfChannels;
		this.peaks = new Float32Array(this.displayWidth);
		var _g = 0;
		while(_g < channels) {
			var c = _g++;
			var chan = buffer.getChannelData(c);
			var _g2 = 0;
			var _g1 = this.displayWidth;
			while(_g2 < _g1) {
				var i = _g2++;
				var start = Math.floor(i * sampleSize);
				var end = start + sampleSize;
				var peak = .0;
				var j = start;
				while(j < end) {
					var value = chan[j];
					if(value > peak) peak = value; else if(-value > peak) peak = -value;
					j += this.sampleStep;
				}
				if(c > 1) this.peaks[i] += peak / channels; else this.peaks[i] = peak / channels;
			}
		}
	}
	,max: function(values) {
		var max = .0;
		var _g1 = 0;
		var _g = values.length;
		while(_g1 < _g) {
			var i = _g1++;
			var val = values[i];
			if(val > max) max = val;
		}
		return max;
	}
	,drawWave: function(startY,height) {
		var ctx = this.canvas.getContext("2d");
		ctx.save();
		ctx.translate(0,startY);
		ctx.fillStyle = this.color;
		ctx.strokeStyle = this.color;
		var width = this.displayWidth;
		var coef = height / (2 * this.max(this.peaks));
		var halfH = height / 2;
		ctx.beginPath();
		ctx.moveTo(0,halfH);
		ctx.lineTo(width,halfH);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(0,halfH);
		var _g = 0;
		while(_g < width) {
			var i = _g++;
			var h = Math.round(this.peaks[i] * coef);
			ctx.lineTo(i,halfH + h);
		}
		ctx.lineTo(width,halfH);
		ctx.moveTo(0,halfH);
		var _g1 = 0;
		while(_g1 < width) {
			var i1 = _g1++;
			var h1 = Math.round(this.peaks[i1] * coef);
			ctx.lineTo(i1,halfH - h1);
		}
		ctx.lineTo(width,halfH);
		ctx.fill();
		ctx.restore();
	}
};
var js = {};
js.Boot = function() { };
js.Boot.__name__ = true;
js.Boot.__string_rec = function(o,s) {
	if(o == null) return "null";
	if(s.length >= 5) return "<...>";
	var t = typeof(o);
	if(t == "function" && (o.__name__ || o.__ename__)) t = "object";
	switch(t) {
	case "object":
		if(o instanceof Array) {
			if(o.__enum__) {
				if(o.length == 2) return o[0];
				var str = o[0] + "(";
				s += "\t";
				var _g1 = 2;
				var _g = o.length;
				while(_g1 < _g) {
					var i = _g1++;
					if(i != 2) str += "," + js.Boot.__string_rec(o[i],s); else str += js.Boot.__string_rec(o[i],s);
				}
				return str + ")";
			}
			var l = o.length;
			var i1;
			var str1 = "[";
			s += "\t";
			var _g2 = 0;
			while(_g2 < l) {
				var i2 = _g2++;
				str1 += (i2 > 0?",":"") + js.Boot.__string_rec(o[i2],s);
			}
			str1 += "]";
			return str1;
		}
		var tostr;
		try {
			tostr = o.toString;
		} catch( e ) {
			return "???";
		}
		if(tostr != null && tostr != Object.toString) {
			var s2 = o.toString();
			if(s2 != "[object Object]") return s2;
		}
		var k = null;
		var str2 = "{\n";
		s += "\t";
		var hasp = o.hasOwnProperty != null;
		for( var k in o ) {
		if(hasp && !o.hasOwnProperty(k)) {
			continue;
		}
		if(k == "prototype" || k == "__class__" || k == "__super__" || k == "__interfaces__" || k == "__properties__") {
			continue;
		}
		if(str2.length != 2) str2 += ", \n";
		str2 += s + k + " : " + js.Boot.__string_rec(o[k],s);
		}
		s = s.substring(1);
		str2 += "\n" + s + "}";
		return str2;
	case "function":
		return "<function>";
	case "string":
		return o;
	default:
		return String(o);
	}
};
js.Lib = function() { };
js.Lib.__name__ = true;
js.Lib.alert = function(v) {
	alert(js.Boot.__string_rec(v,""));
};
function $iterator(o) { if( o instanceof Array ) return function() { return HxOverrides.iter(o); }; return typeof(o.iterator) == 'function' ? $bind(o,o.iterator) : o.iterator; }
var $_, $fid = 0;
function $bind(o,m) { if( m == null ) return null; if( m.__id__ == null ) m.__id__ = $fid++; var f; if( o.hx__closures__ == null ) o.hx__closures__ = {}; else f = o.hx__closures__[m.__id__]; if( f == null ) { f = function(){ return f.method.apply(f.scope, arguments); }; f.scope = o; f.method = m; o.hx__closures__[m.__id__] = f; } return f; }
Math.NaN = Number.NaN;
Math.NEGATIVE_INFINITY = Number.NEGATIVE_INFINITY;
Math.POSITIVE_INFINITY = Number.POSITIVE_INFINITY;
Math.isFinite = function(i) {
	return isFinite(i);
};
Math.isNaN = function(i1) {
	return isNaN(i1);
};
String.__name__ = true;
Array.__name__ = true;
if(Array.prototype.map == null) Array.prototype.map = function(f) {
	var a = [];
	var _g1 = 0;
	var _g = this.length;
	while(_g1 < _g) {
		var i = _g1++;
		a[i] = f(this[i]);
	}
	return a;
};
var q = window.jQuery;
js.JQuery = q;
Main.songData = { id : "AdmiralCrumple_KeepsFlowing", instruments : [{ name : "Kick1", sound : "01_Kick1.mp3"},{ name : "Kick2", sound : "02_Kick2.mp3"},{ name : "Snare", sound : "03_Snare.mp3"},{ name : "HiHat1", sound : "04_Hat1.mp3"},{ name : "HiHat2", sound : "05_Hat2.mp3"},{ name : "Sample", sound : "06_Sample.mp3"},{ name : "LeadVox", sound : "07_LeadVox.mp3"},{ name : "LeadVoxDouble1", sound : "08_LeadVoxDouble1.mp3"},{ name : "LeadVoxDouble2", sound : "09_LeadVoxDouble2.mp3"}]};
Main.SAMPLE_HEIGHT = 50;
Main.main();
})(typeof window != "undefined" ? window : exports);
