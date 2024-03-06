<template>
    <div>
        <canvas ref="workCanvas" data-engine="three.js r146" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1;"></canvas>
        <h2 class="text-white exo-2-font text-5xl" style="z-index: 1; position: relative;">MY WORK</h2>
    </div>
</template>

<script>
import gsap from 'gsap'

export default {
    async mounted() {
        const { 
            Vector3,
            Scene,
            FogExp2,
            PerspectiveCamera,
            WebGLRenderer,
            sRGBEncoding,
            ACESFilmicToneMapping,
            Vector2,
            ShaderMaterial,
        } = await import('three')
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls')
        const { EffectComposer } = await import('three/examples/jsm/postprocessing/EffectComposer')
        const { RenderPass } = await import('three/examples/jsm/postprocessing/RenderPass')
        const { ShaderPass } = await import('three/examples/jsm/postprocessing/ShaderPass')
        const { UnrealBloomPass } = await import('three/examples/jsm/postprocessing/UnrealBloomPass')
        const { CompositionShader } = await import('~/assets/js/shaders/compositionShader')
        const { BLOOM_LAYER, BLOOM_PARAMS, OVERLAY_LAYER, BASE_LAYER } = await import('../assets/js/config/renderConfig')
        const { Galaxy } = await import('../assets/js/objects/galaxy')
        const { Star } = await import('../assets/js/objects/star')
        
        if (process.client) {
            let canvas, renderer, camera, scene, orbit, baseComposer, bloomComposer, overlayComposer, galaxy

            const generateBackgroundStars = async (numStars) => {
                const innerBoundary = 560; // Minimum distance from the galaxy center to start generating stars

                for (let i = 0; i < numStars; i++) {
                    let starPosition;
                    // Spherical coordinates system
                    const r = Math.random() * 5000 + innerBoundary; // Adjust as necessary
                    const theta = Math.random() * Math.PI * 2; // Azimuthal angle
                    const phi = Math.acos((Math.random() * 2) - 1); // Polar angle

                    // Convert spherical coordinates to Cartesian coordinates for the star's position
                    const x = r * Math.sin(phi) * Math.cos(theta);
                    const y = r * Math.sin(phi) * Math.sin(theta);
                    const z = r * Math.cos(phi);

                    starPosition = new Vector3(x, y, z);

                    // Create a new star at the generated position
                    const backgroundStar = new Star(starPosition, true);
                    backgroundStar.toThreeObject(scene);
                }
            }

            const initThree = async () => {
                canvas = this.$refs.workCanvas
                scene = new Scene()
                scene.position.set(0, 0, 50)
                scene.fog = new FogExp2(0xEBE2DB, 0.00003)

                camera = new PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 5000000);
                camera.position.set(1000, 5000, 250000); // Original position
                camera.up.set(0, 0.5, 1);
                const lookAtOffset = new Vector3(100, 0, 30);
                camera.lookAt(lookAtOffset);
                
                orbit = new OrbitControls(camera, canvas);
                orbit.enableDamping = true;
                orbit.dampingFactor = 0.05;
                orbit.screenSpacePanning = false;
                orbit.maxPolarAngle = Math.PI / 2 - Math.PI / 360;

                initRenderPipeline()
                galaxy = new Galaxy(scene)

                gsap.to(camera.position, {
                    x: 100,
                    y: 500,
                    z: 500,
                    duration: 4, // Duration of the zoom in seconds
                    ease: 'expoScale',
                    onUpdate: () => {
                        camera.lookAt(scene.position);
                    },
                    onComplete: () => {
                        generateBackgroundStars(10000);
                        gsap.to(scene.rotation, {
                            x: Math.PI, // Adds 360 degrees in radians to current x rotation
                            y: Math.PI, // Adds 360 degrees in radians to current y rotation
                            duration: 5,
                            ease: 'sine.inOut', // Linear movement for uniform spinning speed
                        });
                    }
                });

                // Animate the scene to rotate around both X and Y axes
                gsap.to(scene.rotation, {
                    x: Math.PI, // Adds 360 degrees in radians to current x rotation
                    y: Math.PI, // Adds 360 degrees in radians to current y rotation
                    duration: 6,
                    ease: 'sine.in', // Linear movement for uniform spinning speed
                });
            }

            const initRenderPipeline = () => {
                renderer = new WebGLRenderer({
                    antialias: true,
                    canvas: this.$refs.workCanvas,
                    logarithmicDepthBuffer: true,
                })
                renderer.setPixelRatio(window.devicePixelRatio)
                renderer.setSize(window.innerWidth, window.innerHeight)
                renderer.outputEncoding = sRGBEncoding
                renderer.toneMapping = ACESFilmicToneMapping
                renderer.toneMappingExposure = 0.5

                const renderScene = new RenderPass(scene, camera)

                const bloomPass = new UnrealBloomPass(new Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85)
                bloomPass.threshold = BLOOM_PARAMS.bloomThreshold
                bloomPass.strength = BLOOM_PARAMS.bloomStrength
                bloomPass.radius = BLOOM_PARAMS.bloomRadius

                bloomComposer = new EffectComposer(renderer)
                bloomComposer.renderToScreen = false
                bloomComposer.addPass(renderScene)
                bloomComposer.addPass(bloomPass)

                overlayComposer = new EffectComposer(renderer)
                overlayComposer.renderToScreen = false
                overlayComposer.addPass(renderScene)

                const finalPass = new ShaderPass(
                    new ShaderMaterial({
                        uniforms: {
                            baseTexture: { value: null },
                            bloomTexture: { value: bloomComposer.renderTarget2.texture },
                            overlayTexture: { value: overlayComposer.renderTarget2.texture }
                        },
                        vertexShader: CompositionShader.vertex,
                        fragmentShader: CompositionShader.fragment,
                        defines: {}
                    }), 'baseTexture'
                )
                finalPass.needsSwap = true

                baseComposer = new EffectComposer(renderer)
                baseComposer.addPass(renderScene)
                baseComposer.addPass(finalPass)
            }

            const resizeRendererToDisplaySize = (renderer) => {
                const canvas = renderer.domElement
                const width = canvas.clientWidth
                const height = canvas.clientHeight
                const needResize = canvas.width !== width || canvas.height !== height
                if (needResize) {
                    renderer.setSize(width, height, false)
                }
                return needResize
            }

            const render = async () => {
                await orbit.update()

                if (resizeRendererToDisplaySize(renderer)) {
                    const canvas = renderer.domElement
                    camera.aspect = canvas.clientWidth / canvas.clientHeight
                    camera.updateProjectionMatrix()
                }

                // Update orbital positions for stars and haze
                galaxy.stars.forEach(star => star.updateOrbit());
                galaxy.haze.forEach(haze => haze.updateOrbit());

                galaxy.group.rotation.z += 0.00001;

                galaxy.updateScale(camera)
                renderPipeline()

                requestAnimationFrame(render)
            }

            const renderPipeline = () => {
                camera.layers.set(BLOOM_LAYER)
                bloomComposer.render()

                camera.layers.set(OVERLAY_LAYER)
                overlayComposer.render()

                camera.layers.set(BASE_LAYER)
                baseComposer.render()
            }

            addEventListener('resize', () => {
                camera.aspect = window.innerWidth / window.innerHeight
                camera.updateProjectionMatrix()
                renderer.setSize(window.innerWidth, window.innerHeight)
            })

            await initThree()
            requestAnimationFrame(render)
        }
    }
}
</script>