<template>
    <div class="bg-black h-screen px-6 py-12">
        <canvas ref="workCanvas" data-engine="three.js r146" class="fixed top-0 left-0 w-full h-full z-[-1]"></canvas>
        <h2 ref="title" class="text-gray-300 exo-2-font text-5xl relative z-10 opacity-0" style="transform: translateY(30px)">CHECK OUT THESE LINKS</h2>
        <div class="flex space-x-5 z-10">
            <div ref="links" v-for="link in links" class="py-12 z-10 opacity-0 group" style="transform: translateX(30px)">
                <!-- Conditional rendering based on link type -->
                <NuxtLink v-if="link.isInternal" :to="link.url" class="block">
                    <img :src="link.image.url" alt="link title" class="w-full object-cover" />
                    <p class="text-gray-300 space-mono-regular text-3xl text-center">{{ link.title }}</p>
                </NuxtLink>
                <!-- Fallback to <a> for external links -->
                <a v-else :href="link.url" target="_blank" rel="noopener noreferrer">
                    <img :src="link.image.url" alt="link title" class="w-full object-cover" />
                    <p class="text-gray-300 space-mono-regular text-3xl text-center">{{ link.title }}</p>
                </a>
            </div>
        </div>
    </div>
</template>

<script>
import gsap from 'gsap'
import githubImage from '~/static/github.jpg'
import aboutMeImage from '~/static/aboutme.jpg'
import codeImage from '~/static/seethecode.jpg'
import linkedInImage from '~/static/linkedin.jpg'

export default {
    data() {
        return {
            links: 
            [
                {
                    image: { url: aboutMeImage },
                    title: 'About Me',
                    url: '/about',
                    isInternal: true
                },
                {
                    image: { url: githubImage },
                    title: 'GitHub',
                    url: 'https://github.com/XerckM/'
                },
                {
                    image: {
                        url: linkedInImage
                    },
                    title: 'LinkedIn',
                    url: 'https://www.linkedin.com/in/xerckmercado/'
                },
                {
                    image: {
                        url: codeImage
                    },
                    title: "View This Site's Code",
                    url: 'https://github.com/XerckM/Vue-Project/tree/main/my-portfolio'
                }
            ]
        }
    },
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
                const innerBoundary = 540; // Minimum distance from the galaxy center to start generating stars

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
                const navigatingFromIndex = sessionStorage.getItem('navigatingFromIndex');
                canvas = this.$refs.workCanvas
                scene = new Scene()
                scene.position.set(0, 0, 50)
                scene.fog = new FogExp2(0xEBE2DB, 0.00003)

                if (navigatingFromIndex) {
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
                        x: 200,
                        y: 600,
                        z: 600,
                        duration: 4, // Duration of the zoom in seconds
                        ease: 'sine.out',
                        onUpdate: () => {
                            camera.lookAt(scene.position);
                        },
                        onComplete: () => {
                            generateBackgroundStars(6000);
                            gsap.to(scene.rotation, {
                                x: Math.PI * 2, // Adds 360 degrees in radians to current x rotation
                                y: Math.PI * 2, // Adds 360 degrees in radians to current y rotation
                                duration: 5,
                                ease: 'sine.out', // Linear movement for uniform spinning speed
                            });
                        }
                    });

                    // Animate the scene to rotate around both X and Y axes
                    gsap.to(scene.rotation, {
                        x: Math.PI + 3, // Adds 360 degrees in radians to current x rotation
                        y: Math.PI, // Adds 360 degrees in radians to current y rotation
                        duration: 5,
                        ease: 'sine.in', // Linear movement for uniform spinning speed
                        onComplete: () => {
                            gsap.to(this.$refs.title, {
                                opacity: 1,
                                duration: 2,
                                delay: 6,
                                y: 0,
                                ease: 'expo'
                            })

                            gsap.to(this.$refs.links, {
                                opacity: 1,
                                duration: 2,
                                delay: 6,
                                stagger: 0.1,
                                x: 0,
                                ease: 'expo'
                            })
                        }
                    });
                    sessionStorage.removeItem('navigatingFromIndex');
                } else {
                    camera = new PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 5000000);
                    camera.position.set(200, 600, 600); // Original position
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

                    gsap.to(this.$refs.title, {
                        opacity: 1,
                        duration: 2,
                        delay: 1,
                        y: 0,
                        ease: 'expo'
                    });

                    gsap.to(this.$refs.links, {
                        opacity: 1,
                        duration: 2,
                        delay: 1,
                        stagger: 0.1,
                        x: 0,
                        ease: 'expo'
                    })
                }
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

            let lastTime = performance.now();

            const render = async () => {
                let currentTime = performance.now();
                let deltaTime = (currentTime - lastTime) / 1000; // Convert milliseconds to seconds
                lastTime = currentTime;


                await orbit.update()

                if (resizeRendererToDisplaySize(renderer)) {
                    const canvas = renderer.domElement
                    camera.aspect = canvas.clientWidth / canvas.clientHeight
                    camera.updateProjectionMatrix()
                }

                // Update orbital positions for stars and haze
                // galaxy.stars.forEach(star => star.updateOrbit());
                // galaxy.haze.forEach(haze => haze.updateOrbit());

                galaxy.innerCoreStars.forEach(star => star.updateOrbit(deltaTime))
                galaxy.outerCoreStars.forEach(star => star.updateOrbit(deltaTime))
                galaxy.spiralArmsAndHaze.forEach(haze => haze.updateOrbit(deltaTime))

                // galaxy.group.rotation.z += 0.000009;

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

<style>
/* Adjust the image size */
.group img {
    width: 80vh;
    height: 80vh;
    object-fit: cover;
    margin: 0 auto;
    display: block;
    border-radius: 25px;
}

/* Adjust padding and layout of each group */
.group {
  padding: 5px;
  padding-top: 25px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.group:hover img,
.group:hover p {
  transition: 0.3s ease-in-out;
  transform: scale(1.05);
  cursor: pointer;
}

.text-gray-300 {
  margin-top: 12px;
}
</style>

