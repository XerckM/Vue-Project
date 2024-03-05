<template>
    <div>
        <canvas ref="workCanvas" data-engine="three.js r146"></canvas>
        <div>
            <h2 class="text-white exo-2-font text-5xl z-10">MY WORK</h2>
        </div>
    </div>
</template>

<script>
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
                const innerBoundary = 600; // Minimum distance from the galaxy center to start generating stars
                const outerBoundary = 100; // Maximum distance from the galaxy center where stars can be generated
                const galaxyCenter = new Vector3(0, 0, 0); // Assuming the galaxy is at the origin for simplicity

                // Calculate a vector pointing from the camera to the galaxy's center
                const cameraToGalaxyVector = new Vector3().subVectors(galaxyCenter, camera.position).normalize();

                for (let i = 0; i < numStars; i++) {
                    let starPosition;
                    do {
                        // Spherical coordinates system
                        const r = Math.random() * (outerBoundary - innerBoundary) + innerBoundary;
                        const theta = Math.random() * Math.PI * 2; // Azimuthal angle
                        const phi = Math.acos((Math.random() * 2) - 1); // Polar angle

                        // Convert spherical coordinates to Cartesian coordinates for the star's position
                        const x = r * Math.sin(phi) * Math.cos(theta);
                        const y = r * Math.sin(phi) * Math.sin(theta);
                        const z = r * Math.cos(phi);

                        starPosition = new Vector3(x, y, z);

                        // Check the dot product to ensure stars are predominantly behind the galaxy from the camera's view
                        // Adjust this logic as needed based on your scene's specific orientation and requirements
                    } while (cameraToGalaxyVector.dot(starPosition.clone().normalize()) < 0);

                    // Create a new star at the generated position
                    const backgroundStar = new Star(starPosition, true);
                    backgroundStar.toThreeObject(scene);
                }
            }

            const initThree = async () => {
                canvas = this.$refs.workCanvas
                scene = new Scene()
                scene.fog = new FogExp2(0xEBE2DB, 0.00003)

                camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 5000000);
                camera.position.set(100, 500, 500); // Original position
                camera.up.set(0, 0.5, 1);
                const lookAtOffset = new Vector3(100, 0, 30);
                camera.lookAt(lookAtOffset);
                
                orbit = new OrbitControls(camera, canvas);
                orbit.enableDamping = true;
                orbit.dampingFactor = 0.05;
                orbit.screenSpacePanning = false;
                
                // Prevent zooming in and out
                const fixedDistance = 700;
                orbit.minDistance = fixedDistance;
                orbit.maxDistance = fixedDistance;

                orbit.maxPolarAngle = Math.PI / 2 - Math.PI / 360;

                initRenderPipeline()
                galaxy = new Galaxy(scene)

                generateBackgroundStars(10000);
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

            await initThree()
            requestAnimationFrame(render)
        }
    }
}
</script>