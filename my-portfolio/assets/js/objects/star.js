import { SpriteMaterial, Sprite, Vector3, TextureLoader } from 'three'
import { BLOOM_LAYER, STAR_MAX, STAR_MIN } from '../config/renderConfig.js'
import { starTypes } from '../config/starDistributions.js'
import { clamp } from '../utils.js'

const texture = new TextureLoader().load('/sprite120.png')
const materials = starTypes.color.map((color) => new SpriteMaterial({map: texture, color: color}))

export class Star {

    constructor(position, isStar) {
        // Use clone to not modify the original
        this.position = position.clone(); 
        this.angle = Math.atan2(position.y, position.x); 
        this.isStar = isStar
        this.starType = this.generateStarType()
        this.obj = null
        this.initialDistance = this.position.length();
    }

    generateStarType() {
        let num = Math.random() * 100.0
        let pct = starTypes.percentage
        for (let i = 0; i < pct.length; i++) {
            num -= pct[i]
            if (num < 0) {
                return i
            }
        }
        return 0
    }

    updateScale(camera) {
        let dist = this.position.distanceTo(camera.position) / 250

        // update star size based on distance and type
        let starSize = dist * starTypes.size[this.starType]
        starSize = clamp(starSize, STAR_MIN, STAR_MAX)
        this.obj?.scale.copy(new Vector3(starSize, starSize, starSize))
    }

    toThreeObject(group) {
        let sprite = new Sprite(materials[this.starType]);
        sprite.layers.set(BLOOM_LAYER);
        
        sprite.scale.multiplyScalar(starTypes.size[this.starType]);
        sprite.position.copy(this.position);
    
        this.obj = sprite;
    
        group.add(sprite);
    }

    updateOrbit(deltaTime) {
        // Base angular speed, consider making this a parameter or a class property
        // to easily adjust the simulation
        const baseSpeed = 0.09; // Adjust this value to control the base rotation speed
    
        // Modulate the angular speed inversely with the square root of the initial distance
        // Adding a small value to avoid division by zero and to ensure smoother behavior for objects very close to the center
        let angularSpeed = baseSpeed / (Math.sqrt(this.initialDistance) + 0.1);
    
        // Use deltaTime to make the motion frame rate independent
        this.angle += angularSpeed * deltaTime;
    
        // Calculate the new position using the updated angle and the original distance from the center
        let newX = Math.cos(this.angle) * this.initialDistance;
        let newY = Math.sin(this.angle) * this.initialDistance;
    
        // Update the sprite's position
        if (this.obj) {
            this.obj.position.set(newX, newY, this.position.z);
        }
    }
}
