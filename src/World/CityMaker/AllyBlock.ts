import * as THREE from 'three'
import type ParkMiller from 'park-miller'

function getColor(color: string) {
	return Number('0x' + new THREE.Color(color).getHexString())
}

const colors = {
	0: getColor('#5a3d07'),
	1: getColor('#989b10'),
	2: getColor('#832d8f'),
	3: getColor('#444444'),

	100: getColor('#989b10'),
	101: getColor('#1c47a5'),
	102: getColor('#439b10'),
	103: getColor('#8f2d35'),
}

export enum AllyBlockType {
	Empty = 0,
	Ally = 1,
	Corner = 2,
	Footpath = 3,

	Size0 = 100,
	Size1 = 101,
	Size2 = 102,
	Size3 = 103,
}

export class AllyBlock {
	private random: ParkMiller

	private size: number
	private corner: number
	private footpath: number

	public grid: number[][][]
	public buildings: { x: number; z: number; size: number }[]
	public depth: number

	private geo: THREE.BoxGeometry

	constructor(random: ParkMiller, size: number, corner: number, footpath: number) {
		// bind functions
		this.startGrid = this.startGrid.bind(this)
		this.addCorners = this.addCorners.bind(this)
		this.addFootPath = this.addFootPath.bind(this)
		this.addConvergePoint = this.addConvergePoint.bind(this)
		this.copyConvergePoint = this.copyConvergePoint.bind(this)
		this.addBuildingsConfig = this.addBuildingsConfig.bind(this)
		this.generate = this.generate.bind(this)
		this.render = this.render.bind(this)

		// init
		this.random = random
		this.size = size
		this.corner = corner
		this.footpath = footpath
		this.grid = []
		this.buildings = []
		this.depth = 2

		this.geo = new THREE.BoxGeometry(1, 0.2, 1)

		this.generate()
	}

	private startGrid() {
		const grid: number[][] = []
		for (let i = 0; i < this.size; i++) {
			grid[i] = []
			for (let j = 0; j < this.size; j++) {
				grid[i][j] = 0
			}
		}
		return grid
	}

	private addCorners(grid: number[][]) {
		// top left
		for (let i = 0; i < this.corner; i++) {
			for (let j = 0; j < this.corner; j++) {
				grid[i][j] = AllyBlockType.Corner
			}
		}

		// top right
		for (let i = 0; i < this.corner; i++) {
			for (let j = 0; j < this.corner; j++) {
				grid[i][j + this.size - this.corner] = AllyBlockType.Corner
			}
		}

		// bottom left
		for (let i = 0; i < this.corner; i++) {
			for (let j = 0; j < this.corner; j++) {
				grid[i + this.size - this.corner][j] = AllyBlockType.Corner
			}
		}

		// bottom right
		for (let i = 0; i < this.corner; i++) {
			for (let j = 0; j < this.corner; j++) {
				grid[i + this.size - this.corner][j + this.size - this.corner] = AllyBlockType.Corner
			}
		}
	}

	private addFootPath(grid: number[][], corner_gap: number = 0) {
		for (let i = corner_gap; i < this.size - corner_gap; i++) {
			for (let j = 0; j < this.footpath; j++) {
				grid[i][j] = AllyBlockType.Footpath
				grid[i][this.size - j - 1] = AllyBlockType.Footpath
				grid[j][i] = AllyBlockType.Footpath
				grid[this.size - j - 1][i] = AllyBlockType.Footpath
			}
		}
	}

	private addConvergePoint(grid: number[][]) {
		const doubleCorner = this.corner * 2
		const entryRange = this.size - doubleCorner

		const entryPointX = this.random.integerInRange(0, entryRange - 1)
		const entryPointZ = this.random.integerInRange(0, entryRange - 1)

		grid[entryPointX + this.corner][entryPointZ + this.corner] = AllyBlockType.Ally

		let foundAllyRoute = false
		let dir1 = 0
		let dir2 = 0
		while (!foundAllyRoute) {
			dir1 = this.random.integerInRange(0, 3)
			dir2 = this.random.integerInRange(0, 3)
			if (dir1 == dir2) continue
			foundAllyRoute = true
		}

		const self = this

		function go_x_plus() {
			for (
				let i = entryPointX + self.corner + 1;
				i < entryRange - 1 - (self.footpath - 1) + 2 * self.corner;
				i++
			) {
				grid[i][entryPointZ + self.corner] = AllyBlockType.Ally
			}
		}
		function go_x_minux() {
			for (let i = self.footpath; i < self.corner + entryPointX; i++) {
				grid[i][entryPointZ + self.corner] = AllyBlockType.Ally
			}
		}
		function go_z_plus() {
			for (
				let i = entryPointZ + self.corner + 1;
				i < entryRange - 1 - (self.footpath - 1) + 2 * self.corner;
				i++
			) {
				grid[entryPointX + self.corner][i] = AllyBlockType.Ally
			}
		}
		function go_z_minux() {
			for (let i = self.footpath; i < self.corner + entryPointZ; i++) {
				grid[entryPointX + self.corner][i] = AllyBlockType.Ally
			}
		}
		function go_dir(dir: number) {
			switch (dir) {
				default:
					break
				case 0:
					go_x_plus()
					break
				case 1:
					go_x_minux()
					break
				case 2:
					go_z_plus()
					break
				case 3:
					go_z_minux()
					break
			}
		}
		go_dir(dir1)
		go_dir(dir2)
	}

	private copyConvergePoint(gridFrom: number[][], gridTo: number[][]) {
		for (let i = 0; i < gridFrom.length; i++) {
			for (let j = 0; j < gridFrom[i].length; j++) {
				if (gridFrom[i][j] == AllyBlockType.Ally) {
					gridTo[i][j] = AllyBlockType.Ally
				}
			}
		}
	}

	private addBuildingsConfig(grid: number[][]) {
		grid
		const doubleCorner = this.corner * 2
		const entryRange = this.size - doubleCorner
		const self = this

		function checkForRoutes(x: number, z: number, buildingSize: number, dir: number) {
			if (dir == 0) {
				// console.log(x + buildingSize, entryRange - 1 - (self.footpath - 1) + 2 * self.corner)
				if (x + buildingSize > entryRange - 1 - (self.footpath - 1) + 2 * self.corner) return true
				for (let i = 0; i < buildingSize; i++) {
					for (let j = 0; j < buildingSize; j++) {
						// console.log( x + i, z + j, grid[x + i][z + j] == AllyBlockType.Ally, grid[x + i][z + j] == AllyBlockType.Footpath )
						if (
							grid[x + i][z + j] == AllyBlockType.Ally ||
							grid[x + i + j][z] == AllyBlockType.Footpath ||
							grid[x + i][z + j] > 100
						)
							return true
					}
				}
				return false
			} else if (dir == 1) {
				// console.log(z + buildingSize, entryRange - 1 - (self.footpath - 1) + 2 * self.corner)
				if (z + buildingSize > entryRange - 1 - (self.footpath - 1) + 2 * self.corner) return true
				for (let i = 0; i < buildingSize; i++) {
					for (let j = 0; j < buildingSize; j++) {
						// console.log( x - i, z + j, grid[x - i][z + j] == AllyBlockType.Ally, grid[x - i][z + j] == AllyBlockType.Footpath, grid[x - i][z + j], grid[x - i][z + j] > 100)
						if (
							grid[x - i][z + j] == AllyBlockType.Ally ||
							grid[x - i][z + j] == AllyBlockType.Footpath ||
							grid[x - i][z + j] > 100
						)
							return true
					}
				}
				return false
			} else if (dir == 2) {
				// console.log(x, z,  buildingSize, self.footpath, "left", x - buildingSize <= self.footpath)
				if (x - buildingSize < self.footpath - 1) return true
				for (let i = 0; i < buildingSize; i++) {
					for (let j = 0; j < buildingSize; j++) {
						// console.log( x - i, z - j, grid[x - i][z - j] == AllyBlockType.Ally, grid[x - i][z - j] == AllyBlockType.Footpath )
						if (
							grid[x - i][z - j] == AllyBlockType.Ally ||
							grid[x - i][z - j] == AllyBlockType.Footpath ||
							grid[x - i][z - j] > 100
						)
							return true
					}
				}
				return false
			} else if (dir == 3) {
				// console.log(z - buildingSize, self.footpath)
				if (z - buildingSize < self.footpath - 1) return true
				for (let i = 0; i < buildingSize; i++) {
					for (let j = 0; j < buildingSize; j++) {
						// console.log( x + i, z - j, grid[x + i][z - j] == AllyBlockType.Ally, grid[x + i][z - j] == AllyBlockType.Footpath, grid[x + i][z - j] > 100 )
						if (
							grid[x + i][z - j] == AllyBlockType.Ally ||
							grid[x + i][z - j] == AllyBlockType.Footpath ||
							grid[x + i][z - j] > 100
						)
							return true
					}
				}
				return false
			}
		}

		// top: left - right
		for (let i = this.footpath; i < entryRange - 1 - (this.footpath - 1) + 2 * this.corner; i++) {
			if (grid[i][this.footpath] == AllyBlockType.Ally || grid[i][this.footpath] > 100) continue

			let buildingSize = this.random.integerInRange(1, 3)
			let properSize = false
			// console.log(i, this.footpath, buildingSize)
			let loopCountLR = 0
			if (checkForRoutes(i, this.footpath, buildingSize, 0)) {
				while (!properSize) {
					buildingSize = this.random.integerInRange(1, 3)
					loopCountLR++
					if (loopCountLR > 100) {
						console.log('loopCountLR')
						break
					}
					if (checkForRoutes(i, this.footpath, buildingSize, 0)) continue
					properSize = true
				}
			}
			let posX = i
			let posY = this.footpath
			posX -= this.size / 2
			posY -= this.size / 2
			posX += buildingSize / 2
			posY += buildingSize / 2
			this.buildings.push({ x: posX, z: posY, size: buildingSize })
			for (let j = 0; j < buildingSize; j++) {
				for (let k = 0; k < buildingSize; k++) {
					grid[i + j][this.footpath + k] = 100 + buildingSize
				}
			}
			if (buildingSize > 1) i += buildingSize - 1
		}

		// right: top - bottom
		for (let i = this.footpath + 1; i < entryRange - 1 - (self.footpath - 1) + 2 * self.corner; i++) {
			if (
				grid[this.size - this.footpath - 1][i] == AllyBlockType.Ally ||
				grid[this.size - this.footpath - 1][i] > 100
			)
				continue

			let buildingSize = this.random.integerInRange(1, 3)
			let properSize = false
			// console.log(this.size - this.footpath - 1, i, buildingSize)
			let loopCountTB = 0
			if (checkForRoutes(this.size - this.footpath - 1, i, buildingSize, 1)) {
				while (!properSize) {
					buildingSize = this.random.integerInRange(1, 3)
					loopCountTB++
					if (loopCountTB > 100) {
						console.log('loopCountTB')
						break
					}
					if (checkForRoutes(this.size - this.footpath - 1, i, buildingSize, 1)) continue
					// console.log(this.size - this.footpath - 1, i, buildingSize, 'conf')
					properSize = true
				}
			}
			let posX = this.size - this.footpath - 1
			let posY = i
			posX -= this.size / 2
			posY -= this.size / 2
			posX -= buildingSize / 2 - 1
			posY += buildingSize / 2
			this.buildings.push({ x: posX, z: posY, size: buildingSize })
			for (let j = 0; j < buildingSize; j++) {
				for (let k = 0; k < buildingSize; k++) {
					grid[this.size - this.footpath - 1 - j][i + k] = 100 + buildingSize
				}
			}
			if (buildingSize > 1) i += buildingSize - 1
		}

		// bottom: right - left
		for (let i = this.size - this.footpath - 2; i >= this.footpath; i--) {
			// console.log(i, this.size - this.footpath - 1)
			if (
				grid[i][this.size - this.footpath - 1] == AllyBlockType.Ally ||
				grid[i][this.size - this.footpath - 1] > 100
			)
				continue

			let buildingSize = this.random.integerInRange(1, 3)
			let properSize = false
			// console.log(i, this.size - this.footpath - 1, buildingSize)
			let loopCountBR = 0
			if (checkForRoutes(i, this.size - this.footpath - 1, buildingSize, 2)) {
				while (!properSize) {
					buildingSize = this.random.integerInRange(1, 3)
					loopCountBR++
					if (loopCountBR > 100) {
						console.log('loopCountBR')
						break
					}
					// console.log(i, this.size - this.footpath - 1, buildingSize, "cont")
					if (checkForRoutes(i, this.size - this.footpath - 1, buildingSize, 2)) continue
					properSize = true
				}
			}
			let posX = i
			let posY = this.size - this.footpath - 1
			posX -= this.size / 2
			posY -= this.size / 2
			posX -= buildingSize / 2 - 1
			posY -= buildingSize / 2 - 1
			this.buildings.push({ x: posX, z: posY, size: buildingSize })
			for (let j = 0; j < buildingSize; j++) {
				for (let k = 0; k < buildingSize; k++) {
					// console.log("fix", i-j, this.size - this.footpath - 1 - k)
					grid[i - j][this.size - this.footpath - 1 - k] = 100 + buildingSize
				}
			}
			// console.log(i, buildingSize)
			if (buildingSize > 2) i -= buildingSize - 1
			// console.log(i, buildingSize)
		}

		// left: bottom - top
		for (let i = this.size - this.footpath - 2; i >= this.footpath; i--) {
			// console.log(this.footpath, i)
			if (grid[this.footpath][i] == AllyBlockType.Ally || grid[this.footpath][i] > 100) continue

			let buildingSize = this.random.integerInRange(1, 3)
			let properSize = false
			// console.log(this.footpath, i, buildingSize)
			let loopCountBL = 0
			if (checkForRoutes(this.footpath, i, buildingSize, 3)) {
				while (!properSize) {
					buildingSize = this.random.integerInRange(1, 3)
					loopCountBL++
					if (loopCountBL > 100) {
						console.log('loopCountBL')
						break
					}
					// console.log(this.footpath, i, buildingSize)
					if (checkForRoutes(this.footpath, i, buildingSize, 3)) continue
					properSize = true
				}
			}
			let posX = this.footpath
			let posY = i
			posX -= this.size / 2
			posY -= this.size / 2
			posX += buildingSize / 2
			posY -= buildingSize / 2 - 1
			this.buildings.push({ x: posX, z: posY, size: buildingSize })
			for (let j = 0; j < buildingSize; j++) {
				for (let k = 0; k < buildingSize; k++) {
					// console.log("fix", this.footpath + j, i - k)
					grid[this.footpath + j][i - k] = 100 + buildingSize
				}
			}
			if (buildingSize > 1) i += buildingSize - 1
		}
	}

	private generate() {
		this.grid = []
		this.grid.push(this.startGrid())
		this.grid.push(this.startGrid())

		const l1 = 1
		const l2 = 0

		this.addCorners(this.grid[l1])
		this.addFootPath(this.grid[l1], this.corner)

		this.addFootPath(this.grid[l2])
		this.addConvergePoint(this.grid[l2])
		this.copyConvergePoint(this.grid[l2], this.grid[l1])

		this.addBuildingsConfig(this.grid[l2])
	}

	public render(renderLevel: number = 2, drawBuildings: boolean = true) {
		const object = new THREE.Object3D()
		const half = this.size / 2

		object.add(new THREE.GridHelper(this.size, 1, 0xaaaaaa, 0xaaaaaa))

		const self = this

		function drawLevel(depth: number) {
			for (let j = 0; j < self.grid[depth].length; j++) {
				for (let k = 0; k < self.grid[depth][j].length; k++) {
					// let mat = new THREE.MeshLambertMaterial({ color: colors[AllyBlockType.Empty] })
					let mat = new THREE.MeshBasicMaterial({ color: colors[AllyBlockType.Empty], wireframe: false })

					switch (self.grid[depth][j][k]) {
						case AllyBlockType.Corner: {
							mat.color = new THREE.Color(colors[AllyBlockType.Corner])
							break
						}
						case AllyBlockType.Footpath: {
							mat.color = new THREE.Color(colors[AllyBlockType.Footpath])
							break
						}
						case AllyBlockType.Ally: {
							mat.color = new THREE.Color(colors[AllyBlockType.Ally])
							break
						}
						case AllyBlockType.Size1: {
							mat.color = new THREE.Color(colors[AllyBlockType.Size1])
							break
						}
						case AllyBlockType.Size2: {
							mat.color = new THREE.Color(colors[AllyBlockType.Size2])
							break
						}
						case AllyBlockType.Size3: {
							mat.color = new THREE.Color(colors[AllyBlockType.Size3])
							break
						}
						default: {
							mat.color = new THREE.Color(colors[AllyBlockType.Empty])
							break
						}
					}
					const w = self.geo.parameters.width / 2
					const h = self.geo.parameters.height / 2
					const d = self.geo.parameters.depth / 2
					const block = new THREE.Mesh(self.geo, mat)
					block.scale.set(0.8, 1, 0.8)
					block.position.set(j + w - half, -h - depth * h * 4, k + d - half)
					object.add(block)
				}
			}
		}

		if (renderLevel >= 0) {
			if (renderLevel >= this.depth) {
				for (let i = 0; i < this.grid.length; i++) {
					drawLevel(i)
				}
			} else drawLevel(this.depth - 1 - renderLevel)
		}

		if (drawBuildings) {
			for (let i = 0; i < this.buildings.length; i++) {
				const building = this.buildings[i]
				const block = new THREE.Mesh(
					new THREE.BoxGeometry(building.size, building.size, building.size),
					new THREE.MeshStandardMaterial({
						color: colors[(building.size + 100) as AllyBlockType],
						wireframe: false,
					})
				)
				block.position.set(building.x, building.size / 2, building.z)
				object.add(block)
			}
		}

		return object
	}
}
