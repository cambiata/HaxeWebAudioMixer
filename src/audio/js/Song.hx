package audio.js;
import js.html.Audio;
import js.html.audio.AnalyserNode;
import js.html.audio.AudioBuffer;
import js.html.audio.AudioBufferSourceNode;
import js.html.audio.AudioContext;
import js.html.audio.AudioNode;
import js.html.audio.AudioSourceNode;
import js.html.audio.GainNode;
using Lambda;

/**
 * Song
 * @author Jonas Nyström
 */

class Song  {
	
	public var decodedAudioBuffers:Array<AudioBuffer>;
	public var tracks(default, null):Array<Track>;
	public var elapsedTimeSinceStart:Float;
	public var paused:Bool;
	public var analyserNode:AnalyserNode;

	var audioContext:AudioContext;
	var name:String;
	var sampleNodes: Array<AudioBufferSourceNode>;
	var trackVolumeNodes:Array<GainNode>;
	var masterVolumeNode:GainNode;
	var volume:Float;
	
	public function new(songName:String, context:AudioContext) {
		this.name = songName;
		this.tracks =  [];
		this.audioContext = context;
		this.sampleNodes = [];
		this.trackVolumeNodes = [];
		this.masterVolumeNode = this.audioContext.createGain();
		this.analyserNode = this.audioContext.createAnalyser();
	}
	
	public function addTrack(instrument:Instrument) {
		this.tracks.push(new Track(this.name, instrument));
	}
	
	public function getUrlsOfTracks() 
	{
		return tracks.map(function(track) return track.url).array();
	}
	
	public function setDecodedAudioBuffers(buffers:Array<AudioBuffer>) 
	{
		this.decodedAudioBuffers = buffers;
	}
	
	public function play(startTime:Float=0) 
	{		
		this.buildGraph();
		this.setTrackVolumesDependingOnMuteSoloStatus();
		
		this.elapsedTimeSinceStart = startTime;
		this.sampleNodes.iter(function(s) s.start(0, startTime));
		this.paused = false;
	}

	public function stop() 
	{
		if (this.paused) return;
		this.sampleNodes.iter(function(s) {
			s.stop(0);
			s = null;
		});
		this.paused = true;
	}
	
	public function pause() 
	{
		if (!this.paused) 
			this.stop()
		else
			this.play(this.elapsedTimeSinceStart);
	}
	
	function buildGraph() 
	{
		var sources = new Array<AudioBufferSourceNode>();
		for (i in 0...this.decodedAudioBuffers.length)
		{
			var sample = this.decodedAudioBuffers[i];
			sources[i] = this.audioContext.createBufferSource();
			this.audioContext.createBufferSource();
			sources[i].buffer = sample;
			
			this.trackVolumeNodes[i] = this.audioContext.createGain();
			if (this.tracks[i].muted) {
				this.trackVolumeNodes[i].gain.value = 0;
			} else {
				this.trackVolumeNodes[i].gain.value = this.tracks[i].volume;
			}
			sources[i].connect(this.trackVolumeNodes[i], 0, 0);
			this.trackVolumeNodes[i].connect(this.masterVolumeNode, 0, 0);
			this.masterVolumeNode.connect(this.analyserNode, 0, 0);
			this.analyserNode.connect(this.audioContext.destination, 0, 0);
		}
		this.sampleNodes = sources;
	}
	
	function setTrackVolumesDependingOnMuteSoloStatus() 
	{
		
	}	
	
	public function getDuration() {		
		if (this.decodedAudioBuffers[0] != null) {
			return this.decodedAudioBuffers[0].duration;
		}
		return 0;		
	}
	
	public function setVolumeOfTrack(volume:Float, trackNr:Int) 
	{
		if (this.trackVolumeNodes == null || this.trackVolumeNodes == []) return;
		if (this.trackVolumeNodes[trackNr] == null) return;
		this.trackVolumeNodes[trackNr].gain.value = volume;		
		this.tracks[trackNr].volume = volume;		
	}
	
	public function setVolume(volume:Float) 
	{
		this.volume = volume;
		this.masterVolumeNode.gain.value = volume;
	}
	
}