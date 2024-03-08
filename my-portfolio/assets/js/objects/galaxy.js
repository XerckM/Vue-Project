import { Group, Vector3 } from 'three'
import { Star } from './star.js'
import { ARMS, ARM_X_DIST, ARM_X_MEAN, ARM_Y_DIST, ARM_Y_MEAN, CORE_X_DIST, CORE_Y_DIST, GALAXY_THICKNESS, HAZE_RATIO, NUM_STARS, OUTER_CORE_X_DIST, OUTER_CORE_Y_DIST } from '../config/galaxyConfig.js'
import { gaussianRandom, spiral } from '../utils.js'
import { Haze } from './haze.js';

export class Galaxy {

    constructor(scene) {
        // Create a group for the galaxy
        this.innerCore = new Group();
        this.outerCore = new Group();
        this.spiralArms = new Group();

        // Generate stars and haze, then add them to the group instead of directly to the scene
        this.innerCoreStars = this.generateObject(NUM_STARS, (pos) => new Star(pos));
        this.outerCoreStars = this.generateObject(NUM_STARS, (pos) => new Star(pos));
        this.spiralArmsAndHaze= this.generateObject(NUM_STARS * HAZE_RATIO, (pos) => new Haze(pos));
    
        this.innerCoreStars.forEach((star) => {
            star.toThreeObject(this.innerCore);
        });
        this.outerCoreStars.forEach((star) => {
            star.toThreeObject(this.outerCore);
        });
        this.spiralArmsAndHaze.forEach((haze) => {
            haze.toThreeObject(this.spiralArms);
        });
    
        scene.add(this.innerCore);
        scene.add(this.outerCore);
        scene.add(this.spiralArms);
    }

    updateScale(camera) {
        // this.stars.forEach((star) => {
        //     star.updateScale(camera)
        // })
    
        // this.haze.forEach((haze) => {
        //     haze.updateScale(camera)
        // })

        this.innerCoreStars.forEach((star) => {
            star.updateScale(camera)
        });
        this.outerCoreStars.forEach((star) => {
            star.updateScale(camera)
        });
        this.spiralArmsAndHaze.forEach((haze) => {
            haze.updateScale(camera)
        });
    }

    generateInnerCore(numStars, generator) {
        let object = []

        for ( let i = 0; i < numStars / 4; i++){
            let pos = new Vector3(gaussianRandom(0, CORE_X_DIST), gaussianRandom(0, CORE_Y_DIST), gaussianRandom(0, GALAXY_THICKNESS))
            let obj = generator(pos)
            object.push(obj)
        }

        return object
    }

    generateOuterCore(numStars, generator) {
        let object = []

        for ( let i = 0; i < numStars / 4; i++){
            let pos = new Vector3(gaussianRandom(0, OUTER_CORE_X_DIST), gaussianRandom(0, OUTER_CORE_Y_DIST), gaussianRandom(0, GALAXY_THICKNESS))
            let obj = generator(pos)
            object.push(obj)
        }

        return object
    }

    generateSpiralArms(numStars, generator) {
        let object = []

        for (let j = 0; j < ARMS; j++) {
            for ( let i = 0; i < numStars / 4; i++){
                let angle = j * 2 * Math.PI / ARMS;
                let ecc = 0.35 + gaussianRandom(0, 0.1);
                let pos = spiral(gaussianRandom(ARM_X_MEAN, ARM_X_DIST * ecc), gaussianRandom(ARM_Y_MEAN, ARM_Y_DIST * ecc), gaussianRandom(0, GALAXY_THICKNESS), angle)
                if (i % 2 === 0) pos.applyAxisAngle(new Vector3(0, 0, 1), Math.PI); // Rotate half the orbits 180 degrees
                let obj = generator(pos)
                object.push(obj)
            }
        }

        return object
    }

    generateObject(numStars, generator) {
        let objects = []

        for ( let i = 0; i < numStars / 4; i++){
            let pos = new Vector3(gaussianRandom(0, CORE_X_DIST), gaussianRandom(0, CORE_Y_DIST), gaussianRandom(0, GALAXY_THICKNESS))
            let obj = generator(pos)
            objects.push(obj)
        }

        for ( let i = 0; i < numStars / 4; i++){
            let pos = new Vector3(gaussianRandom(0, OUTER_CORE_X_DIST), gaussianRandom(0, OUTER_CORE_Y_DIST), gaussianRandom(0, GALAXY_THICKNESS))
            let obj = generator(pos)
            objects.push(obj)
        }

        for (let j = 0; j < ARMS; j++) {
            for ( let i = 0; i < numStars / 4; i++){
                let angle = j * 2 * Math.PI / ARMS;
                let ecc = 0.35 + gaussianRandom(0, 0.1);
                let pos = spiral(gaussianRandom(ARM_X_MEAN, ARM_X_DIST * ecc), gaussianRandom(ARM_Y_MEAN, ARM_Y_DIST * ecc), gaussianRandom(0, GALAXY_THICKNESS), angle)
                if (i % 2 === 0) pos.applyAxisAngle(new Vector3(0, 0, 1), Math.PI); // Rotate half the orbits 180 degrees
                let obj = generator(pos)
                objects.push(obj)
            }
        }

        return objects
    }
}
