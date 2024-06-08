import React, { useRef, useEffect, useState } from "react";
import io from "socket.io-client";

function Webrtc() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const socket = useRef(null);
  const [isCaller, setIsCaller] = useState(false);

  useEffect(() => {
    // Set up socket connection
    socket.current = io("http://localhost:5000");
    socket.current.on("offer", handleReceiveOffer);
    socket.current.on("answer", handleReceiveAnswer);
    socket.current.on("candidate", handleNewICECandidateMsg);

    // Get user media
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localVideoRef.current.srcObject = stream;
        peerConnection.current = createPeerConnection(stream);
      })
      .catch((error) => console.error("Error accessing media devices.", error));

    return () => {
      // Cleanup on unmount
      if (peerConnection.current) {
        peerConnection.current.close();
      }
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, []);

  const createPeerConnection = (stream) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.stunprotocol.org" }],
    });

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.onicecandidate = handleICECandidateEvent;
    pc.ontrack = handleTrackEvent;
    return pc;
  };

  const handleICECandidateEvent = (event) => {
    if (event.candidate) {
      socket.current.emit("candidate", event.candidate);
    }
  };

  const handleTrackEvent = (event) => {
    remoteVideoRef.current.srcObject = event.streams[0];
  };

  const handleReceiveOffer = (offer) => {
    peerConnection.current.setRemoteDescription(
      new RTCSessionDescription(offer)
    );
    peerConnection.current.createAnswer().then((answer) => {
      peerConnection.current.setLocalDescription(answer);
      socket.current.emit("answer", answer);
    });
  };

  const handleReceiveAnswer = (answer) => {
    peerConnection.current.setRemoteDescription(
      new RTCSessionDescription(answer)
    );
  };

  const handleNewICECandidateMsg = (candidate) => {
    const newCandidate = new RTCIceCandidate(candidate);
    peerConnection.current
      .addIceCandidate(newCandidate)
      .catch((error) =>
        console.error("Error adding received ice candidate", error)
      );
  };

  const startCall = () => {
    setIsCaller(true);
    peerConnection.current.createOffer().then((offer) => {
      peerConnection.current.setLocalDescription(offer);
      socket.current.emit("offer", offer);
    });
  };

  return (
    <div>
      <video
        ref={localVideoRef}
        autoPlay
        muted
        style={{ width: "300px" }}
      ></video>
      <video ref={remoteVideoRef} autoPlay style={{ width: "300px" }}></video>
      <button onClick={startCall} disabled={isCaller}>
        Start Call
      </button>
    </div>
  );
}

export default Webrtc;
