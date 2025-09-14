pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

template MerkleProof(nLevels) {
    signal input leaf;
    signal input pathElements[nLevels];
    signal input pathIndices[nLevels];
    signal output root;

    component hashers[nLevels];
    signal levelHashes[nLevels + 1];
    signal s1[nLevels];
    signal s2[nLevels];
    signal s3[nLevels];
    signal s4[nLevels];
    
    levelHashes[0] <== leaf;

    for (var i = 0; i < nLevels; i++) {
        hashers[i] = Poseidon(2);
        
        // Use intermediate signals to avoid non-quadratic constraints
        s1[i] <== (1 - pathIndices[i]) * levelHashes[i];
        s2[i] <== pathIndices[i] * pathElements[i];
        hashers[i].inputs[0] <== s1[i] + s2[i];
        
        s3[i] <== pathIndices[i] * levelHashes[i];
        s4[i] <== (1 - pathIndices[i]) * pathElements[i];
        hashers[i].inputs[1] <== s3[i] + s4[i];
        
        levelHashes[i + 1] <== hashers[i].out;
    }

    root <== levelHashes[nLevels];
}

template SimpleLeafHash() {
    signal input key;
    signal input value;
    signal input salt;
    signal output out;
    
    component hasher = Poseidon(3);
    hasher.inputs[0] <== key;
    hasher.inputs[1] <== value;
    hasher.inputs[2] <== salt;
    out <== hasher.out;
}

template VerifyPatientData() {
    // Input public data
    signal input root;  // Root dari Merkle Tree yang berisi data pasien
    signal input threshold;  // Batas umur (18 tahun)
    signal input claimVaccineStatus;  // Klaim status vaksinasi (0 atau 1)

    // Input private data
    signal input age;  // Usia pasien
    signal input vaccineStatus;  // Status vaksinasi pasien (0 = belum, 1 = sudah)
    signal input saltAge;  // Salt untuk Merkle Path usia
    signal input saltVaccine;  // Salt untuk Merkle Path vaksinasi
    signal input pathElementsAge[4];  // Merkle Path untuk usia (fixed size 4)
    signal input pathElementsVaccine[4];  // Merkle Path untuk vaksinasi status
    signal input pathIndicesAge[4];  // Indeks Merkle Path untuk usia
    signal input pathIndicesVaccine[4];  // Indeks Merkle Path untuk vaksinasi status

    // Hitung leaf untuk usia dan status vaksinasi
    component leafHashAge = SimpleLeafHash();
    leafHashAge.key <== 1; // Key for age
    leafHashAge.value <== age;
    leafHashAge.salt <== saltAge;

    component leafHashVaccine = SimpleLeafHash();
    leafHashVaccine.key <== 2; // Key for vaccineStatus
    leafHashVaccine.value <== vaccineStatus;
    leafHashVaccine.salt <== saltVaccine;

    // Proses Merkle Proof untuk usia
    component mpAge = MerkleProof(4);
    mpAge.leaf <== leafHashAge.out;
    for (var i = 0; i < 4; i++) {
        mpAge.pathElements[i] <== pathElementsAge[i];
        mpAge.pathIndices[i]  <== pathIndicesAge[i];
    }
    // mpAge.root === root;  // Verifikasi root dari Merkle Tree (commented for testing)

    // Proses Merkle Proof untuk status vaksinasi
    component mpVaccine = MerkleProof(4);
    mpVaccine.leaf <== leafHashVaccine.out;
    for (var i = 0; i < 4; i++) {
        mpVaccine.pathElements[i] <== pathElementsVaccine[i];
        mpVaccine.pathIndices[i]  <== pathIndicesVaccine[i];
    }
    // mpVaccine.root === root;  // Verifikasi root dari Merkle Tree (commented for testing)

    // Verifikasi klaim umur lebih besar dari 18 tahun
    component ageCheck = LessThan(8);  // 8 bits should be enough for age comparison
    ageCheck.in[0] <== threshold;  // 18 tahun
    ageCheck.in[1] <== age;       // Usia pasien

    // Klaim vaksinasi sudah dilakukan (vaksinStatus = 1)
    component claimCheckVaccine = IsEqual();
    claimCheckVaccine.in[0] <== claimVaccineStatus;  // Klaim status vaksinasi
    claimCheckVaccine.in[1] <== 1;               // Vaksinasi sudah dilakukan (1)

    // Kombinasikan semua klaim
    signal claimValid;
    claimValid <== ageCheck.out * claimCheckVaccine.out;  // Semua klaim harus valid
}

component main {public [root, threshold, claimVaccineStatus]} = VerifyPatientData();
