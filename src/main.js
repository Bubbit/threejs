import * as THREE from 'three';

import {FBXLoader} from 'three/examples/jsm/loaders/FBXLoader';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';

class BasicCharacterControls {
  constructor(params) {
    this._Init(params);
  }

  _Init(params) {
    this._params = params;
    this._move = {
      forward: false,
      backward: false,
      left: false,
      right: false,
    };
    this._decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
    this._acceleration = new THREE.Vector3(1, 0.25, 50.0);
    this._velocity = new THREE.Vector3(0, 0, 0);

    document.addEventListener('keydown', (e) => this._onKeyDown(e), false);
    document.addEventListener('keyup', (e) => this._onKeyUp(e), false);
  }

  _onKeyDown(event) {
      console.log(event.keyCode);
    switch (event.keyCode) {
      case 87: // w
        this._move.forward = true;
        break;
      case 65: // a
        this._move.left = true;
        break;
      case 83: // s
        this._move.backward = true;
        break;
      case 68: // d
        this._move.right = true;
        break;
      case 81: // q
        this._toggleBow = true;
        break;
      case 69: // e
        this._toggleDance = true;
        break;
      case 38: // up
      case 37: // left
      case 40: // down
      case 39: // right
        break;
    }
  }

  _onKeyUp(event) {
    switch(event.keyCode) {
      case 87: // w
        this._move.forward = false;
        break;
      case 65: // a
        this._move.left = false;
        break;
      case 83: // s
        this._move.backward = false;
        break;
      case 68: // d
        this._move.right = false;
        break;
      case 38: // up
      case 37: // left
      case 40: // down
      case 39: // right
        break;
    }
  }

  Update(timeInSeconds) {
    const velocity = this._velocity;
    const frameDecceleration = new THREE.Vector3(
        velocity.x * this._decceleration.x,
        velocity.y * this._decceleration.y,
        velocity.z * this._decceleration.z
    );
    frameDecceleration.multiplyScalar(timeInSeconds);
    frameDecceleration.z = Math.sign(frameDecceleration.z) * Math.min(
        Math.abs(frameDecceleration.z), Math.abs(velocity.z));

    velocity.add(frameDecceleration);

    const controlObject = this._params.target;
    const _Q = new THREE.Quaternion();
    const _A = new THREE.Vector3();
    const _R = controlObject.quaternion.clone();

    if (this._move.forward) {
        velocity.z += this._acceleration.z * timeInSeconds;
    }
    if (this._move.backward) {
        velocity.z -= this._acceleration.z * timeInSeconds;
    }
    if (this._move.left) {
      _A.set(0, 1, 0);
      _Q.setFromAxisAngle(_A, Math.PI * timeInSeconds * this._acceleration.y);
      _R.multiply(_Q);
    }
    if (this._move.right) {
      _A.set(0, 1, 0);
      _Q.setFromAxisAngle(_A, -Math.PI * timeInSeconds * this._acceleration.y);
      _R.multiply(_Q);
    }
    if (this._toggleBow) {
        this._params.dancing.enabled = !this._params.dancing.enabled;
        this._toggleBow = false;
    }
    if (this._toggleDance) {
        this._params.bow.enabled = !this._params.bow.enabled;
        this._toggleDance = false;
    }

    controlObject.quaternion.copy(_R);

    const oldPosition = new THREE.Vector3();
    oldPosition.copy(controlObject.position);

    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyQuaternion(controlObject.quaternion);
    forward.normalize();

    const sideways = new THREE.Vector3(1, 0, 0);
    sideways.applyQuaternion(controlObject.quaternion);
    sideways.normalize();

    sideways.multiplyScalar(velocity.x * timeInSeconds);
    forward.multiplyScalar(velocity.z * timeInSeconds);

    controlObject.position.add(forward);
    controlObject.position.add(sideways);

    oldPosition.copy(controlObject.position);
  }
}

class LoadModelDemo {
  constructor() {
    this._Initialize();
  }

  _Initialize() {
    this._threejs = new THREE.WebGLRenderer({
      antialias: true,
    });
    this._threejs.shadowMap.enabled = true;
    this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
    this._threejs.setPixelRatio(window.devicePixelRatio);
    this._threejs.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this._threejs.domElement);

    window.addEventListener('resize', () => {
      this._OnWindowResize();
    }, false);

    const fov = 60;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 1000.0;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this._camera.position.set(0, 20, 75);

    this._scene = new THREE.Scene();

    let light = new THREE.DirectionalLight(0xFFFFFF, 2.0);
    light.position.set(20, 50, 50);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;
    light.shadow.bias = -0.001;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.left = 100;
    light.shadow.camera.right = -100;
    light.shadow.camera.top = 100;
    light.shadow.camera.bottom = -100;
    this._scene.add(light);

    const controls = new OrbitControls(
      this._camera, this._threejs.domElement);
    controls.target.set(0, 20, 0);
    controls.update();

    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
        './assets/posx.jpg',
        './assets/negx.jpg',
        './assets/posy.jpg',
        './assets/negy.jpg',
        './assets/posz.jpg',
        './assets/negz.jpg',
    ]);
    this._scene.background = texture;

    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100, 10, 10),
        new THREE.MeshStandardMaterial({
            color: 0x202020,
          }));
    plane.castShadow = false;
    plane.receiveShadow = true;
    plane.rotation.x = -Math.PI / 2;
    this._scene.add(plane);

    const brickLoader = new THREE.TextureLoader();
    brickLoader.load('assets/brick.jpg', (texture) => {
        const material = new THREE.MeshBasicMaterial({
            map: texture,
        });

        const geometry = new THREE.BoxGeometry( 5, 8, 100 );
        const rightWall = new THREE.Mesh( geometry, material );
        rightWall.position.set( 50, 4, 0 );

        const leftWall = new THREE.Mesh( geometry, material );
        leftWall.position.set( -50, 4, 0 );

        const backWallGeometry = new THREE.BoxGeometry( 105, 30, 5);
        const backWall = new THREE.Mesh( backWallGeometry, material );
        backWall.position.set( 0, 15, -50 );
        this._scene.add( rightWall, leftWall, backWall );
    });

    this._previousRAF = null;
    this._mixers = [];

    this._LoadAnimatedModel();
    this._RAF();
  }

  _LoadAnimatedModel() {
    const loader = new FBXLoader();
    loader.setPath('./assets/');
    loader.load('theboss.fbx', async (fbx) => {
      fbx.scale.setScalar(0.1);
      fbx.traverse(c => {
        c.castShadow = true;
      });

      const anim = new FBXLoader();
        anim.setPath('./assets/');
      // Load dancing
        const dancingAnimation = await anim.loadAsync('Rumba Dancing.fbx');
        const m = new THREE.AnimationMixer(fbx);
        this._mixers.push(m);
        this._dancing = m.clipAction(dancingAnimation.animations[0]);
        this._dancing.play();
        this._dancing.enabled = false;

      // Load bowing
      const bowAnimation = await anim.loadAsync('Quick Formal Bow.fbx');
      const m2 = new THREE.AnimationMixer(fbx);
      this._mixers.push(m2);
      this._bow = m.clipAction(bowAnimation.animations[0]);
      this._bow.play();
      this._bow.enabled = false;

      const params = {
        target: fbx,
        camera: this._camera,
        dancing: this._dancing,
        bow: this._bow,
      }

      this._controls = new BasicCharacterControls(params);
      this._boss = fbx;
      this._scene.add(this._boss);
    });
  }

  _OnWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._threejs.setSize(window.innerWidth, window.innerHeight);
  }

  _RAF() {
    requestAnimationFrame((t) => {
      if (this._previousRAF === null) {
        this._previousRAF = t;
      }

      this._RAF();

      this._threejs.render(this._scene, this._camera);
      this._Step(t - this._previousRAF);
      this._previousRAF = t;
    });
  }

  _Step(timeElapsed) {
    const timeElapsedS = timeElapsed * 0.001;
    if (this._mixers) {
      this._mixers.map(m => m.update(timeElapsedS));
    }

    if (this._controls) {
      this._controls.Update(timeElapsedS);
    }
  }
}


let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new LoadModelDemo();
});