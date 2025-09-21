pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

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

template MerkleProof(nLevels) {
    signal input leaf;
    signal input pathElements[nLevels];
    signal input pathIndices[nLevels];
    signal output root;

    component hashers[nLevels];
    signal levelHashes[nLevels + 1];
    levelHashes[0] <== leaf;

    signal s1[nLevels];
    signal s2[nLevels];
    signal left[nLevels];
    
    signal s3[nLevels];
    signal s4[nLevels];
    signal right[nLevels];

    for (var i = 0; i < nLevels; i++) {
        
        s1[i] <== (1 - pathIndices[i]) * levelHashes[i];
        s2[i] <== pathIndices[i] * pathElements[i];    
        left[i] <== s1[i] + s2[i];

        s3[i] <== pathIndices[i] * levelHashes[i];
        s4[i] <== (1 - pathIndices[i]) * pathElements[i];
        right[i] <== s3[i] + s4[i];
        
        hashers[i] = Poseidon(2);
        hashers[i].inputs[0] <== left[i];
        hashers[i].inputs[1] <== right[i];
        
        levelHashes[i+1] <== hashers[i].out;
    }

    root <== levelHashes[nLevels];
}

template VerifyPatientData(nLevels) {
    signal input root;
    signal input patientID_key;
    signal input ageThreshold;
    signal input claimVaccineStatus;

    signal input age;
    signal input vaccineStatus;
    signal input saltAge;
    signal input saltVaccine;
    signal input pathElementsAge[nLevels];
    signal input pathIndicesAge[nLevels];
    signal input pathElementsVaccine[nLevels];
    signal input pathIndicesVaccine[nLevels];

    component leafHashAge = SimpleLeafHash();
    leafHashAge.key <== patientID_key;
    leafHashAge.value <== age;
    leafHashAge.salt <== saltAge;

    component leafHashVaccine = SimpleLeafHash();
    leafHashVaccine.key <== patientID_key;
    leafHashVaccine.value <== vaccineStatus;
    leafHashVaccine.salt <== saltVaccine;

    component mpAge = MerkleProof(nLevels);
    mpAge.leaf <== leafHashAge.out;
    for (var i = 0; i < nLevels; i++) {
        mpAge.pathElements[i] <== pathElementsAge[i];
        mpAge.pathIndices[i]  <== pathIndicesAge[i];
    }
    mpAge.root === root;

    component mpVaccine = MerkleProof(nLevels);
    mpVaccine.leaf <== leafHashVaccine.out;
    for (var i = 0; i < nLevels; i++) {
        mpVaccine.pathElements[i] <== pathElementsVaccine[i];
        mpVaccine.pathIndices[i]  <== pathIndicesVaccine[i];
    }
    mpVaccine.root === root;

    component ageCheck = LessThan(16);
    ageCheck.in[0] <== ageThreshold - 1;
    ageCheck.in[1] <== age;
    
    component vaccineCheck = IsEqual();
    vaccineCheck.in[0] <== vaccineStatus;
    vaccineCheck.in[1] <== claimVaccineStatus;

    signal claimsValid <== ageCheck.out * vaccineCheck.out;
    claimsValid === 1;
}

component main { public [root, patientID_key, ageThreshold, claimVaccineStatus] } = VerifyPatientData(2);