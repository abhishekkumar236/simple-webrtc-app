import React, { useRef } from "react";
import Webrtc from "./components/Webrtc";

function App() {
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  return (
    <div>
      <Webrtc />
    </div>
  );
}

export default App;
