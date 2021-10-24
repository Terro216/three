import "./style.css"
import * as THREE from "three"
import * as CANNON from "cannon"
import PointerLockControls from "./files/PointerLockControls.js"

const scene = new THREE.Scene()
const world = new CANNON.World({
	gravity: new CANNON.Vec3(0, 0, -9.82), // m/s²
})

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000)
camera.position.set(-5, 20, 10)
camera.lookAt(0, 0, 0)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setClearColor("#222222")
document.body.appendChild(renderer.domElement)

const controls = new PointerLockControls(camera, document.body)
scene.add(controls.getObject())
document.body.onclick = () => controls.lock()
const velocity = new THREE.Vector3()
const direction = new THREE.Vector3()
const raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 10)

let ambientLight = new THREE.AmbientLight(0xffffff, 0.2)
//scene.add(ambientLight)
const lights = []
lights[0] = new THREE.PointLight(0xffffff, 2)
lights[1] = new THREE.PointLight(0xffffff, 1)
lights[0].position.set(-25, -25, 0)
lights[1].position.set(25, 25, 0)
lights.forEach((e) => {
	e.lookAt(0, 0, 0)
})
scene.add(lights[0])
scene.add(lights[1])

const cubeGeometry = new THREE.BoxGeometry(10, 10, 10)
const phongMaterial = new THREE.MeshPhongMaterial({ color: 0xf90509 })
let cubesTHREE = []
let cubesCANNON = []
for (let i = 0; i < 10; i++) {
	for (let j = 0; j < 10; j++) {
		let cube = new THREE.Mesh(cubeGeometry, phongMaterial)
		cube.position.x = j * 100
		cube.castShadow = true //default is false
		cube.position.y = i * 100
		scene.add(cube)
		cubesTHREE.push(cube)
		let cubeShape = new CANNON.Box(new CANNON.Vec3(5, 5, 5))
		let cubeBody = new CANNON.Body({ mass: 1 })
		cubeBody.addShape(cubeShape)
		cubeBody.position.x = cube.position.x
		cubeBody.position.y = cube.position.y
		cubeBody.position.z = cube.position.z
		world.addBody(cubeBody)
		cubesCANNON.push(cubeBody)
	}
}

floorInit()

const gridHelper = new THREE.GridHelper(200, 50)
//scene.add(gridHelper)

var fixedTimeStep = 1.0 / 60.0 // seconds
var maxSubSteps = 3
const clock = new THREE.Clock()

function animate() {
	requestAnimationFrame(animate)
	if (controls.isLocked === true) {
		const delta = Math.min(clock.getDelta(), 0.1)
		for (let i = 0; i < cubesTHREE.length; i++) {
			cubesTHREE[i].position.set(
				cubesCANNON[i].position.x,
				cubesCANNON[i].position.y,
				cubesCANNON[i].position.z
			)
		}
		world.step(fixedTimeStep, delta, maxSubSteps)

		velocity.x -= velocity.x * 10.0 * delta
		velocity.z -= velocity.z * 10.0 * delta

		velocity.y -= 9.8 * 100.0 * delta // 100.0 = mass

		direction.z = Number(moveForward) - Number(moveBackward)
		direction.x = Number(moveRight) - Number(moveLeft)
		direction.normalize() // this ensures consistent movements in all directions

		if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta
		if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta

		controls.moveRight(-velocity.x * delta)
		controls.moveForward(-velocity.z * delta)

		controls.getObject().position.y += velocity.y * delta // new behavior

		if (controls.getObject().position.y < 2) {
			velocity.y = 0
			controls.getObject().position.y = 2 //height
		}
	}
	renderer.render(scene, camera)
}

animate()
let moveForward = false
let moveBackward = false
let moveLeft = false
let moveRight = false

controls.addEventListener("lock", function () {})

controls.addEventListener("unlock", function () {})

const onKeyDown = function (event) {
	switch (event.code) {
		case "ArrowUp":
		case "KeyW":
			moveForward = true
			break

		case "ArrowLeft":
		case "KeyA":
			moveLeft = true
			break

		case "ArrowDown":
		case "KeyS":
			moveBackward = true
			break

		case "ArrowRight":
		case "KeyD":
			moveRight = true
			break
	}
}

const onKeyUp = function (event) {
	switch (event.code) {
		case "ArrowUp":
		case "KeyW":
			moveForward = false
			break

		case "ArrowLeft":
		case "KeyA":
			moveLeft = false
			break

		case "ArrowDown":
		case "KeyS":
			moveBackward = false
			break

		case "ArrowRight":
		case "KeyD":
			moveRight = false
			break
	}
}

document.addEventListener("keydown", onKeyDown)
document.addEventListener("keyup", onKeyUp)

function floorInit() {
	const floorGeometry = new THREE.PlaneGeometry(500, 500)
	floorGeometry.rotateX(-Math.PI / 2)
	const floorTexture = new THREE.TextureLoader().load("files/floor.jpeg")
	floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping
	floorTexture.repeat.set(50, 50)
	let materialFloor = new THREE.MeshBasicMaterial({ map: floorTexture })
	let mesh = new THREE.Mesh(floorGeometry, materialFloor)
	mesh.receiveShadow = true
	scene.add(mesh)
	// Create a plane
	let floorBody = new CANNON.Body({
		mass: 0, // mass == 0 makes the body static
	})
	let floorShape = new CANNON.Plane()
	floorBody.addShape(floorShape)
	world.addBody(floorBody)
}
