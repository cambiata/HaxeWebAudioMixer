package audio.js;
import js.html.audio.AudioBuffer;

/**
 * Track
 * @author Jonas Nyström
 */

class Track {
	public var name:String;
	public var url:String;
	public var decodedBuffer:AudioBuffer;
	public var peaks:Float;
	public var volume:Float;
	public var panning:Float;
	public var muted:Bool;
	public var solo:Bool;
	public var sampleNode:Dynamic;
	public var volumeNode:Dynamic;
	
	public function new(songName:String, instrument:Instrument) {
		this.name = instrument.name;
		this.url = 'multitrack/$songName/${instrument.sound}';
		this.decodedBuffer = null;
		this.peaks = 0;
		this.volume = 1.0;
		this.panning = 0;
		this.muted = false;
		this.solo = false;
		this.sampleNode = null;
		this.volumeNode = null;
	}
	
}