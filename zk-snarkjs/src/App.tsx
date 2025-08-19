import "./App.css";

declare global {
  interface Window {
    snarkjs: any;
  }
}

function App() {
  const proofComponent = document.getElementById("proof");
  const resultComponent = document.getElementById("result");
  const bGenProof = document.getElementById("bGenProof");
  const snarkjs = window.snarkjs;

  if (bGenProof) {
    bGenProof.addEventListener("click", calculateProof);
  }

  async function calculateProof() {
    console.log("Calculating Proof");
    const a = 1;
    const b = 15;
    const pubs = 11483229616558506910642014146855464484105997386704495697571235910752681272591;
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      { a: a, b: b },
      "circuit.wasm",
      "circuit_final.zkey"
    );
    console.log(publicSignals);
    console.log(a, b);
    if (proofComponent) {
      proofComponent.innerHTML = JSON.stringify(proof, null, 1);
    }

    const vkey = await fetch("verification_key.json").then(function (res) {
      return res.json();
    });

    const res = await snarkjs.groth16.verify(vkey, pubs, proof);

    if (resultComponent) {
      resultComponent.innerHTML = res;
    }
  }

  return (
    <>
      <h1>Snarkjs client example</h1>
      <button id="bGenProof" onClick={calculateProof}>
        Create proof
      </button>

      <pre className="proof">
        Proof: <code id="proof"></code>
      </pre>

      <pre className="proof">
        Result: <code id="result"></code>
      </pre>
    </>
  );
}

export default App;
