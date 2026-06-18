import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import * as CANNON from 'cannon-es'
import CannonDebugRenderer from './cannonDebugRenderer'
// import * as scene_data from './scene.json'
import * as scene_data from './scene2.json'
import { City } from './World/City'
import { Rails } from './World/Rails'
import ParkMiller from 'park-miller'
import { AllyBlock } from './World/CityMaker/AllyBlock'
// import { Rails } from './tester'

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
document.body.appendChild(renderer.domElement)

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(0, 20, 3)

const alight = new THREE.AmbientLight(0x404040) // soft white light
scene.add(alight)

scene.add(new THREE.HemisphereLight(0xbfd1ff, 0x202020, 0.9))

const directionalLight = new THREE.DirectionalLight(0xffffff, 2)
directionalLight.position.set(25, 50, 25)
scene.add(directionalLight)

const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1)
directionalLight2.position.set(25, -50, -15)
scene.add(directionalLight2)

// const light = new THREE.DirectionalLight()
// light.position.set(25, 50, 25)
// light.intensity = 2.0
// light.castShadow = true
// light.shadow.mapSize.width = 16384
// light.shadow.mapSize.height = 16384
// light.shadow.camera.near = 0.5
// light.shadow.camera.far = 100
// light.shadow.camera.top = 100
// light.shadow.camera.bottom = -100
// light.shadow.camera.left = -100
// light.shadow.camera.right = 100
// scene.add(light)

// const axesHelper = new THREE.AxesHelper( 1 );
// scene.add( axesHelper );

// const size = 10;
// const divisions = 10;
// const gridHelper = new THREE.GridHelper( size, divisions );
// scene.add( gridHelper );

// const plane = new THREE.Plane( new THREE.Vector3( 0, 1, 0 ), 1 );
// const helper = new THREE.PlaneHelper( plane, 1, 0xffff00 );
// scene.add( helper );

const controls = new OrbitControls(camera, renderer.domElement)

// const phongMaterial = new THREE.MeshPhongMaterial();

const world = new CANNON.World()
world.gravity.set(0, -9.82, 0)

const cannonDebugRenderer = new CannonDebugRenderer(scene, world)

const groundMaterial = new CANNON.Material('groundMaterial')
groundMaterial.friction = 0.25
groundMaterial.restitution = 0.25

//ground
// const groundGeometry: THREE.PlaneGeometry = new THREE.PlaneGeometry(100, 100);
// const groundMesh: THREE.Mesh = new THREE.Mesh(groundGeometry, phongMaterial);
// groundMesh.rotateX(-Math.PI / 2);
// groundMesh.receiveShadow = true;
// scene.add(groundMesh);
// const groundShape = new CANNON.Box(new CANNON.Vec3(50, 1, 50));
// const groundBody = new CANNON.Body({ mass: 0, material: groundMaterial });
// groundBody.addShape(groundShape);
// groundBody.position.set(0, -1, 0);
// world.addBody(groundBody);

const keyMap: { [id: string]: boolean } = {}
const onDocumentKey = (e: KeyboardEvent) => {
	keyMap[e.code] = e.type === 'keydown'
}

document.addEventListener('keydown', onDocumentKey, false)
document.addEventListener('keyup', onDocumentKey, false)

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight
	camera.updateProjectionMatrix()
	renderer.setSize(window.innerWidth, window.innerHeight)
	render()
}

const stats = new Stats()
document.body.appendChild(stats.dom)

const gui = new GUI()
const physicsFolder = gui.addFolder('Physics')
physicsFolder.add(world.gravity, 'x', -10.0, 10.0, 0.1)
physicsFolder.add(world.gravity, 'y', -10.0, 10.0, 0.1)
physicsFolder.add(world.gravity, 'z', -10.0, 10.0, 0.1)
physicsFolder.open()

const clock = new THREE.Clock()
let delta

// delaunay city
if (false) {
	const scale = 6.0
	new City(scene, scene_data, scale)

	scene_data.lines.forEach((line) => {
		const geometry = new THREE.BufferGeometry()
		geometry.setAttribute(
			'position',
			new THREE.BufferAttribute(
				new Float32Array([
					scene_data.pos[line.pos1].x * scale,
					0,
					scene_data.pos[line.pos1].z * scale,
					scene_data.pos[line.pos2].x * scale,
					0,
					scene_data.pos[line.pos2].z * scale,
				]),
				3
			)
		)
		// console.log(line.color);
		const material =
			line.color === 16776960
				? new THREE.LineDashedMaterial({ color: line.color, dashSize: 0.2, gapSize: 0.1 })
				: new THREE.LineBasicMaterial({ color: line.color })
		const mesh = new THREE.Line(geometry, material)
		mesh.computeLineDistances()
		scene.add(mesh)
	})
}

// rail
if (false) {
	const points1 = [
		new THREE.Vector3(-14, 0, -56),
		new THREE.Vector3(-12, 0, 5),
		new THREE.Vector3(3, 0, 28),
		new THREE.Vector3(36, 0, 36),
		/*  new THREE.Vector3(58, 0, 36), */ new THREE.Vector3(98, 0, 36),
	]
	const points2 = [
		new THREE.Vector3(4, 0, 92),
		new THREE.Vector3(4, 0, 72),
		new THREE.Vector3(10, 3, 48),
		new THREE.Vector3(22, 4, 24),
		new THREE.Vector3(22, 2, -4),
		new THREE.Vector3(16, 0, -24),
		new THREE.Vector3(16, 0, -56),
	]

	points1.forEach((p) => p.multiplyScalar(6 / 4))
	points2.forEach((p) => p.multiplyScalar(6 / 4))
	// const points3 = [new THREE.Vector3(-14, 0, -36), new THREE.Vector3(-10, 0, -60), new THREE.Vector3(14, 4, -60), new THREE.Vector3(44, 0, -60), new THREE.Vector3(78, 0, -40), new THREE.Vector3(98, 0, 0)];

	// initial build
	const railWidth: number = 0.16,
		railHeight: number = 0.32,
		baseSpacing: number = 1.9,
		segmentLength: number = 1.2
	const offsetPos = new THREE.Vector3(0, 0, 0)

	const rail1 = new Rails(points1, railWidth, railHeight, baseSpacing, segmentLength)
	rail1.line.position.add(offsetPos)
	rail1.railsInstanced.position.add(offsetPos)
	rail1.sleepersInstanced.position.add(offsetPos)
	rail1.leftLine.position.add(offsetPos)
	rail1.rightLine.position.add(offsetPos)
	scene.add(rail1.line)
	scene.add(rail1.railsInstanced)
	scene.add(rail1.sleepersInstanced)
	scene.add(rail1.leftLine)
	scene.add(rail1.rightLine)

	const rail2 = new Rails(points2, railWidth, railHeight, baseSpacing, segmentLength)
	rail2.line.position.add(offsetPos)
	rail2.railsInstanced.position.add(offsetPos)
	rail2.sleepersInstanced.position.add(offsetPos)
	rail2.leftLine.position.add(offsetPos)
	rail2.rightLine.position.add(offsetPos)
	scene.add(rail2.line)
	scene.add(rail2.railsInstanced)
	scene.add(rail2.sleepersInstanced)
	scene.add(rail2.leftLine)
	scene.add(rail2.rightLine)
	// buildTrack(points3);
}

if (true) {
	physicsFolder.close()

	/* function downloadData(storageObj: any) {
		var dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(storageObj))
		var dlAnchorElem = document.createElement('a')
		dlAnchorElem.setAttribute('href', dataStr)
		dlAnchorElem.setAttribute('download', 'scene.json')
		dlAnchorElem.click()
	} */

	var city: { data: AllyBlock; vis: THREE.Object3D }[][] = []

	const settings = {
		seed: 0,
		corner: 4,
		footpath: 2,
		allysize: 10,
		size: 3,
		renderBuildings: true,
		render: 1,
		generate: generate,
		download: () => {
			const cityData: { grid: number[][][], buildings: { x: number; z: number; size: number }[] }[] = []
			for (let i = 0; i < city.length; i++) {
				for (let j = 0; j < city[i].length; j++) {
					const ally = city[i][j]
					cityData.push({ grid: ally.data.grid, buildings: ally.data.buildings })
				}
			}
			console.table(cityData)
			// downloadData(cityData)
		},
	}

	const riotFolder = gui.addFolder('Riot City')
	riotFolder.add(settings, 'seed', 0, 100000).onChange(() => generate(false))
	riotFolder.add(settings, 'corner', 1, 30, 1).onChange(() => generate(false))
	riotFolder.add(settings, 'footpath', 1, 30, 1).onChange(() => generate(false))
	riotFolder.add(settings, 'allysize', 4, 30, 1).onChange(() => {
		settings.generate(false)
	})
	riotFolder.add(settings, 'size', 1, 20, 1).onChange(() => {
		settings.generate(false)
	})
	riotFolder.add(settings, 'renderBuildings').onChange(() => generate(false))
	riotFolder.add(settings, 'render', -1, 2, 1).onChange(() => generate(false))
	riotFolder.add(settings, 'generate')
	riotFolder.add(settings, 'download')

	function generate(seedUpdate: boolean = true) {
		if (settings.corner * 2 >= settings.allysize) return
		const random = new ParkMiller(settings.seed)
		for (let i = 0; i < city.length; i++) {
			for (let j = 0; j < city[i].length; j++) {
				scene.remove(city[i][j].vis)
			}
			city[i] = []
		}
		city = []
		for (let i = 0; i < settings.size; i++) {
			const allys: { data: AllyBlock; vis: THREE.Object3D }[] = []
			for (let j = 0; j < settings.size; j++) {
				const ally = new AllyBlock(random, settings.allysize, settings.corner, settings.footpath)
				const allyVis = ally.render(settings.render, settings.renderBuildings)
				allyVis.position.set(i * settings.allysize, 0, j * settings.allysize)
				allyVis.position.x -= ((settings.size - 1) / 2) * settings.allysize
				allyVis.position.z -= ((settings.size - 1) / 2) * settings.allysize
				scene.add(allyVis)
				allys.push({ data: ally, vis: allyVis })
			}
			city.push(allys)
		}
		if (seedUpdate) settings.seed++
	}
	generate(false)
}

function animate() {
	requestAnimationFrame(animate)

	delta = Math.min(clock.getDelta(), 0.1)
	world.step(delta)

	cannonDebugRenderer.update()

	render()

	stats.update()
}

function render() {
	controls.update()
	renderer.render(scene, camera)
}

animate()
