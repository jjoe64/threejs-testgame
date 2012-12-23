"use strict";

// namespace
var g = {};
var stats;

/**
 * System
 */
g.System = function() {
	var scene = new THREE.Scene();
	var camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
	var renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);
	
	// stats
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	document.body.appendChild( stats.domElement );
	
	var controller = new g.Controller(scene, camera, renderer);
};


/**
 * Map
 */
g.Map = function(scene, renderer) {
	this.scene = scene;
	this.renderer = renderer;
	this.collisionMesh = [];
};
g.Map.prototype._loadTexture = function(path) {
	var texture = new THREE.Texture( this.renderer.domElement );
	var material = new THREE.MeshBasicMaterial( { map: texture, overdraw: true } );

	var image = new Image();
	image.onload = function () {
		texture.needsUpdate = true;
		material.map.image = this;
	};
	image.src = path;

	return material;
};
g.Map.prototype.load = function() {
	// skybox
	var skyboxMaterials = [
				this._loadTexture( 'skybox/px.jpg' ), // right
				this._loadTexture( 'skybox/nx.jpg' ), // left
				this._loadTexture( 'skybox/py.jpg' ), // top
				this._loadTexture( 'skybox/ny.jpg' ), // bottom
				this._loadTexture( 'skybox/pz.jpg' ), // back
				this._loadTexture( 'skybox/nz.jpg' )  // front
	];

	var skyboxMesh = new THREE.Mesh( new THREE.CubeGeometry( 300, 300, 300, 7, 7, 7 ), new THREE.MeshFaceMaterial( skyboxMaterials ) );
	skyboxMesh.scale.x = - 1;
	this.scene.add( skyboxMesh );
	
	// light
	var light = new THREE.AmbientLight( 0x999999 );
	this.scene.add( light );
	var directionalLight = new THREE.DirectionalLight(0xffffff);
	directionalLight.position.set(1, 1, 1).normalize();
	this.scene.add(directionalLight);

	// map
	var loader = new THREE.JSONLoader(true);
	var thiz = this;
	loader.load(
		"iceworld.js"
		, function(geometry, materials) {
			materials[0].side = THREE.DoubleSide;
			var faceMaterial = new THREE.MeshLambertMaterial( materials[0] );
			//var faceMaterial = new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( 'ice.jpg' ), side: THREE.DoubleSide } );

		   var mesh = new THREE.Mesh( geometry, faceMaterial );
		   thiz.collisionMesh.push(mesh);
		   thiz.scene.add( mesh );
		 }
	);
};


/**
 * Controller
 */
g.Controller = function(scene, camera, renderer) {
	// map
	var map = new g.Map(scene, renderer);
	map.load();
	
	// controls
	var controls = new THREE.PointerLockControls( camera );
	scene.add( controls.getObject() );
	
	 // [test] line
    var geometryLine = new THREE.Geometry();
    geometryLine.vertices.push(camera.position);
    geometryLine.vertices.push(new THREE.Vector3(0, 0, -1));
    // lines
    var line = new THREE.Line( geometryLine, new THREE.LineBasicMaterial( { color: 0xffffff, opacity: 0.5 } ) );
    scene.add( line );
    
	
	/*
	 * Pointer Lock
	 */
	this.blocker = document.getElementById('blocker');
	this.havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
	if ( this.havePointerLock ) {
		this.element = document.body;
		var thiz = this;
		var pointerlockchange = function ( event ) {
			if ( document.pointerLockElement === thiz.element || document.mozPointerLockElement === thiz.element || document.webkitPointerLockElement === thiz.element ) {
				thiz.blocker.style.display = 'none';
				console.log("pointer lock enabled");
				controls.enabled = true;
			} else {
				thiz.blocker.style.display = '-webkit-box';
				thiz.blocker.style.display = '-moz-box';
				thiz.blocker.style.display = 'box';
				console.log("pointer lock disabled");
				controls.enabled = false;
			}
		}
		var pointerlockerror = function ( event ) {
			console.log("pointer lock error");
		}

		// Hook pointer lock state change events
		document.addEventListener( 'pointerlockchange', pointerlockchange, false );
		document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
		document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );

		document.addEventListener( 'pointerlockerror', pointerlockerror, false );
		document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
		document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );
	} else {
		console.log('Your browser doesn\'t seem to support Pointer Lock API');
	}
	this.blocker.addEventListener( 'click', function ( event ) {
		thiz.requestPointerLock();
	} ,false);
	
	
	/*
	 * main loop
	 */
	var time = Date.now();
	var delta;
	function render() {
	 	requestAnimationFrame(render);
	 	
	 	delta = Date.now() - time;
	 	controls.process(delta, map);
	 	
	 	renderer.render(scene, camera);
	 	
	 	time = Date.now();
	 	stats.update();
	}
	render();
};
g.Controller.prototype.requestPointerLock = function() {
	if (this.havePointerLock) {
		// Ask the browser to lock the pointer
		this.element.requestPointerLock = this.element.requestPointerLock || this.element.mozRequestPointerLock || this.element.webkitRequestPointerLock;
		var thiz = this;

		if ( /Firefox/i.test( navigator.userAgent ) ) {

			var fullscreenchange = function ( event ) {

				if ( document.fullscreenElement === thiz.element || document.mozFullscreenElement === thiz.element || document.mozFullScreenElement === thiz.element ) {

					document.removeEventListener( 'fullscreenchange', fullscreenchange );
					document.removeEventListener( 'mozfullscreenchange', fullscreenchange );

					thiz.element.requestPointerLock();
				}

			}

			document.addEventListener( 'fullscreenchange', fullscreenchange, false );
			document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );

			this.element.requestFullscreen = this.element.requestFullscreen || this.element.mozRequestFullscreen || this.element.mozRequestFullScreen || this.element.webkitRequestFullscreen;

			this.element.requestFullscreen();

		} else {

			this.element.requestPointerLock();

		}
	}
};

// go
g.System()
