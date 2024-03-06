<template>
  <div>
    <canvas ref="canvas"></canvas>
    <div id="container" class="absolute text-white text-center max-w-3xl px-6" style="top:50%; transform:translate(-50%, -50%); left:50%; width:100%;">
      <h1 id="name" class="space-mono-regular text-2xl uppercase tracking-wide opacity-0" style="transform: translateY(30px)">Xerckiem Mercado</h1>
      <p id="quote" class="exo-2-font text-5xl leading-tight uppercase tracking-tighter opacity-0" style="transform: translateY(30px)">
        <span class="colored-word">Innovation</span> is my playground <span class="colored-word">Technology</span> is my tool<br/> 
        And the quest for knowledge <span class="colored-word">my unending path</span>
        </p>
      <a id="view-work-btn" href="" 
        class="border px-4 py-2 rounded-lg text-xl space-mono-regular uppercase mt-8 hover:bg-white hover:text-gray-800 inline-block opacity-0" 
        style="transform: translateY(30px)">
        View More
      </a>
    </div>
  </div>
</template>

<script>
import gsap from 'gsap'

export default {
  async mounted() {
    const {
      PlaneGeometry, 
      BufferAttribute, 
      Raycaster, 
      Scene, 
      PerspectiveCamera, 
      WebGLRenderer,
      MeshPhongMaterial,
      DoubleSide,
      Mesh,
      DirectionalLight,
      BufferGeometry,
      PointsMaterial,
      Float32BufferAttribute,
      Points,
      Color
    } = await import('three')
    const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls')
    const dat = await require('dat.gui')
    
    // GUI setup for controls
    // const gui = new dat.GUI()
    const world = {
      plane: {
        width: 500,
        height: 500,
        widthSegments: 70,
        heightSegments: 70
      }
    }

    // gui.add(world.plane, 'width', 1, 500).onChange(generatePlane)
    // gui.add(world.plane, 'height', 1, 500).onChange(generatePlane)
    // gui.add(world.plane, 'widthSegments', 1, 100).onChange(generatePlane)
    // gui.add(world.plane, 'heightSegments', 1, 100).onChange(generatePlane)

    function generatePlane() {
      planeMesh.geometry.dispose()
      planeMesh.geometry = new PlaneGeometry(
        world.plane.width,
        world.plane.height,
        world.plane.widthSegments,
        world.plane.heightSegments
      )

      // vertice position randomization
      const { array } = planeMesh.geometry.attributes.position
      const randomValues = []

      for (let i = 0; i < array.length; i++) {
        if (i % 3 === 0) {
          const x = array[i]
          const y = array[i + 1]
          const z = array[i + 2]
          array[i] = x + (Math.random() - 0.5) * 3
          array[i + 1] = y + (Math.random() - 0.5) * 3
          array[i + 2] = z + (Math.random() - 0.5) * 3
        }
        randomValues.push(Math.random() * Math.PI * 2)
      }

      planeMesh.geometry.attributes.position.randomValues = randomValues
      planeMesh.geometry.attributes.position.originalPosition =
        planeMesh.geometry.attributes.position.array

      const colors = []
      for (let i = 0; i < planeMesh.geometry.attributes.position.count; i++) {
        colors.push(0, 0.18, 0.5)
      }
      planeMesh.geometry.setAttribute(
        'color',
        new BufferAttribute(new Float32Array(colors), 3)
      )
    }

    // Scene, camera perspective setup
    const raycaster = new Raycaster()
    const scene = new Scene()
    const camera = new PerspectiveCamera(
      75,
      innerWidth / innerHeight,
      0.1,
      1000
    )

    const renderer = new WebGLRenderer({
      canvas: this.$refs.canvas
    })
    renderer.setSize(innerWidth, innerHeight)
    renderer.setPixelRatio(devicePixelRatio)
    new OrbitControls(camera, renderer.domElement)

    // Camera position
    camera.position.z = 20

    // Plane setup
    const planeGeometry = new PlaneGeometry(
      world.plane.width,
      world.plane.height,
      world.plane.widthSegments,
      world.plane.heightSegments
    )

    const planeMaterial = new MeshPhongMaterial({
      side: DoubleSide,
      shininess: 30,
      flatShading: true,
      vertexColors: true
    })

    const planeMesh = new Mesh(planeGeometry, planeMaterial)
    scene.add(planeMesh)
    generatePlane()

    // Lights
    const light = new DirectionalLight(0xffffff, 1)
    light.position.set(0, -1, 1)
    scene.add(light)
    const backLight = new DirectionalLight(0xffffff, 1)
    backLight.position.set(0, 0, -1)
    scene.add(backLight)

    // Stars
    const starGeometry = new BufferGeometry()
    const starMaterial = new PointsMaterial({ color: 0xffffff })
    const starVerticies = []

    for (let i = 0; i < 5000; i++) {
      const x = (Math.random() - 0.5) * 2000
      const y = (Math.random() - 0.5) * 2000
      const z = (Math.random() - 0.5) * 2000
      starVerticies.push(x, y, z)
    }

    starGeometry.setAttribute('position', new Float32BufferAttribute(starVerticies, 3))

    const stars = new Points(starGeometry, starMaterial)
    scene.add(stars)

    // Mouse setup and listener for hover effects
    const mouse = {
      x: undefined,
      y: undefined
    }

    addEventListener('mousemove', (event) => {
      mouse.x = (event.clientX / innerWidth) * 2 - 1
      mouse.y = -(event.clientY / innerHeight) * 2 + 1
    })

    addEventListener('resize', () => {
      camera.aspect = innerWidth / innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(innerWidth, innerHeight)
    })

    gsap.timeline()
      .to('#name', {
        opacity: 1,
        duration: 1.5,
        y: 0,
        ease: 'power3.inOut',
        onStart: () => {
          // Start the flashing effect as the text animation begins
          flashRandomColors();
        }
      })
      .to('#quote', {
        opacity: 1,
        duration: 1.5,
        delay: 0.3,
        y: 0,
        ease: 'power3.inOut'
      })
      .to('#view-work-btn', {
        opacity: 1,
        duration: 1.5,
        delay: 0.1,
        y: 0,
        ease: 'power3.inOut'
      });

    document.querySelector('#view-work-btn').addEventListener('click', (e) => {
      e.preventDefault()

      gsap.to('#container', {
        opacity: 0,
      })

      gsap.to(camera.position, {
        z: 3,
        ease: 'power3.inOut',
        duration: 2
      })

      gsap.to(camera.rotation, {
        x: 1.57,
        ease: 'power3.inOut',
        duration: 2
      })

      gsap.to(camera.position, {
        y: 1000,
        ease: 'power3.in',
        duration: 1,
        delay: 2,
        onComplete: () => {
          this.$router.push('/work')
        }
      })
    })

    function flashRandomColors() {
      const colors = planeMesh.geometry.attributes.color; // Get the color attribute
      
      for (let i = 0; i < colors.count; i += 3) {
          // Randomly decide whether to flash this vertex
          if (Math.random() > 0.995) {
              const flashDuration = 2 + Math.random();
              
              // Generate a variation of blue or a complementary color that blends well
              const color = new Color(
                  0.1,
                  0.5,
                  1
              );
              
              // Flash the color on
              gsap.to({r: colors.getX(i), g: colors.getY(i), b: colors.getZ(i)}, {
                  r: color.r,
                  g: color.g,
                  b: color.b,
                  duration: flashDuration / 2,
                  ease: "power1.inOut",
                  onUpdate: function() {
                      colors.setXYZ(i, this.targets()[0].r, this.targets()[0].g, this.targets()[0].b);
                      colors.needsUpdate = true;
                  },
                  onComplete: () => {
                      // Fade off back to original color slowly
                      gsap.to({r: color.r, g: color.g, b: color.b}, {
                          // Original color
                          r: 0, g: 0.18, b: 0.5, 
                          duration: flashDuration / 2,
                          ease: "power1.inOut",
                          onUpdate: function() {
                              colors.setXYZ(i, this.targets()[0].r, this.targets()[0].g, this.targets()[0].b);
                              colors.needsUpdate = true;
                          }
                      });
                  }
              });
          }
      }
    }

    // Animation logic
    let frame = 0

    function animate() {
      let keepFlashing = true;
      requestAnimationFrame(animate)
      renderer.render(scene, camera)
      raycaster.setFromCamera(mouse, camera)
      frame += 0.01

      const { array, originalPosition, randomValues } = planeMesh.geometry.attributes.position

      for (let i = 0; i < array.length; i += 3) {
        // x
        array[i] = originalPosition[i] + Math.cos(frame + randomValues[i]) * 0.01
        // y
        array[i + 1] =
          originalPosition[i + 1] + Math.sin(frame + randomValues[i + 1]) * 0.001
      }

      planeMesh.geometry.attributes.position.needsUpdate = true

      if (keepFlashing) {
        flashRandomColors();
      }

      const intersects = raycaster.intersectObject(planeMesh)

      if (intersects.length > 0) {
        const { color } = intersects[0].object.geometry.attributes

        // vertice 1
        color.setX(intersects[0].face.a, 0.1)
        color.setY(intersects[0].face.a, 0.5)
        color.setZ(intersects[0].face.a, 1)

        // vertice 2
        color.setX(intersects[0].face.b, 0.1)
        color.setY(intersects[0].face.b, 0.5)
        color.setZ(intersects[0].face.b, 1)

        // vertice 3
        color.setX(intersects[0].face.c, 0.1)
        color.setY(intersects[0].face.c, 0.5)
        color.setZ(intersects[0].face.c, 1)

        // Update the color
        intersects[0].object.geometry.attributes.color.needsUpdate = true

        const initialColor = { r: 0, g: 0.18, b: 0.5 }
        const hoverColor = { r: 0.1, g: 0.5, b: 1 }

        gsap.to(hoverColor, {
          r: initialColor.r,
          g: initialColor.g,
          b: initialColor.b,
          duration: 1,
          onUpdate: () => {

            // vertice 1
            color.setX(intersects[0].face.a, hoverColor.r)
            color.setY(intersects[0].face.a, hoverColor.g)
            color.setZ(intersects[0].face.a, hoverColor.b)

            // vertice 2
            color.setX(intersects[0].face.b, hoverColor.r)
            color.setY(intersects[0].face.b, hoverColor.g)
            color.setZ(intersects[0].face.b, hoverColor.b)

            // vertice 3
            color.setX(intersects[0].face.c, hoverColor.r)
            color.setY(intersects[0].face.c, hoverColor.g)
            color.setZ(intersects[0].face.c, hoverColor.b)
            color.needsUpdate = true
          }
        })
      }
      stars.rotation.x += 0.0005
    }

    animate()

  }
}
</script>

<style>
.colored-word {
  color: #24fa24;
}
</style>