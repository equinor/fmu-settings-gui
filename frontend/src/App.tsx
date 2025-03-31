import fmuLogo from "./assets/fmu_logo_full.svg";
import "./App.css";

function App() {
  return (
    <>
      <div>
        <img src={fmuLogo} className="logo" alt="FMU logo" />
      </div>
      <h1>FMU Settings</h1>
    </>
  );
}

export default App;
