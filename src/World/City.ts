import * as THREE from 'three'
import { Building } from './Building'
import { Grid } from './Grid'

export class City {
	data: {
		pos: { x: number; z: number }[]
		cubes: { w: number; h: number; d: number; y: number; pos: number }[]
		lines: { pos1: number; pos2: number; color: number }[]
	}
	buildings: Building[]
	free_grids: Grid[]

	constructor(
		scene: THREE.Object3D,
		scene_data: {
			pos: { x: number; z: number }[]
			cubes: { w: number; h: number; d: number; y: number; pos: number }[]
			lines: { pos1: number; pos2: number; color: number }[]
		},
		scale: number = 1
	) {
		this.data = scene_data
		this.buildings = []
		this.free_grids = []

		let minx = 0
		scene_data.cubes.forEach((cube) => {
			minx = Math.min(scene_data.pos[cube.pos].x + cube.w / 2, minx)
		})

		console.log(minx)

		// const grid = new Grid(scene, pos: {x: 0, y: 0: z: 0}, )

		scene_data.cubes.forEach((cube) => this.buildings.push(new Building(scene, scene_data.pos, cube, scale)))
	}
}
