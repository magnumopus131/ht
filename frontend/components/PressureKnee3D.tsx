import { useMemo } from 'react'
import { MeshStandardMaterial } from 'three'

interface PressureMap {
  medialTibialPlateau: number
  lateralTibialPlateau: number
  patella: number
  medialCollateralLigament: number
  lateralCollateralLigament: number
  aclInsertion: number
}

function getPressureColor(intensity: number): string {
  // Heatmap: blue (low) -> green (normal) -> yellow (moderate) -> red (high)
  if (intensity < 0.3) {
    // Blue to cyan
    const t = intensity / 0.3
    const r = Math.floor(0 + t * 0)
    const g = Math.floor(100 + t * 200)
    const b = Math.floor(200 + t * 255)
    return `rgb(${r},${g},${b})`
  } else if (intensity < 0.6) {
    // Cyan to green to yellow
    const t = (intensity - 0.3) / 0.3
    const r = Math.floor(0 + t * 255)
    const g = Math.floor(255 - t * 50)
    const b = Math.floor(255 - t * 255)
    return `rgb(${r},${g},${b})`
  } else {
    // Yellow to red
    const t = (intensity - 0.6) / 0.4
    const r = 255
    const g = Math.floor(255 - t * 255)
    const b = 0
    return `rgb(${r},${g},${b})`
  }
}

export function PressureKneeModel({ pressureMap }: { pressureMap: PressureMap }) {
  const medialColor = useMemo(() => getPressureColor(pressureMap.medialTibialPlateau), [pressureMap.medialTibialPlateau])
  const lateralColor = useMemo(() => getPressureColor(pressureMap.lateralTibialPlateau), [pressureMap.lateralTibialPlateau])
  const patellaColor = useMemo(() => getPressureColor(pressureMap.patella), [pressureMap.patella])
  const mclColor = useMemo(() => getPressureColor(pressureMap.medialCollateralLigament), [pressureMap.medialCollateralLigament])
  const lclColor = useMemo(() => getPressureColor(pressureMap.lateralCollateralLigament), [pressureMap.lateralCollateralLigament])
  const aclColor = useMemo(() => getPressureColor(pressureMap.aclInsertion), [pressureMap.aclInsertion])

  return (
    <group>
      {/* Femur (thigh bone) */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.25, 0.3, 0.4, 32]} />
        <meshStandardMaterial color="#e0e0e0" roughness={0.7} />
      </mesh>

      {/* Patella (kneecap) */}
      <mesh position={[0, 0.4, 0.25]}>
        <boxGeometry args={[0.2, 0.15, 0.1]} />
        <meshStandardMaterial 
          color={patellaColor} 
          emissive={patellaColor}
          emissiveIntensity={pressureMap.patella * 0.5}
          roughness={0.6}
        />
      </mesh>

      {/* Medial Tibial Plateau (inner side) */}
      <mesh position={[-0.15, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.05, 32]} />
        <meshStandardMaterial 
          color={medialColor}
          emissive={medialColor}
          emissiveIntensity={pressureMap.medialTibialPlateau * 0.6}
          roughness={0.5}
        />
      </mesh>

      {/* Lateral Tibial Plateau (outer side) */}
      <mesh position={[0.15, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.05, 32]} />
        <meshStandardMaterial 
          color={lateralColor}
          emissive={lateralColor}
          emissiveIntensity={pressureMap.lateralTibialPlateau * 0.6}
          roughness={0.5}
        />
      </mesh>

      {/* Tibia (shin bone) */}
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 0.5, 32]} />
        <meshStandardMaterial color="#d0d0d0" roughness={0.7} />
      </mesh>

      {/* Medial Collateral Ligament (MCL) */}
      <mesh position={[-0.22, 0.25, 0]} rotation={[0, 0, Math.PI / 6]}>
        <cylinderGeometry args={[0.015, 0.015, 0.35, 8]} />
        <meshStandardMaterial 
          color={mclColor}
          emissive={mclColor}
          emissiveIntensity={pressureMap.medialCollateralLigament * 0.8}
        />
      </mesh>

      {/* Lateral Collateral Ligament (LCL) */}
      <mesh position={[0.22, 0.25, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <cylinderGeometry args={[0.015, 0.015, 0.35, 8]} />
        <meshStandardMaterial 
          color={lclColor}
          emissive={lclColor}
          emissiveIntensity={pressureMap.lateralCollateralLigament * 0.8}
        />
      </mesh>

      {/* ACL (Anterior Cruciate Ligament) */}
      <mesh position={[0.05, 0.35, 0.1]} rotation={[Math.PI / 3, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.3, 8]} />
        <meshStandardMaterial 
          color={aclColor}
          emissive={aclColor}
          emissiveIntensity={pressureMap.aclInsertion * 0.9}
        />
      </mesh>

      {/* Labels/Annotations */}
      <group>
        {/* Medial label */}
        <mesh position={[-0.35, 0.15, 0]}>
          <planeGeometry args={[0.15, 0.05]} />
          <meshBasicMaterial color="white" transparent opacity={0.8} />
        </mesh>
        
        {/* Lateral label */}
        <mesh position={[0.35, 0.15, 0]}>
          <planeGeometry args={[0.15, 0.05]} />
          <meshBasicMaterial color="white" transparent opacity={0.8} />
        </mesh>
      </group>
    </group>
  )
}

