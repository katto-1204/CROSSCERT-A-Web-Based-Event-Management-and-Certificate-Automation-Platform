'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, extend, useFrame } from '@react-three/fiber'
import { useGLTF, useTexture, Environment, Lightformer } from '@react-three/drei'
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint, RigidBodyProps } from '@react-three/rapier'
import { MeshLineGeometry, MeshLineMaterial } from 'meshline'
import * as THREE from 'three'

extend({ MeshLineGeometry, MeshLineMaterial })

// TS: declare meshline elements for React Three Fiber so TSX recognizes them
declare module '@react-three/fiber' {
  interface ThreeElements {
    meshLineGeometry: any
    meshLineMaterial: any
  }
}
type LanyardProps = {
  position?: [number, number, number]
  gravity?: [number, number, number]
  fov?: number
  transparent?: boolean
}

function Lanyard({ position = [0, 0, 17], gravity = [0, -10, 0], fov = 20, transparent = true }: LanyardProps) {
  return (
    <div className="relative z-0 w-full h-[32rem] sm:h-[28rem] md:h-[32rem] lg:h-[36rem] xl:h-[44rem] flex justify-center items-center pointer-events-none">
      <div className="w-full h-full pointer-events-auto">
        <Canvas
          camera={{ position, fov }}
          dpr={[1, 1.5]}
          gl={{ alpha: transparent, antialias: true, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => gl.setClearColor(new THREE.Color(0xffffff), transparent ? 0 : 1)}
        >
          <ambientLight intensity={Math.PI} />
          <Physics gravity={gravity} timeStep={1 / 60}>
            <Band />
          </Physics>
          <Environment blur={0.75}>
            <Lightformer intensity={2} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
            <Lightformer intensity={3} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
            <Lightformer intensity={3} color="white" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
            <Lightformer intensity={10} color="white" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
          </Environment>
        </Canvas>
      </div>
    </div>
  )
}

type BandProps = { maxSpeed?: number; minSpeed?: number }

function Band({ maxSpeed = 50, minSpeed = 0 }: BandProps) {
  const band = useRef<any>(null)
  const fixed = useRef<any>(null)
  const j1 = useRef<any>(null)
  const j2 = useRef<any>(null)
  const j3 = useRef<any>(null)
  const card = useRef<any>(null)

  const { vec, ang, rot, dir } = useMemo(
    () => ({
      vec: new THREE.Vector3(),
      ang: new THREE.Vector3(),
      rot: new THREE.Vector3(),
      dir: new THREE.Vector3(),
    }),
    [],
  )

  const segmentProps: any = useMemo(
    () => ({ type: 'dynamic' as RigidBodyProps['type'], canSleep: true, colliders: false, angularDamping: 4, linearDamping: 4 }),
    [],
  )

  const { nodes, materials } = useGLTF('/api/card.glb') as any
  const texture = useTexture('/lanyardcard/lanyard.png')
  const ccLogo = useTexture('/crosscert-logo.png')
  const hcdcLogo = useTexture('/hcdc black.png')

  const [logoSize, setLogoSize] = useState<[number, number]>([0.9, 0.25])
  const logoPlane = useMemo(() => new THREE.PlaneGeometry(logoSize[0], logoSize[1]), [logoSize])
  const hcdcPlane = useMemo(() => new THREE.PlaneGeometry(0.4, 0.4), [])

  useEffect(() => {
    return () => logoPlane.dispose()
  }, [logoPlane])

  useEffect(() => {
    return () => hcdcPlane.dispose()
  }, [hcdcPlane])

  const [curve] = useState(() => new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]))
  const [dragged, drag] = useState<false | THREE.Vector3>(false)
  const [hovered, hover] = useState(false)

  const [isSmall, setIsSmall] = useState<boolean>(() => (typeof window !== 'undefined' ? window.innerWidth < 1024 : false))

  useEffect(() => {
    const handleResize = () => setIsSmall(window.innerWidth < 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!ccLogo) return
    ccLogo.wrapS = ccLogo.wrapT = THREE.RepeatWrapping
    ccLogo.offset.set(0, 0) // center horizontally
    ccLogo.needsUpdate = true
    // Fit plane to the logo texture aspect ratio to avoid stretching
    const img: any = ccLogo.image
    if (img?.width && img?.height) {
      const aspect = img.width / img.height
      const targetHeight = 0.6
      const targetWidth = Math.min(2.8, targetHeight * aspect)
      setLogoSize([targetWidth, targetHeight])
    }
  }, [ccLogo])

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1])
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1])
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1])
  useSphericalJoint(j3, card, [[0, 0, 0], [0, 1.45, 0]])

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? 'grabbing' : 'grab'
      return () => { document.body.style.cursor = 'auto' }
    }
  }, [hovered, dragged])

  useFrame((state, delta) => {
    if (dragged && typeof dragged !== 'boolean') {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera)
      dir.copy(vec).sub(state.camera.position).normalize()
      vec.add(dir.multiplyScalar(state.camera.position.length()))
        ;[card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp())
      card.current?.setNextKinematicTranslation({ x: vec.x - dragged.x, y: vec.y - dragged.y, z: vec.z - dragged.z })
    }
    if (fixed.current) {
      ;[j1, j2].forEach((ref) => {
        if (!ref.current.lerped) ref.current.lerped = new THREE.Vector3().copy(ref.current.translation())
        const clampedDistance = Math.max(0.1, Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())))
        ref.current.lerped.lerp(ref.current.translation(), delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed)))
      })
      curve.points[0].copy(j3.current.translation())
      curve.points[1].copy(j2.current.lerped)
      curve.points[2].copy(j1.current.lerped)
      curve.points[3].copy(fixed.current.translation())
      band.current.geometry.setPoints(curve.getPoints(32))
      ang.copy(card.current.angvel())
      rot.copy(card.current.rotation())
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z })
    }
  })

  curve.curveType = 'chordal'
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping

  // Define scale, position and line width based on screen size
  const cardScale = isSmall ? 2.0 : 2.6
  // The y-position here is calibrated to keep the top of the card aligned with the joint anchor at 1.45
  const cardPosition: [number, number, number] = isSmall ? [0, -0.6, -0.05] : [0, -1.2, -0.05]
  const bandWidth = isSmall ? 1.4 : 2.2

  return (
    <>
      <group position={[0, 3.2, 0]}>
        {/* Bring the lanyard and ID card a bit down to make them visible */}
        <RigidBody ref={fixed} {...segmentProps} type={'fixed' as RigidBodyProps['type']} position={[0, 1, 0]} />
        <RigidBody position={[0.3, 1, 0]} ref={j1} {...segmentProps} type={'dynamic' as RigidBodyProps['type']}><BallCollider args={[0.13]} /></RigidBody>
        <RigidBody position={[0.6, 1, 0]} ref={j2} {...segmentProps} type={'dynamic' as RigidBodyProps['type']}><BallCollider args={[0.13]} /></RigidBody>
        <RigidBody position={[0.9, 1, 0]} ref={j3} {...segmentProps} type={'dynamic' as RigidBodyProps['type']}><BallCollider args={[0.13]} /></RigidBody>
        <RigidBody position={[1.2, 0, 0]} ref={card} {...segmentProps} type={dragged ? ('kinematicPosition' as RigidBodyProps['type']) : ('dynamic' as RigidBodyProps['type'])}>
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group scale={cardScale} position={cardPosition} onPointerOver={() => hover(true)} onPointerOut={() => hover(false)} onPointerUp={(e: any) => { e.target.releasePointerCapture(e.pointerId); drag(false) }} onPointerDown={(e: any) => { e.target.setPointerCapture(e.pointerId); drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation()))) }}>
            {/* White card base */}
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial color={new THREE.Color('#ffffff')} clearcoat={1} clearcoatRoughness={0.15} roughness={0.6} metalness={0.1} />
            </mesh>
            {/* Logo overlay centered, raised, and forward to avoid z-fighting */}
            <mesh geometry={logoPlane} position={[0, 0.55, 0.006]}>
              <meshBasicMaterial map={ccLogo} transparent alphaTest={0.05} toneMapped={false} />
            </mesh>

            {/* Back Logo - HCDC Black */}
            <mesh geometry={hcdcPlane} position={[0, 0.5, -0.006]} rotation={[0, Math.PI, 0]}>
              <meshBasicMaterial map={hcdcLogo} transparent alphaTest={0.05} toneMapped={false} />
            </mesh>

            <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3} />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>
      <mesh ref={band} position={[0, 0.5, 0]}>
        <meshLineGeometry />
        <meshLineMaterial color="white" depthTest={false} resolution={isSmall ? [1000, 2000] : [1000, 1000]} useMap map={texture} repeat={[-4, 1]} lineWidth={bandWidth} />
      </mesh>
    </>
  )
}

export function LandingHero() {
  const router = useRouter()
  const logoRef = useRef<HTMLDivElement | null>(null)
  const [skew, setSkew] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [hovered, setHovered] = useState(false)

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = logoRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    const dx = (x - 0.5) * 2
    const dy = (y - 0.5) * 2
    const maxSkew = 8
    setSkew({ x: dx * -maxSkew, y: dy * maxSkew })
  }

  function resetTilt() {
    setHovered(false)
    setSkew({ x: 0, y: 0 })
  }

  return (
    <div className="relative pt-12 sm:pt-12 md:pt-16 lg:pt-20 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Right - Logo/Visual (Top on mobile, Right on desktop) */}
          <div className="flex items-center justify-center order-first lg:order-last relative z-[80] -mb-64 lg:mb-0 w-[calc(100%+2rem)] -mx-4 lg:w-full lg:mx-0 pointer-events-none">
            <div
              ref={logoRef}
              onMouseEnter={() => setHovered(true)}
              onMouseMove={handleMouseMove}
              onMouseLeave={resetTilt}
              className="relative w-full aspect-square max-w-none sm:max-w-md flex items-center justify-center pointer-events-auto"
            >
              {/* Animated color-cycling glow behind the logo */}
              <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-80 sm:h-80 rounded-full blur-3xl opacity-80 glow-cycle" />
              {/* Logo */}
              <div className="relative w-full">
                <Lanyard position={[0, 0, 18]} gravity={[0, -40, 0]} />
              </div>
            </div>
          </div>

          {/* Left Content (Under lanyard on mobile, Left on desktop) */}
          <div className="space-y-6 sm:space-y-8 text-center lg:text-left flex flex-col items-center lg:items-start relative">
            {/* Text at Lower Layer */}
            <div className="space-y-3 sm:space-y-4 relative z-10 pt-4 sm:pt-0">
              <div className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border transition-colors bg-red-50 border-red-200 text-red-700 dark:bg-white/10 dark:border-white/10 dark:text-zinc-200 dark:backdrop-blur-md">
                <span className="font-semibold text-xs sm:text-sm flex items-center gap-2">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                  pinay.py
                </span>
              </div>
              <h1 className="text-4xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-foreground leading-[1.1] text-balance">
                Smart events start with automation.
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed text-balance max-w-lg">
                Organize, monitor attendance and generate verified certificates without the manual work.
              </p>
            </div>

            {/* Buttons at Layer (above lanyard visually, but z-index managed for overlap) */}
            <div className="relative z-[60] flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white text-sm sm:text-base w-full sm:w-auto font-bold rounded-xl shadow-xl shadow-primary/20"
                onClick={() => router.push('/auth/signin')}
              >
                Create an Event
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 text-white" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-zinc-200 dark:border-zinc-800 text-sm sm:text-base w-full sm:w-auto font-bold rounded-xl bg-background/50 backdrop-blur-sm"
                onClick={() => router.push('/developers')}
              >
                Developers
              </Button>
            </div>

            {/* Trust Indicators - Desktop only or spaced for mobile */}
            <div className="pt-6 sm:pt-8 border-t border-border w-full hidden sm:block">
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">Trusted by leading institutions</p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-6 md:gap-8 items-start sm:items-center opacity-60">
                <span className="font-semibold text-foreground text-sm sm:text-base">HCDC Campus-Wide Events</span>
                <span className="font-semibold text-foreground text-sm sm:text-base">Departmental Events</span>
                <span className="font-semibold text-foreground text-sm sm:text-base">VPAA Seminars</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

