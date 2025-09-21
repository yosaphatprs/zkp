#!/bin/bash

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed"
    exit 1
fi

node_version=$(node --version)
echo "Node.js version: $node_version"

required_node_version="v24.0.0"
if [[ "$node_version" < "$required_node_version" ]]; then
    echo "Warning: Node.js version should be $required_node_version or higher"
    exit 1
fi

snarkjs_v=$(snarkjs --help | grep 'snarkjs@')
echo "Snarkjs version: $snarkjs_v"

required_snarkjs_version="snarkjs@0.7.5"
if [[ "$snarkjs_v" != "$required_snarkjs_version" ]]; then
    echo "Warning: Snarkjs version mismatch"
    exit 1
fi

# Load .env if available
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

# Get curve from env or prompt
if [ -z "$CURVE" ]; then
    PS3="Choose type of curve: "
    select curve in "bn128" "bls12-381"; do
      break
    done
else
    curve="$CURVE"
    echo "Using curve from .env: $curve"
fi

# Get max constraints from env or prompt
if [ -z "$MAX_CONSTRAINTS" ]; then
    echo -n "Enter maximum number of constraints: "
    read max_constraints
else
    max_constraints="$MAX_CONSTRAINTS"
    echo "Using max constraints from .env: $max_constraints"
fi

if [[ "$max_constraints" > "28" ]]; then
    echo "Warning: maximum of constraints is 28"
    exit 1
fi

# echo "Folder Name: $folder_name"
# echo "Ptau: snarkjs powersoftau new $curve $max_constraints pot$max_constraints""_0000.ptau -v"

# Start PTAU
snarkjs powersoftau new $curve $max_constraints pot$max_constraints""_0000.ptau -v

# Contribute to ceremony
# First Contribution
if [ -z "$FIRST_CONTRIBUTION_NAME" ]; then
    echo -n "Enter first contribution name: "
    read first_contribution_name
else
    first_contribution_name="$FIRST_CONTRIBUTION_NAME"
    echo "Using first contribution name from .env: $first_contribution_name"
fi

if [ -z "$FIRST_CONTRIBUTION_ENTROPY" ]; then
    echo "You'll enter some random text as source to entropy below"
    snarkjs powersoftau contribute pot$max_constraints""_0000.ptau pot$max_constraints""_0001.ptau --name=$first_contribution_name -v
else
    echo "Using first contribution entropy from .env"
    snarkjs powersoftau contribute pot$max_constraints""_0000.ptau pot$max_constraints""_0001.ptau --name=$first_contribution_name -v -e="$FIRST_CONTRIBUTION_ENTROPY"
fi

# Second Contribution
if [ -z "$SECOND_CONTRIBUTION_NAME" ]; then
    echo -n "Enter second contribution name: "
    read second_contribution_name
else
    second_contribution_name="$SECOND_CONTRIBUTION_NAME"
    echo "Using second contribution name from .env: $second_contribution_name"
fi

if [ -z "$SECOND_CONTRIBUTION_ENTROPY" ]; then
    echo "You'll enter some random text as source to entropy below"
    snarkjs powersoftau contribute pot$max_constraints""_0001.ptau pot$max_constraints""_0002.ptau --name=$second_contribution_name -v
else
    echo "Using second contribution entropy from .env"
    snarkjs powersoftau contribute pot$max_constraints""_0001.ptau pot$max_constraints""_0002.ptau --name=$second_contribution_name -v -e="$SECOND_CONTRIBUTION_ENTROPY"
fi

# Third Contribution
if [ -z "$THIRD_CONTRIBUTION_NAME" ]; then
    echo -n "Enter third contribution name: "
    read third_contribution_name
else
    third_contribution_name="$THIRD_CONTRIBUTION_NAME"
    echo "Using third contribution name from .env: $third_contribution_name"
fi

snarkjs powersoftau export challenge pot$max_constraints""_0002.ptau challenge_0003

echo "You'll enter some random text as source to entropy for third contribution below"
if [ -z "$THIRD_CONTRIBUTION_ENTROPY" ]; then
    echo -n "Enter some random text (as entropy): "
    read third_contribution_entropy
else
    third_contribution_entropy="$THIRD_CONTRIBUTION_ENTROPY"
    echo "Using entropy from .env: $third_contribution_entropy"
fi

snarkjs powersoftau challenge contribute $curve challenge_0003 response_0003 -e=$third_contribution_entropy
snarkjs powersoftau import response pot$max_constraints""_0002.ptau response_0003 pot$max_constraints""_0003.ptau -n=$third_contribution_name

# Verify
output=$(snarkjs powersoftau verify pot$max_constraints""_0003.ptau | grep 'Powers Of tau file OK!')
if [[ "$output" == *"Powers Of tau file OK!"* ]]; then
    echo "[OK]  Powers Of tau file OK!"
else
    echo "Error: Powers Of tau file not OK!"
    exit 1
fi

# Apply random beacon to finalize phase 1
# Get beacon parameters from env or use defaults
if [ -z "$BEACON_HASH" ]; then
    beacon_hash="0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f"
    echo "Using default beacon hash"
else
    beacon_hash="$BEACON_HASH"
    echo "Using beacon hash from .env: $beacon_hash"
fi

if [ -z "$BEACON_ITERATIONS" ]; then
    echo -n "Enter beacon iterations: "
    read beacon_iterations
else
    beacon_iterations="$BEACON_ITERATIONS"
    echo "Using beacon iterations from .env: $beacon_iterations"
fi

if [ -z "$BEACON_NAME" ]; then
    echo -n "Enter beacon name: "
    read beacon_name
else
    beacon_name="$BEACON_NAME"
    echo "Using beacon name from .env: $beacon_name"
fi

echo "Applying random beacon to finalize phase 1..."
snarkjs powersoftau beacon pot$max_constraints""_0003.ptau pot$max_constraints""_beacon.ptau $beacon_hash $beacon_iterations -n="$beacon_name"

# Second Phase
# Prepare
snarkjs powersoftau prepare phase2 pot$max_constraints""_beacon.ptau pot$max_constraints""_final.ptau -v

# Verify final ptau
echo "Verifying final ptau file..."
output=$(snarkjs powersoftau verify pot$max_constraints""_final.ptau | grep 'Powers of Tau Ok!')
if [[ "$output" == *"Powers of Tau Ok!"* ]]; then
    echo "[OK]  Powers of Tau Ok!"
else
    echo "Error: Powers of Tau verification failed!"
    exit 1
fi

# Copy circuit file from circuit folder
if [ -z "$CIRCUIT_FILE" ]; then
    echo -n "Enter circuit filename from circuit-snarkjs-medrec/ folder: "
    read circuit_file
else
    circuit_file="$CIRCUIT_FILE"
    echo "Using circuit file from .env: $circuit_file"
fi

circuit_source="../circuit-snarkjs-medrec/$circuit_file"
if [ -f "$circuit_source" ]; then
    echo "Copying circuit file from circuit-snarkjs-medrec/$circuit_file..."
    cp "$circuit_source" "./circuit.circom"
    echo "Circuit file copied successfully!"
else
    echo "Error: Circuit file $circuit_source not found!"
    exit 1
fi

# Compile the circuit (use the copied file name)
echo "Compiling circuit..."
circom --r1cs --wasm --c --sym --inspect circuit.circom

# View information about the circuit
echo "Circuit information:"
snarkjs r1cs info circuit.r1cs

echo "Circuit constraints:"
snarkjs r1cs print circuit.r1cs circuit.sym

echo "Export r1cs to JSON"
snarkjs r1cs export json circuit.r1cs circuit.r1cs.json
cat circuit.r1cs.json

# Calculate Witness
if [ -z "$CIRCUIT_INPUT_JSON" ]; then
    echo -n "Enter input json from circuit-snarkjs-medrec/ folder: "
    read circuit_input_json
else
    circuit_input_json="$CIRCUIT_INPUT_JSON"
    echo "Using input json from .env: $circuit_input_json"
fi
circuit_input_json="../circuit-snarkjs-medrec/$circuit_input_json"
echo "Calculate the witness"
snarkjs wtns calculate circuit_js/circuit.wasm $circuit_input_json witness.wtns

# check if the generated witness complies with the r1cs file
snarkjs wtns check circuit.r1cs witness.wtns


# Setup
# choose proving system (choose if PROVING_SYS not set)
if [ -z "$PROVING_SYS" ]; then
    PS3="Choose type of proving systems: "
    select proving in "Groth16" "PLONK" "FFLONK"; do
        if [ -n "$proving" ]; then
            break
        fi
        echo "Invalid selection. Choose 1, 2 or 3."
    done
else
    proving="$PROVING_SYS"
    echo "Using proving system from .env: $proving"
fi

case "$proving" in
  "Groth16")
    echo "Using Groth16 workflow"
    snarkjs groth16 setup circuit.r1cs pot14_final.ptau circuit_0000.zkey

    # Contribute Phase 2
    echo "1st Contribute Phase 2"
    if [ -z "$PHASE2_FIRST_ENTROPY" ]; then
        snarkjs zkey contribute circuit_0000.zkey circuit_0001.zkey --name="1st Contributor Name" -v
    else
        echo "Using phase 2 first entropy from .env"
        snarkjs zkey contribute circuit_0000.zkey circuit_0001.zkey --name="1st Contributor Name" -v -e="$PHASE2_FIRST_ENTROPY"
    fi

    # Second Contribute Phase 2
    echo "2nd Contribute Phase 2"
    if [ -z "$PHASE2_SECOND_ENTROPY" ]; then
        snarkjs zkey contribute circuit_0001.zkey circuit_0002.zkey --name="Second contribution Name" -v
    else
        echo "Using phase 2 second entropy from .env"
        snarkjs zkey contribute circuit_0001.zkey circuit_0002.zkey --name="Second contribution Name" -v -e="$PHASE2_SECOND_ENTROPY"
    fi

    # Third Contribute Phase 2
    echo "3rd Contribute Phase 2"
    snarkjs zkey export bellman circuit_0002.zkey  challenge_phase2_0003
    if [ -z "$PHASE2_THIRD_ENTROPY" ]; then
        snarkjs zkey bellman contribute $curve challenge_phase2_0003 response_phase2_0003 -e="some random text"
    else
        echo "Using phase 2 third entropy from .env"
        snarkjs zkey bellman contribute $curve challenge_phase2_0003 response_phase2_0003 -e="$PHASE2_THIRD_ENTROPY"
    fi
    snarkjs zkey import bellman circuit_0002.zkey response_phase2_0003 circuit_0003.zkey -n="Third contribution name"

    # Verify
    snarkjs zkey verify circuit.r1cs pot$max_constraints""_final.ptau circuit_0003.zkey

    # Apply random beacon
    snarkjs zkey beacon circuit_0003.zkey circuit_final.zkey 0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f 10 -n="Final Beacon phase2"
    ;;
  "PLONK")
    echo "Using PLONK workflow"
    snarkjs plonk setup circuit.r1cs pot$max_constraints""_final.ptau circuit_final.zkey
    ;;
  "FFLONK")
    echo "Using FFLONK workflow"
    snarkjs fflonk setup circuit.r1cs pot$max_constraints""_final.ptau circuit.zkey
    ;;
  *)
    echo "Unknown proving system: '$proving'"
    exit 1
    ;;
esac

# Verify final Zkey
snarkjs zkey verify circuit.r1cs pot$max_constraints""_final.ptau circuit_final.zkey

# Export the verification key
snarkjs zkey export verificationkey circuit_final.zkey verification_key.json

# Calculate the witness and generate the proof in one step
case "$proving" in
  "Groth16")
    snarkjs groth16 prove circuit_final.zkey witness.wtns proof.json public.json
    ;;
  "PLONK")
    snarkjs plonk prove circuit_final.zkey witness.wtns proof.json public.json
    ;;
  "FFLONK")
    snarkjs fflonk prove circuit.zkey witness.wtns proof.json public.json
    ;;
  *)
    echo "Unknown proving system: '$proving'"
    exit 1
    ;;
esac

# Verify the proof
case "$proving" in
  "Groth16")
    snarkjs groth16 verify verification_key.json public.json proof.json
    ;;
  "PLONK")
    snarkjs plonk verify verification_key.json public.json proof.json
    ;;
  "FFLONK")
    snarkjs fflonk verify verification_key.json public.json proof.json
    ;;
  *)
    echo "Unknown proving system: '$proving'"
    exit 1
    ;;
esac

# Turn the verifier into a smart contract
snarkjs zkey export solidityverifier circuit_final.zkey verifier.sol

# Simulate verification call
snarkjs zkey export soliditycalldata public.json proof.json