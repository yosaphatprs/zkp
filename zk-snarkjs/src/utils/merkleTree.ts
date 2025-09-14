/**
 * Merkle Tree Implementation for ZKP Medical Verification
 */
import { buildPoseidonOpt, buildPoseidon } from "circomlibjs";

let poseidonInstance: any = null;

// Initialize the Poseidon hash function
async function initPoseidon() {
  if (!poseidonInstance) {
    try {
      // Try optimized version first
      poseidonInstance = await buildPoseidonOpt();
    } catch (e) {
      // Fall back to regular version
      poseidonInstance = await buildPoseidon();
    }
  }
  return poseidonInstance;
}

// Poseidon hash wrapper function
export async function poseidonHash(...inputs: number[]): Promise<string> {
  const poseidon = await initPoseidon();
  const hash = poseidon(inputs);
  return poseidon.F.toString(hash);
}

// Convert string to number hash for keys
export function hashKey(key: string): number {
  // Use the same mapping as in the circuit
  if (key === "age") {
    return 1;
  } else if (key === "vaccineStatus") {
    return 2;
  } else {
    return 0;
  }
}

export class MerkleTree {
  private depth: number;
  private leaves: string[];
  private tree: string[][];

  constructor(depth: number) {
    this.depth = depth;
    this.leaves = [];
    this.tree = Array(depth + 1)
      .fill(0)
      .map(() => []);
  }

  // Add a leaf to the tree
  async addLeaf(key: string, value: number, salt: number): Promise<number> {
    const leaf = await poseidonHash(hashKey(key), value, salt);
    this.leaves.push(leaf);
    return this.leaves.length - 1; // Return the index of the added leaf
  }

  // Get the number of leaves
  getLeafCount(): number {
    return this.leaves.length;
  }

  // Build the Merkle tree
  async buildTree(): Promise<string> {
    // Reset tree except for leaves
    this.tree = Array(this.depth + 1)
      .fill(0)
      .map(() => []);
    this.tree[0] = [...this.leaves];

    // Fill in empty leaves if needed
    const leavesNeeded = Math.pow(2, this.depth);
    while (this.tree[0].length < leavesNeeded) {
      this.tree[0].push("0"); // Zero value for empty leaves
    }

    // Build the tree
    for (let level = 0; level < this.depth; level++) {
      for (let i = 0; i < this.tree[level].length; i += 2) {
        const left = this.tree[level][i];
        const right = this.tree[level][i + 1];
        const parent = await poseidonHash(parseInt(left), parseInt(right));
        this.tree[level + 1].push(parent);
      }
    }

    // Return the root as a single string value
    return this.tree[this.depth][0].toString();
  }

  // Generate Merkle proof for a leaf
  generateProof(leafIndex: number): {
    pathElements: string[];
    pathIndices: number[];
  } {
    if (leafIndex >= this.leaves.length) {
      throw new Error("Leaf index out of bounds");
    }

    const pathElements = [];
    const pathIndices = [];
    let currentIndex = leafIndex;

    for (let level = 0; level < this.depth; level++) {
      const isRight = currentIndex % 2 === 1;
      const siblingIndex = isRight ? currentIndex - 1 : currentIndex + 1;

      pathElements.push(this.tree[level][siblingIndex]);
      pathIndices.push(isRight ? 0 : 1); // 0 for left, 1 for right

      // Move to parent index
      currentIndex = Math.floor(currentIndex / 2);
    }

    return { pathElements, pathIndices };
  }
}

// Example usage
export async function createMerkleTreeWithPatientData(
  age: number,
  vaccineStatus: number,
  saltAge: number,
  saltVaccine: number,
  depth: number = 4
): Promise<{
  root: string;
  ageProof: { pathElements: string[]; pathIndices: number[] };
  vaccineProof: { pathElements: string[]; pathIndices: number[] };
}> {
  const tree = new MerkleTree(depth);

  // Add age leaf
  const ageLeafIndex = await tree.addLeaf("age", age, saltAge);

  // Add vaccine status leaf
  const vaccineLeafIndex = await tree.addLeaf(
    "vaccineStatus",
    vaccineStatus,
    saltVaccine
  );

  // Build the tree
  const root = await tree.buildTree();

  // Generate proofs
  const ageProof = tree.generateProof(ageLeafIndex);
  const vaccineProof = tree.generateProof(vaccineLeafIndex);

  return {
    root,
    ageProof,
    vaccineProof,
  };
}
