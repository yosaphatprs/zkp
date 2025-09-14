import { useState, useEffect } from "react";
import "./App.css";
import { createMerkleTreeWithPatientData } from "./utils/merkleTree";

// Define the Merkle tree depth
const MERKLE_TREE_DEPTH = 4;

declare global {
  interface Window {
    snarkjs: any;
  }
}

// Helper function to generate a random number for salt
function generateRandomSalt(): string {
  // Generate a random number between 100000000 and 999999999
  return Math.floor(100000000 + Math.random() * 900000000).toString();
}

function App() {
  const snarkjs = window.snarkjs;
  const [proof, setProof] = useState("");
  const [publicSign, setPublicSign] = useState("");
  const [verifyValue, setVerifyValue] = useState("none");
  const [isLoading, setIsLoading] = useState(false);
  const [merkleData, setMerkleData] = useState<any>(null);

  const initialInput = {
    age: "",
    vaccineStatus: "1", // Default to vaccinated
    saltAge: "",
    saltVaccine: "",
    threshold: "18", // Default minimum age
    claimVaccineStatus: "1", // Default claiming vaccinated
  };

  const [inputFields, setInput] = useState(initialInput);
  const {
    age,
    vaccineStatus,
    saltAge,
    saltVaccine,
    threshold,
    claimVaccineStatus,
  } = inputFields;

  function handleChange(e: any) {
    const { name, value } = e.target;
    setInput(() => {
      return {
        ...inputFields,
        [name]: value,
      };
    });
  }

  // Generate random salts
  function handleGenerateSalts() {
    setInput({
      ...inputFields,
      saltAge: generateRandomSalt(),
      saltVaccine: generateRandomSalt(),
    });
  }

  // Load a preset case
  function loadPreset(preset: string) {
    let newInputs = { ...initialInput };

    switch (preset) {
      case "valid-vaccinated":
        newInputs = {
          age: "25",
          vaccineStatus: "1",
          saltAge: "987654321",
          saltVaccine: "123456789",
          threshold: "18",
          claimVaccineStatus: "1",
        };
        break;
      case "underage-vaccinated":
        newInputs = {
          age: "16",
          vaccineStatus: "1",
          saltAge: "876543210",
          saltVaccine: "987654321",
          threshold: "18",
          claimVaccineStatus: "1",
        };
        break;
      case "valid-unvaccinated":
        newInputs = {
          age: "30",
          vaccineStatus: "0",
          saltAge: "765432109",
          saltVaccine: "876543210",
          threshold: "18",
          claimVaccineStatus: "0",
        };
        break;
      case "invalid-claim":
        newInputs = {
          age: "22",
          vaccineStatus: "0",
          saltAge: "654321098",
          saltVaccine: "765432109",
          threshold: "18",
          claimVaccineStatus: "1", // Invalid: claiming vaccinated when not
        };
        break;
    }

    setInput(newInputs);
  }

  // Calculate merkle data when relevant inputs change
  useEffect(() => {
    async function generateMerkleData() {
      if (age && vaccineStatus && saltAge && saltVaccine) {
        try {
          const merkleResult = await createMerkleTreeWithPatientData(
            Number(age),
            Number(vaccineStatus),
            Number(saltAge),
            Number(saltVaccine),
            MERKLE_TREE_DEPTH
          );
          setMerkleData(merkleResult);
        } catch (error) {
          console.error("Error generating Merkle tree:", error);
        }
      }
    }

    generateMerkleData();
  }, [age, vaccineStatus, saltAge, saltVaccine]);

  async function calculateProof() {
    setIsLoading(true);
    console.log("Calculating Proof");

    try {
      if (!merkleData) {
        throw new Error(
          "Merkle data not generated. Please enter all required fields."
        );
      }

      // Create input object for the proof
      const input = {
        root: merkleData.root,
        threshold: threshold,
        claimVaccineStatus: claimVaccineStatus,
        age: age,
        vaccineStatus: vaccineStatus,
        saltAge: saltAge,
        saltVaccine: saltVaccine,
        pathElementsAge: merkleData.ageProof.pathElements,
        pathElementsVaccine: merkleData.vaccineProof.pathElements,
        pathIndicesAge: merkleData.ageProof.pathIndices,
        pathIndicesVaccine: merkleData.vaccineProof.pathIndices,
      };

      console.log("Using input:", input);

      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        "circuit.wasm",
        "circuit_final.zkey"
      );
      setProof(JSON.stringify(proof, null, 1));
      setPublicSign(JSON.stringify(publicSignals));

      const vkey = await fetch("verification_key.json").then(function (res) {
        return res.json();
      });

      const res = await snarkjs.groth16.verify(vkey, publicSignals, proof);
      setVerifyValue(res.toString());
    } catch (error) {
      console.error("Error generating proof:", error);
      setVerifyValue(
        "Error: " + (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <h1>Medical Verification ZKP Demo</h1>
      <code style={{ display: "block", marginBottom: "12px" }}>
        This app demonstrates zero-knowledge proofs for medical verification
        using Merkle trees.
        <br />
        You can verify age and vaccination status without revealing actual data.
      </code>

      <div style={{ marginBottom: "20px" }}>
        <h3>Test Cases</h3>
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "20px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => loadPreset("valid-vaccinated")}
            style={{
              backgroundColor: "var(--btn-success)",
              padding: "8px 12px",
            }}
          >
            Valid Vaccinated
          </button>
          <button
            onClick={() => loadPreset("underage-vaccinated")}
            style={{
              backgroundColor: "var(--btn-warning)",
              padding: "8px 12px",
            }}
          >
            Underage Vaccinated
          </button>
          <button
            onClick={() => loadPreset("valid-unvaccinated")}
            style={{ backgroundColor: "var(--btn-info)", padding: "8px 12px" }}
          >
            Valid Unvaccinated
          </button>
          <button
            onClick={() => loadPreset("invalid-claim")}
            style={{
              backgroundColor: "var(--btn-danger)",
              padding: "8px 12px",
            }}
          >
            Invalid Claim
          </button>
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Patient Information (Private)</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div>
            <label>Patient Age: </label>
            <input
              name="age"
              value={age}
              onChange={handleChange}
              placeholder="e.g., 25"
              style={{ padding: "4px", marginLeft: "10px" }}
            />
          </div>

          <div>
            <label>Vaccination Status: </label>
            <select
              name="vaccineStatus"
              value={vaccineStatus}
              onChange={handleChange}
              style={{ padding: "4px", marginLeft: "10px" }}
            >
              <option value="1">Vaccinated</option>
              <option value="0">Not Vaccinated</option>
            </select>
          </div>

          <div>
            <label>Salt (Age): </label>
            <input
              name="saltAge"
              value={saltAge}
              onChange={handleChange}
              placeholder="Random number for privacy"
              style={{ padding: "4px", marginLeft: "10px" }}
            />
          </div>

          <div>
            <label>Salt (Vaccine): </label>
            <input
              name="saltVaccine"
              value={saltVaccine}
              onChange={handleChange}
              placeholder="Random number for privacy"
              style={{ padding: "4px", marginLeft: "10px" }}
            />
          </div>

          <div>
            <button
              onClick={handleGenerateSalts}
              style={{
                backgroundColor: "var(--btn-secondary)",
                padding: "8px 12px",
                width: "fit-content",
                marginTop: "10px",
              }}
            >
              Generate Random Salts
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Verification Requirements (Public)</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div>
            <label>Minimum Age: </label>
            <input
              name="threshold"
              value={threshold}
              onChange={handleChange}
              placeholder="e.g., 18"
              style={{ padding: "4px", marginLeft: "10px" }}
            />
          </div>

          <div>
            <label>Claim Vaccination Status: </label>
            <select
              name="claimVaccineStatus"
              value={claimVaccineStatus}
              onChange={handleChange}
              style={{ padding: "4px", marginLeft: "10px" }}
            >
              <option value="1">Vaccinated</option>
              <option value="0">Not Vaccinated</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Merkle Tree Data</h3>
        <p>
          Merkle Root: {merkleData ? merkleData.root : "Not calculated yet"}
        </p>
        <p>
          <small>
            This is automatically calculated based on the private inputs
          </small>
        </p>
      </div>

      <button
        id="bGenProof"
        onClick={calculateProof}
        disabled={isLoading || !merkleData}
        style={
          isLoading || !merkleData
            ? {
                cursor: "not-allowed",
                padding: "10px 20px",
                backgroundColor: "var(--button-disabled)",
              }
            : { padding: "10px 20px", backgroundColor: "var(--btn-primary)" }
        }
      >
        {isLoading ? "Generating Proof..." : "Generate Zero-Knowledge Proof"}
      </button>
      {!merkleData && (
        <p>
          <small>
            Please fill in all patient information fields to enable proof
            generation
          </small>
        </p>
      )}

      <div className="verification-container">
        <h3 className="verification-title">Verification Results</h3>

        {verifyValue !== "none" && (
          <div
            className={
              verifyValue === "true"
                ? "verification-success"
                : "verification-error"
            }
          >
            Result:{" "}
            {verifyValue === "true"
              ? "✓ Verification Successful"
              : "✗ Verification Failed"}
          </div>
        )}

        <pre className="proof">
          <strong>Proof:</strong> <code id="proof">{proof}</code>
        </pre>

        <pre className="publicSign">
          <strong>Public Signals:</strong>{" "}
          <code id="publicSign">{publicSign}</code>
        </pre>
      </div>
    </>
  );
}

export default App;
