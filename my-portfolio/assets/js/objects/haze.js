import { BASE_LAYER, HAZE_MAX, HAZE_MIN, HAZE_OPACITY } from "../config/renderConfig.js"
import { clamp } from "../utils.js"
import { TextureLoader, SpriteMaterial, Sprite } from "three"


const hazeTexture = new TextureLoader().load('/feathered60.png')
const hazeSprite = new SpriteMaterial({map: hazeTexture, color: 0x0082ff, opacity: HAZE_OPACITY, depthTest: false, depthWrite: false })

export class Haze {

    constructor(position, isHaze) {
        // Use clone to not modify the original
        this.position = position.clone();
        this.angle = Math.atan2(position.y, position.x); 
        this.isHaze = isHaze
        this.obj = null
        this.initialDistance = this.position.length();
    }

    updateScale(camera) {
        let dist = this.position.distanceTo(camera.position) / 250
        this.obj.material.opacity = clamp(HAZE_OPACITY * Math.pow(dist / 2.5, 2), 0, HAZE_OPACITY)
        this.obj.material.needsUpdate = true
    }

    toThreeObject(group) {
        let sprite = new Sprite(hazeSprite);
        sprite.layers.set(BASE_LAYER);
        sprite.position.copy(this.position);
        sprite.scale.multiplyScalar(clamp(HAZE_MAX * Math.random(), HAZE_MIN, HAZE_MAX));
    
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
