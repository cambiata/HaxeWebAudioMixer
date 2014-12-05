package audio.js;
import js.Browser;
import js.html.audio.AudioBuffer;
import js.html.audio.AudioContext;
import js.html.ProgressElement;
import js.html.XMLHttpRequest;
import js.Lib;

/**
 * BufferLoader
 * @author Jonas Nyström
 */
class BufferLoader {
	
	var context:AudioContext;
	var urlList:Array<String>;
	var onload:Array<AudioBuffer>->Void;
	var bufferList:Array<AudioBuffer>;
	var loadCount:Float;
	var drawSample:AudioBuffer->Int->Void;
	
	public function new(context:AudioContext, urlList:Array<String>, onloadCallback:Array<AudioBuffer>->Void, drawCallback:AudioBuffer->Int->Void) {
		this.context = context;
		this.urlList = urlList;
		this.onload = onloadCallback;
		this.bufferList = [];
		this.loadCount = 0;
		this.drawSample = drawCallback;
		
	}
	
	public function loadBuffer(url:String, index:Int) {
		trace('file : ' + url + "loading and decoding");
		var request = new XMLHttpRequest();
		request.open('GET', url, true);
		request.responseType = "arraybuffer";
		
		request.onload = function (_) {
			
			this.context.decodeAudioData(
				request.response,
				function(buffer) {
					trace("Loaded and decoded track " + (this.loadCount+1) + "/" +  this.urlList.length + "...");
					
					if (buffer == null) {
						Lib.alert('error decoding file data: ' + url);						
						return false;
					}
					
					this.bufferList[index] = buffer;
					this.drawSample(buffer, index);
					if (++this.loadCount == this.urlList.length) this.onload(this.bufferList);	
					return true;
					
				},
				function(error) {
					Lib.alert('decodeAudioData error ' + error);		
					return false;
				}
			);
			
		}
		
		request.onprogress = function (e) {
			if (e.total != 0) {
				
				var progress:ProgressElement = cast Browser.document.getElementById('progress' + index);
				progress.value = e.loaded;
				progress.max = e.total;
			}
			
		}
		
		request.onerror = function (e) {
			Lib.alert('BufferLoader: XHR error');
		}
		
		request.send();
		
	}
	
	public function load() {
		this.bufferList = [];
		this.loadCount = 0;
		//clearLog();
		trace("Loading tracks... please wait...");
		 trace("BufferLoader.prototype.load urlList size = " + this.urlList.length);
		 for (i in 0...this.urlList.length) this.loadBuffer(this.urlList[i], i);
	}
}