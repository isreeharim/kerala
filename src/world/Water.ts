import * as THREE from 'three';
import { MapDataLoader } from './MapDataLoader';

export class Water {
  public mesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;

  constructor(size: number, waterLevel: number) {
    // Custom animated shader for tropical Kerala backwater
    const vertexShader = `
      varying vec2 vUv;
      varying vec3 vWorldPosition;
      uniform float uTime;

      void main() {
        vUv = uv;
        vec3 pos = position;
        
        // Gentle wave undulating displacement
        float wave1 = sin(pos.x * 0.05 + uTime * 1.6) * cos(pos.z * 0.05 + uTime * 1.2) * 0.12;
        float wave2 = sin(pos.x * 0.12 - uTime * 2.2) * 0.04;
        pos.y += wave1 + wave2;

        vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `;

    const fragmentShader = `
      varying vec2 vUv;
      varying vec3 vWorldPosition;
      uniform float uTime;
      uniform vec3 uDeepColor;
      uniform vec3 uShallowColor;
      uniform vec3 uSunPosition;

      void main() {
        // Fresnel approximation for water reflection
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        vec3 normal = vec3(
          sin(vWorldPosition.x * 0.1 + uTime * 2.0) * 0.05,
          1.0,
          cos(vWorldPosition.z * 0.1 + uTime * 1.5) * 0.05
        );
        normal = normalize(normal);

        float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);

        // Specular sun highlight on ripples
        vec3 lightDir = normalize(uSunPosition - vWorldPosition);
        vec3 halfVector = normalize(lightDir + viewDir);
        float specular = pow(max(dot(normal, halfVector), 0.0), 32.0);

        // Water color blending
        vec3 waterColor = mix(uDeepColor, uShallowColor, 0.4 + fresnel * 0.5);
        waterColor += vec3(1.0, 0.95, 0.8) * specular * 0.6;

        gl_FragColor = vec4(waterColor, 0.88);
      }
    `;

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uDeepColor: { value: new THREE.Color(0x0f4a3e) },   // Deep emerald backwater
        uShallowColor: { value: new THREE.Color(0x1e8270) }, // Sunlit canal water
        uSunPosition: { value: new THREE.Vector3(120, 200, 150) }
      },
      transparent: true,
      side: THREE.DoubleSide
    });

    const geometry = new THREE.PlaneGeometry(size, size, 128, 128);
    geometry.rotateX(-Math.PI / 2);

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.position.y = waterLevel;
    this.mesh.receiveShadow = true;
  }

  public update(time: number): void {
    this.material.uniforms.uTime.value = time;
  }
}
