package audio.js;
import js.html.audio.AudioBuffer;
import js.html.CanvasElement;
import js.html.Float32Array;

/**
 * WaveformDrawer
 * @author Jonas Nyström
 */
class WavefromDrawer {
	var decodedAudioBuffer:AudioBuffer;
	var canvas:CanvasElement;
	var displayWidth:Int;
	var displayHeight:Int;
	var color:String;
	var sampleStep =  10;
	var peaks:Float32Array;
	
	public function new() { };
	public function init(decodedAudioBuffer:AudioBuffer, canvas:CanvasElement, color:Int) {
		this.decodedAudioBuffer = decodedAudioBuffer;
		this.canvas = canvas;
		this.displayWidth = canvas.width;
		this.displayHeight = canvas.height;
		this.color = '#' + StringTools.hex(color);
		this.getPeaks();
	}
	
	function getPeaks() 
	{
	        var buffer = this.decodedAudioBuffer;
	        var sampleSize = Math.ceil(buffer.length / this.displayWidth);

	       trace("sample size = " + buffer.length);
	        //this.sampleStep = Math.floor(sampleSize / 10);
	        trace('this.sampleStep ' + this.sampleStep);
	        

	        var channels = buffer.numberOfChannels;
	        // The result is an array of size equal to the displayWidth
	        this.peaks = new Float32Array(this.displayWidth);

	        // For each channel
	        //for (var c = 0; c < channels; c++) {
		for (c in 0...channels) {
			var chan = buffer.getChannelData(c);

			//for (var i = 0; i < this.displayWidth; i++) {
			for (i in 0...this.displayWidth) 
			{	
				var start = Math.floor(i * sampleSize);
				var end = start + sampleSize;
				var peak = .0;
				//trace([start, end, peak]);
				//for (var j = start; j < end; j += this.sampleStep) {

				
				var j = start;
				while (j < end) {
					//trace(j);
						var value = chan[j];
						        if (value > peak) {
							peak = value;
						        } else if (-value > peak) {
							peak = -value;
						        }
					        j += this.sampleStep;
				}

				if (c > 1) {
					this.peaks[i] += peak / channels;
				} else {
					this.peaks[i] = peak / channels;
				}
			}
		}
		
		/*
		trace('peaks.length' + this.peaks.length);
		var s = '';
		for (i in 0...peaks.length) s += this.peaks[i] + '\n';
		trace(s);
		*/
		//trace(this.peaks.byteLength);
		//for (i in 0...10) trace(this.peaks[i]);
	}
	
	function max(values:Float32Array): Float  {
		var max = .0;
		for (i in 0...values.length) {
			var val = values[i];
			if (val > max) max = val;
		}
		return max;		
	}
	
	
	public function drawWave(startY:Float, height:Float) 
	{
		var ctx = this.canvas.getContext2d();
		ctx.save();
		ctx.translate(0, startY);
		
		ctx.fillStyle = this.color;
		ctx.strokeStyle = this.color;

		var width = this.displayWidth;		
		var coef = height / (2 * this.max(this.peaks));
		var halfH = height / 2;

		ctx.beginPath();
		ctx.moveTo(0, halfH);
		ctx.lineTo(width, halfH);
		ctx.stroke();

		ctx.beginPath();		
		
		ctx.moveTo(0, halfH);
		for (i in 0...width) {
			var h = Math.round(this.peaks[i] * coef);
			ctx.lineTo(i, halfH + h);
		}
		ctx.lineTo(width, halfH);
		
		ctx.moveTo(0, halfH);
		for (i in 0...width) {
			var h = Math.round(this.peaks[i] * coef);
			ctx.lineTo(i, halfH - h);
		}
		ctx.lineTo(width, halfH);
		
		ctx.fill();
		ctx.restore();	
		
	}
	
}