// namespace
var g = {};

g.System = function() {
	var scene = new THREE.Scene();
	var camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
	var renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);
	
	var map = new g.Map(scene, renderer);
	map.load();
	
	camera.position.z = 5;
	camera.position.y = 1;

	
	// render loop
	function render() {
	 	requestAnimationFrame(render);
	 	renderer.render(scene, camera);
	}
	render();
};


g.Map = function(scene, renderer) {
	this.scene = scene;
	this.renderer = renderer;
};
g.Map.prototype._loadTexture = function(path) {
	var texture = new THREE.Texture( this.renderer.domElement );
	var material = new THREE.MeshBasicMaterial( { map: texture, overdraw: true } );

	var image = new Image();
	image.onload = function () {

		texture.needsUpdate = true;
		material.map.image = this;

		//render();

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

		   mesh = new THREE.Mesh( geometry, faceMaterial );
		   thiz.scene.add( mesh );
		 }
	);
};

g.System()
