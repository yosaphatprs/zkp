import { useState } from "react";
import "./App.css";

declare global {
  interface Window {
    snarkjs: any;
  }
}

function App() {
  const snarkjs = window.snarkjs;
  const [proof, setProof] = useState("");
  const [publicSign, setPublicSign] = useState("");
  const [verifyValue, setVerifyValue] = useState("none");
  const [isLoading, setIsLoading] = useState(false);
  // const [proofCounter, setProofCounter] = useState(0);

  const initialInput = {
    inputA: "",
    inputB: "",
  };

  const [inputFields, setInput] = useState(initialInput);
  const { inputA, inputB } = inputFields;

  function handleChange(e: any) {
    const { name, value } = e.target;
    setInput(() => {
      return {
        ...inputFields,
        [name]: value,
      };
    });
  }

  async function calculateProof() {
    setIsLoading(true);
    console.log("Calculating Proof");
    // setProofCounter((c) => {
    //   if (c >= 20) {
    //     alert(
    //       "Silahkan refresh halaman ini, karena kebutuhan memory sudah terlalu besar!"
    //     );
    //     console.log("Refresh this page");
    //   }
    //   return c + 1;
    // });
    // setProofCounter(proofCounter + 1);
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      { a: inputA, b: inputB },
      "circuit.wasm",
      "circuit_final.zkey"
    );
    setProof(JSON.stringify(proof, null, 1));
    setPublicSign(publicSignals);

    const vkey = await fetch("verification_key.json").then(function (res) {
      return res.json();
    });

    const res = await snarkjs.groth16.verify(vkey, publicSignals, proof);
    setVerifyValue(res.toString());
    setIsLoading(false);
  }

  return (
    <>
      <h1>Snarkjs client example</h1>
      <code style={{ display: "block", marginBottom: "12px" }}>
        Input bellow is based from the circuit configured on Snarkjs part,
        including how much input should be here and what type it was.
        <br></br>
        This example use two integer inputs.
      </code>
      <input
        name="inputA"
        value={inputA}
        onChange={handleChange}
        style={{
          display: "block",
          padding: "4px",
          marginTop: "8px",
          marginBottom: "8px",
        }}
      ></input>
      <input
        name="inputB"
        value={inputB}
        onChange={handleChange}
        style={{
          display: "block",
          padding: "4px",
          marginTop: "8px",
          marginBottom: "8px",
        }}
      ></input>
      <button
        id="bGenProof"
        onClick={calculateProof}
        disabled={isLoading}
        style={isLoading ? { cursor: "not-allowed" } : {}}
      >
        {isLoading ? "Loading..." : "Create Proof"}
      </button>

      <pre className="proof">
        Proof: <code id="proof">{proof}</code>
      </pre>

      <pre className="publicSign">
        Public Sign: <code id="publicSign">{publicSign}</code>
      </pre>

      <pre className="result">
        Result: <code id="result">{verifyValue}</code>
      </pre>
    </>
  );
}

export default App;
