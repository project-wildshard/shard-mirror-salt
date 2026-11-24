import * as THREE from 'three';

/**
 * QA 2026-11-24 row 14 (J510, Jake: "no flat images standing in for held or world objects; every one is a real 3D
 * model"): a printed sign face is a face on a board, never a bare plane. `face` is a plane `w` x `h` facing its local +Z;
 * this hangs a board `depth` thick behind it (a little larger, so its edges frame the print) and nudges the face out to
 * sit on the board's front. With `twoSided` the board carries a second print on its back.
 */
export function signBoard(face: THREE.Mesh, w: number, h: number, wood: THREE.Material, depth = 0.07, twoSided = false): THREE.Mesh {
  const board = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, h + 0.1, depth), wood);
  board.position.set(0, 0, -depth / 2 - 0.004);
  board.castShadow = true; board.receiveShadow = true;
  face.add(board);
  if (twoSided && !Array.isArray(face.material)) {
    const back = new THREE.Mesh(face.geometry, face.material);
    back.position.set(0, 0, -depth - 0.008); back.rotation.y = Math.PI;
    face.add(back);
  }
  return face;
}
