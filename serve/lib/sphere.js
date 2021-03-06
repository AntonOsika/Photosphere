// Google Photosphere
// built by @kennydude

// Thanks to three.js example and http://stackoverflow.com/questions/1578169/how-can-i-read-xmp-data-from-a-jpg-with-php

// Usage: new Photosphere("image.jpg").loadPhotosphere(document.getElementById("myPhotosphereID"));
// myPhotosphereID must have width/height specified!


function Photosphere(image){
	this.image = image;
	//this.worker = new Worker("worker.js");
}

Photosphere.prototype.loadPhotosphere = function(holder){
	holder.innerHTML = "wait...";
	this.holder = holder;
	self = this;
	self.exif = {
		crop_height: "1380",
		crop_width: "4096",
		full_height: "2048",
		full_width: "4096",
		x: "0",
		y: "480"
	};
	self.cropImage();
};

Photosphere.prototype.cropImage = function(){
	var img = new Image();
	var self = this;

	img.onload = function(){
		var canvas = document.createElement('canvas');
		canvas.width = self.exif['full_width'];
		canvas.height = self.exif['full_height'];

		if(this.maxSize != undefined){
			// Now check the size (too big and it'll fail)
			// http://snipplr.com/view/753/create-a-thumbnail-maintaining-aspect-ratio-using-gd/
			if(this.maxSize < canvas.width || this.maxSize < canvas.height){
				var wRatio = this.maxSize / canvas.width;
				var hRatio = this.maxSize / canvas.height;
				if( (wRatio*height) < this.maxSize){
					// Horizontal
					canvas.height = Math.ceil(wRatio * height);
					canvas.width = this.maxSize;
				} else{ // Vertical
					canvas.width = Math.ceil(hRatio * width);
					canvas.height = this.maxSize;
				}
			}
		}

		var context = canvas.getContext("2d");
	
		context.fillStyle = "#000";
		context.fillRect(0,0,canvas.width,canvas.height);
		context.drawImage(img,
			(self.exif['x'] / self.exif['full_width']) * canvas.width,
			(self.exif['y'] / self.exif['full_height']) * canvas.height,
			(self.exif['crop_width'] / self.exif['full_width']) * canvas.width,
			(self.exif['crop_height'] / self.exif['full_height']) * canvas.height
		);
		
		self.start3D( canvas.toDataURL("image/png") );
	}
	img.src = this.image;

};

Photosphere.prototype.canDoWebGL = function(){
	// Modified mini-Modernizr
	// https://github.com/Modernizr/Modernizr/blob/master/feature-detects/webgl-extensions.js
	var canvas, ctx, exts;

	try {
		canvas  = document.createElement('canvas');
		ctx     = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
		exts    = ctx.getSupportedExtensions();
	}
	catch (e) {
		return false;
	}

	if (ctx === undefined) {
		return false;
	}
	else {
		return true;
	}
};

Photosphere.prototype.start3D = function(image){
	if(window['THREE'] == undefined){ alert("Please make sure three.js is loaded"); }
	
	// Start Three.JS rendering
	this.target = new THREE.Vector3();
	this.lat = 0; this.lon = 90;
	this.onMouseDownMouseX = 0, this.onMouseDownMouseY = 0, this.isUserInteracting = false, this.onMouseDownLon = 0, this.onMouseDownLat = 0;

	this.camera = new THREE.PerspectiveCamera( 75, parseInt(this.holder.offsetWidth) / parseInt(this.holder.offsetHeight), 1, 1100 );
	this.scene = new THREE.Scene();
	mesh = new THREE.Mesh( new THREE.SphereGeometry( 200, 20, 40 ), this.loadTexture( image ) );
	mesh.scale.x = - 1;
	this.scene.add( mesh );
	
	// Check for WebGL
	console.log(this.canDoWebGL());
	if(this.canDoWebGL()){
		// This is for nice browsers + computers
		try{
			this.renderer = new THREE.WebGLRenderer();
			this.maxSize = this.renderer.context.getParameter(this.renderer.context.MAX_TEXTURE_SIZE);
		} catch(e){
			this.renderer = new THREE.CanvasRenderer();
		}
	} else{
		this.renderer = new THREE.CanvasRenderer();
	}
	
	this.renderer.setSize( parseInt(this.holder.offsetWidth), parseInt(this.holder.offsetHeight) );
	this.holder.innerHTML = "";
	this.holder.appendChild( this.renderer.domElement );

	self = this;
	this.holder.addEventListener( 'touchstart', function(event){ self.onDocumentTouchStart(event, self); }, false );
	this.holder.addEventListener( 'touchmove', function(event){ self.onDocumentTouchMove(event, self); }, false );
	this.holder.addEventListener( 'mousedown', function(event){self.onDocumentMouseDown(event, self); }, false );
	this.holder.addEventListener( 'mousewheel', function(event){self.onMouseWheel(event, self); }, false );	

	document.addEventListener( 'mousemove', function(event){self.onDocumentMouseMove(event, self); }, false );
	document.addEventListener( 'mouseup', function(event){self.onDocumentMouseUp(event, self); }, false );

	this.resetTimer(this, 3000);
};

Photosphere.prototype.startMoving = function(){
	self = this;
	self.moving = true;
	var tick = function(){
		if (!self.moving){
			return;
		}
		self.lon = self.lon - 0.1;
		
		if( -3 < self.lat && self.lat < 3){}
		else if(self.lat > 10){ self.lat -= 0.1 }
		else if(self.lat > 0){ self.lat -= 0.04; }
		else if(self.lat < 0 && self.lat > 10) { self.lat += 0.1; }
		else if(self.lat < 0) { self.lat += 0.04;  }

		self.render();
		window.webkitRequestAnimationFrame(tick);
	}

	window.webkitRequestAnimationFrame(tick);
};

Photosphere.prototype.resetTimer = function(self, t){
	if(self.timer != undefined){ clearTimeout(self.timer); }
	self.moving = false;

	self.timer = setTimeout(function(){
		self.startMoving();
	}, t);
};

Photosphere.prototype.onWindowResize = function(self) {

	self.camera.aspect = parseInt(self.holder.offsetWidth) / parseInt(self.holder.offsetHeight);
	self.camera.updateProjectionMatrix();

	self.renderer.setSize( parseInt(self.holder.offsetWidth), parseInt(self.holder.offsetHeight) );

	self.render();

}


Photosphere.prototype.onMouseWheel = function( event, self ) {

	proposed = self.camera.fov - event.wheelDeltaY * 0.05;
	if(proposed > 10 && proposed < 100){
		self.camera.fov = proposed;
		self.camera.updateProjectionMatrix();

		self.render();

		event.preventDefault();
	}

}

Photosphere.prototype.onDocumentMouseDown = function( event, self ) {

	event.preventDefault();

	self.isUserInteracting = true;

	self.onPointerDownPointerX = event.clientX;
	self.onPointerDownPointerY = event.clientY;

	self.onPointerDownLon = self.lon;
	self.onPointerDownLat = self.lat;
};

Photosphere.prototype.onDocumentMouseMove = function( event, self ) {

	if ( self.isUserInteracting ) {

		self.lon = ( self.onPointerDownPointerX - event.clientX ) * 0.1 + self.onPointerDownLon;
		self.lat = ( event.clientY - self.onPointerDownPointerY ) * 0.1 + self.onPointerDownLat;
		self.render();

		self.resetTimer(self, 9000);

	}

};

Photosphere.prototype.onDocumentTouchStart = function( event, self ) {

	if ( event.touches.length == 1 ) {

		event.preventDefault();

		self.onPointerDownPointerX = event.touches[ 0 ].pageX;
		self.onPointerDownPointerY = event.touches[ 0 ].pageY;

		self.onPointerDownLon = lon;
		self.onPointerDownLat = lat;

	}

}

Photosphere.prototype.onDocumentTouchMove = function( event, self ) {

	if ( event.touches.length == 1 ) {

		event.preventDefault();

		self.lon = ( self.onPointerDownPointerX - event.touches[0].pageX ) * 0.1 + self.onPointerDownLon;
		self.lat = ( event.touches[0].pageY - self.onPointerDownPointerY ) * 0.1 + self.onPointerDownLat;

		self.render();
		self.resetTimer(self, 9000);

	}

}

Photosphere.prototype.onDocumentMouseUp = function( event, self ) {

	self.isUserInteracting = false;
	self.render();

};

Photosphere.prototype.loadTexture = function( path ) {
	var texture = new THREE.Texture(  );
	var material = new THREE.MeshBasicMaterial( { map: texture, overdraw: true } );

	var image = new Image();
	self = this;
	image.onload = function () {

		texture.needsUpdate = true;
		material.map.image = this;

		setTimeout(function(){ self.render(); }, 100);
	};
	image.src = path;

	return material;
}

Photosphere.prototype.render = function(){
	this.lat = Math.max( - 85, Math.min( 85, this.lat ) );
	phi = ( 90 - this.lat ) * Math.PI / 180;
	theta = this.lon * Math.PI / 180;

	this.target.x = 500 * Math.sin( phi ) * Math.cos( theta );
	this.target.y = 500 * Math.cos( phi );
	this.target.z = 500 * Math.sin( phi ) * Math.sin( theta );

	this.camera.lookAt( this.target );

	this.renderer.render( this.scene, this.camera );
};

Photosphere.prototype.loadBinary = function(callback){
	if(this.binary_data != undefined){ callback(this.binary_data); return; }

	$.ajax({
		url: this.image,
		complete: function(a){
			callback(a.responseText)
		}
	});
};

