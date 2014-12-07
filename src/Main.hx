package;

import audio.js.BufferLoader;
import audio.js.Song;
import audio.js.Songdata;
import audio.js.WaveformDrawer.WavefromDrawer;
import haxe.format.JsonParser;
import js.Browser;
import js.html.audio.AudioBuffer;
import js.html.audio.AudioContext;
import js.html.ButtonElement;
import js.html.ButtonElement;
import js.html.CanvasElement;
import js.html.CanvasRenderingContext;
import js.html.CanvasRenderingContext2D;
import js.html.DivElement;
import js.html.Element;
import js.html.Event;
import js.html.EventListener;
import js.html.Float32Array;
import js.html.InputElement;
import js.html.MouseEvent;
import js.html.ProgressElement;
import js.html.Uint8Array;
import js.html.XMLHttpRequest;
import js.JQuery;
import js.Lib;
using Lambda;
/**
 * ...
 * @author Jonas Nyström
 */

class Main 
{
	
	static function main() new Main();
	
	var masterCanvas:CanvasElement;
	var masterCanvasContext: CanvasRenderingContext2D;
	var frontCanvas:CanvasElement;
	var frontCanvasContext: CanvasRenderingContext2D;	
	var waveCanvas:CanvasElement;
	var waveCanvasContext: CanvasRenderingContext2D;
	var btnPlay:ButtonElement;
	var btnPause:ButtonElement;
	var btnStop:ButtonElement;
	var tracks:DivElement;
	var console:DivElement;
	var consoleTab:Element;
	var waveTab:Element;	
	var masterVolume:InputElement;
	var labelPosition:Element;
	
	//static var songData:Songdata ={ id:"Jubilate", instruments:[ { name:"100", sound:"100.mp3" }, { name:"110", sound:"110.mp3" }, { name:"120", sound:"120.mp3" }, { name:"130", sound:"130.mp3" }, { name:"200", sound:"200.mp3" }  ] };
	static var songData:Songdata = { id:"AdmiralCrumple_KeepsFlowing", instruments:[ 
		{name:"Kick1", sound:"01_Kick1.mp3" }
		, { name:"Kick2", sound:"02_Kick2.mp3" }
		, { name:"Snare", sound:"03_Snare.mp3" }
		, { name:"HiHat1", sound:"04_Hat1.mp3" }
		, { name:"HiHat2", sound:"05_Hat2.mp3" }
		, { name:"Sample", sound:"06_Sample.mp3" }
		, { name:"LeadVox", sound:"07_LeadVox.mp3" }
		, { name:"LeadVoxDouble1", sound:"08_LeadVoxDouble1.mp3" }
		, { name:"LeadVoxDouble2", sound:"09_LeadVoxDouble2.mp3" }
		] };
	
	var currentSong:Song;
	var context: AudioContext;
	var waveformDrawer:WavefromDrawer;
	var lastTime = .0;
	var currentTime = .0;
	var delta = .0;
	var currentXTimeline = .0;
	static inline var SAMPLE_HEIGHT = 50;
	
	public function new() {
		this.initUI();
		this.frontCanvas.addEventListener('mouseup', function(e) {
			var mousePos = this.getMousePos(this.frontCanvas, e);			
			var pos = mousePos.x / this.frontCanvas.width;			
			this.jumpTo(pos);
		});
		this.btnPlay.onclick = this.onBtnPlayClick;
		this.btnPause.onclick = pauseAllTracks;
		this.btnStop.onclick = stopAllTracks;
		this.masterVolume.oninput = this.setMasterVolume;
		this.waveformDrawer = new WavefromDrawer();
		
		//this.context = new AudioContext();
		this.context = this.getAudioContext();
		
		 loadSong(Main.songData);
		 
		 Main.animationCallback = this.onAnimate;		 
		 untyped __js__('
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
		 ');
		 this.onAnimate();
	}
	
	function getAudioContext() 
	{
		var context:Dynamic = null;
		untyped __js__ ('
			if (typeof AudioContext == "function") {
				context = new AudioContext();
				console.log("USING STANDARD WEB AUDIO API");
				alert("Standard Web Audio Api");
			} else if ((typeof webkitAudioContext == "function") || (typeof webkitAudioContext == "object")) {
				context = new webkitAudioContext();
				console.log("USING WEBKIT AUDIO API");
				alert("Webkit Web Audio Api");
			} else {
				alert("AudioContext is not supported.");
				throw new Error("AudioContext is not supported. :(");
			}
		');
		return context;
	}
	
	function onBtnPlayClick(e) 
	{
		this.playAllTracks(0);
	}
	
	function jumpTo(pos:Float) 
	{
		if (this.currentSong == null) return;
		this.stopAllTracks();
		var totalTime = currentSong.getDuration();
		var startTime = pos * totalTime;
		this.currentSong.elapsedTimeSinceStart = startTime;
		this.playAllTracks(startTime);
	}
	
	function getMousePos(element:Element, event:MouseEvent) 
	{
		// get canvas position
		var obj:Element = element;
		var top = 0;  
		var left = 0;
		
		while (obj != null && obj.tagName != 'BODY') {
			top += obj.offsetTop;
			left += obj.offsetLeft;
			obj = obj.offsetParent;			
		}
		
		var mouseX = event.clientX - left + Browser.window.pageXOffset;
		var mouseY = event.clientY - top + Browser.window.pageYOffset;
		return {x:mouseX, y:mouseY};
	}
	
	function loadSong(songdata:Songdata) 
	{
		this.currentSong = new Song(songdata.id, this.context);
		resizeSampleCanvas(songdata.instruments.length);
		var trackNumber = 0;
		for (instrument in songdata.instruments) {
			currentSong.addTrack(instrument);
			
			var trackRow = Browser.document.createTableRowElement();
			this.tracks.appendChild(trackRow);
			
			var trackCell = Browser.document.createTableCellElement();
			trackCell.classList.add('trackBox');
			trackCell.setAttribute('style', 'height : ' + SAMPLE_HEIGHT + 'px');
			trackRow.appendChild(trackCell);
			
			var progress = Browser.document.createProgressElement();
			progress.classList.add('pisteProgress');
			progress.id = 'progress$trackNumber';
			progress.value = 0;
			progress.max = 100;
			progress.setAttribute('style', 'width : ${SAMPLE_HEIGHT}px');
			trackCell.appendChild(progress);
			
			var instrumentName = Browser.document.createSpanElement();
			instrumentName.textContent = instrument.name;
			trackCell.appendChild(instrumentName);

			var span = Browser.document.createSpanElement();
			span.id = 'volspan';
			trackCell.appendChild(span);
			
			var range = Browser.document.createInputElement();
			range.type = 'range';
			range.classList.add('volumeSlider');
			range.classList.add('custom');
			range.id = 'volume$trackNumber';
			range.min = '0';
			range.max = '100';
			range.value = '100';
			range.oninput = this.setVolumeOfTrackDependingOnSliderValue;			
			
			span.appendChild(range);

			trackNumber++;
		}		
		this.loadAllSoundSamples();
	}
	
	function loadAllSoundSamples() 
	{
		var bufferLoader = new BufferLoader(this.context, this.currentSong.getUrlsOfTracks(),  finishedLoading, drawTrack);
		bufferLoader.load();
	}
	
	function drawTrack(decodedBuffer:AudioBuffer, trackNumber:Int) 
	{
		trace("drawTrack : let's draw sample waveform for track No" + trackNumber + " named " + currentSong.tracks[trackNumber].name);		
		var trackName = currentSong.tracks[trackNumber].name;
		this.waveformDrawer.init(decodedBuffer, this.masterCanvas, 0x83E83E);
		var x = .0;
		var y = trackNumber * SAMPLE_HEIGHT;
		this.waveformDrawer.drawWave(y, SAMPLE_HEIGHT);
		this.masterCanvasContext.strokeStyle = 'white';
		this.masterCanvasContext.strokeRect(x, y, this.masterCanvas.width, SAMPLE_HEIGHT);
		this.masterCanvasContext.font = '14pt Arial';
		this.masterCanvasContext.fillStyle = 'white';
		this.masterCanvasContext.fillText(trackName, x + 10, y + 20);
	}
	
	function finishedLoading(bufferList:Array<AudioBuffer>) 
	{
		this.currentSong.setDecodedAudioBuffers(bufferList);
		this.btnPlay.disabled = false;
	}
	
	function resizeSampleCanvas(numTracks:Int) 
	{
		this.masterCanvas.height = SAMPLE_HEIGHT * numTracks;
		this.frontCanvas.height = this.masterCanvas.height;
		this.frontCanvas.width = this.masterCanvas.width;
	}
	
	function playAllTracks(startTime:Float) {
		//var startTime = 0;
		this.setMasterVolume();
		currentSong.play(startTime);
		for (trackNr in 0...currentSong.tracks.length) this.setTrackVolume('volume$trackNr');
		this.btnPlay.disabled = true;
		this.btnStop.disabled = false;
		this.btnPause.disabled = false;		
		this.lastTime = context.currentTime;
		// this.activeWaveTab();
	}
	
	function stopAllTracks(e = null) {
		if(this.currentSong == null) return;
		this.currentSong.stop();
		// update gui's state
		this.btnStop.disabled = true;
		this.btnPause.disabled = true;
		this.btnPlay.disabled = false;
		// reset the elapsed time
		this.currentSong.elapsedTimeSinceStart = 0;
	}
	
	function pauseAllTracks(e) {
		currentSong.pause();
		lastTime = context.currentTime;
	}
	
	function setMasterVolume(e=null) 
	{
		if (this.currentSong == null) return;
		var slider:InputElement = cast getElement('masterVolume');
		var fraction = Std.parseFloat(slider.value) / 100;
		this.currentSong.setVolume(fraction * fraction);
	}
	
	function setTrackVolume(trackId:String) 
	{		
		var slider:InputElement = cast getElement(trackId);
		if (slider == null) throw 'Can \'t find slider with id $trackId';
		var fraction = Std.parseFloat(slider.value) / 100;
		var trackNr = Std.parseInt(trackId.substr(6) );
		this.currentSong.setVolumeOfTrack(fraction * fraction, trackNr);
	}	
	
	function setVolumeOfTrackDependingOnSliderValue(e) 
	{		
		this.setTrackVolume(e.target.id);
	}
	
	function onAnimate() {
		this.frontCanvasContext.clearRect(0, 0, this.masterCanvas.width, this.masterCanvas.height);
		if (currentSong != null && this.currentSong.decodedAudioBuffers != null) {
			if (!currentSong.paused) 
			{				
				this.currentTime = this.context.currentTime;
				var delta = this.currentTime - this.lastTime;
				var totalTime = .0;
				this.labelPosition.innerHTML =  Std.string(this.currentSong.elapsedTimeSinceStart);
				if (this.currentSong.decodedAudioBuffers[0] != null) {
					totalTime = this.currentSong.getDuration();
					this.currentXTimeline = currentSong.elapsedTimeSinceStart * this.masterCanvas.width / totalTime;

					this.drawFrequencies();
					
					this.frontCanvasContext.strokeStyle = "white";
					this.frontCanvasContext.lineWidth = 3;
					this.frontCanvasContext.beginPath();
					this.frontCanvasContext.moveTo(this.currentXTimeline, 0);
					this.frontCanvasContext.lineTo(this.currentXTimeline, this.masterCanvas.height);
					this.frontCanvasContext.stroke();
					this.currentSong.elapsedTimeSinceStart += delta;
					this.lastTime = this.currentTime;

					if(this.currentSong.elapsedTimeSinceStart > this.currentSong.getDuration()) {
						this.stopAllTracks();
					}					
				}
			}			
		} else {
			//
		}		
		untyped __js__('requestAnimFrame(Main.animationCallback);');
	}

	@:expose dynamic static function animationCallback() {}
	
	function drawFrequencies() 
	{
		this.waveCanvasContext.save();
		this.waveCanvasContext.fillStyle = "rgba(0, 0, 0, 0.05)";
		this.waveCanvasContext.fillRect (0, 0, this.waveCanvas.width, this.waveCanvas.height);
		var freqByteData = new Uint8Array(this.currentSong.analyserNode.frequencyBinCount);
		this.currentSong.analyserNode.getByteFrequencyData(freqByteData); 
		var nbFreq = freqByteData.length;

		var SPACER_WIDTH = 5;
		var BAR_WIDTH = 2;
		var OFFSET = 100;
		var CUTOFF = 23;
		var HALF_HEIGHT = this.waveCanvas.height/2;
		var numBars = Std.int(1.7*Math.round(this.waveCanvas.width / SPACER_WIDTH));

		this.waveCanvasContext.lineCap = 'round';

		for (i in 0...numBars)
		{
			var magnitude = 0.3*freqByteData[Math.round((i * nbFreq) / numBars)];
			this.waveCanvasContext.fillStyle = "hsl( " + Math.round((i*360)/numBars) + ", 100%, 50%)";
			this.waveCanvasContext.fillRect(i * SPACER_WIDTH, HALF_HEIGHT, BAR_WIDTH, -magnitude);
			this.waveCanvasContext.fillRect(i * SPACER_WIDTH, HALF_HEIGHT, BAR_WIDTH, magnitude);
		}
		this.waveCanvasContext.strokeStyle = "white";
		this.waveCanvasContext.beginPath();

		for (i in 0...numBars)
		{
			var magnitude = 0.3*freqByteData[Math.round((i * nbFreq) / numBars)];
			if(i > 0) {
				this.waveCanvasContext.lineTo(i*SPACER_WIDTH, HALF_HEIGHT-magnitude);
			} else {
				this.waveCanvasContext.moveTo(i*SPACER_WIDTH, HALF_HEIGHT-magnitude);
			}
		}
		for (i in 0...numBars)
		{
			var magnitude = 0.3*freqByteData[Math.round((i * nbFreq) / numBars)];
			if(i > 0) {
				this.waveCanvasContext.lineTo(i*SPACER_WIDTH, HALF_HEIGHT+magnitude);
			} else {
				this.waveCanvasContext.moveTo(i*SPACER_WIDTH, HALF_HEIGHT+magnitude);
			}
		}    
		this.waveCanvasContext.stroke();
		this.waveCanvasContext.restore();
	}	
	
	public function initUI() {
		this.masterCanvas = cast getElement('myCanvas');
		this.masterCanvasContext = this.masterCanvas.getContext2d();
		this.frontCanvas = cast getElement('frontCanvas');
		this.frontCanvasContext = this.frontCanvas.getContext2d();	
		this.waveCanvas = cast getElement('waveCanvas');
		this.waveCanvasContext = this.waveCanvas.getContext2d();			
		this.btnPlay = cast getElement("bplay");		
		this.btnPause = cast getElement("bpause");		
		this.btnStop = cast getElement("bstop");		
		this.tracks = cast getElement("tracks");		
		this.console = cast getElement("messages");		
		this.consoleTab = cast getElement("consoleTab");		
		this.waveTab = cast getElement("waveTab");	
		this.masterVolume = cast getElement('masterVolume');
		this.labelPosition = cast getElement("position");		
	}	
	
	function getElement(id:String) return Browser.document.getElementById(id);
}



