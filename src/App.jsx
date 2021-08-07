import React from 'react'
import './App.css'
import './style.css'
import firestore from './firebase'
import axios from 'axios';

// const servers = {
//   iceServers: [
//     {
//       urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
//     },
//     { "url": "stun:bn-turn1.xirsys.com"},
//     {
//       "username": "1ssIU-Pry4bpkeoE9LEC00l4vJRAVH58vK9EUViwA1vqBdR2h4HtiwttpxN5BkKpAAAAAGEIxX16YWhpbmFmc2Fy",
//       "url": "turn:bn-turn1.xirsys.com:80?transport=udp",
//       "credential": "fe2578b0-f412-11eb-85b3-0242ac140004"
//     },
//     {
//       "username": "1ssIU-Pry4bpkeoE9LEC00l4vJRAVH58vK9EUViwA1vqBdR2h4HtiwttpxN5BkKpAAAAAGEIxX16YWhpbmFmc2Fy",
//       "url": "turn:bn-turn1.xirsys.com:3478?transport=udp",
//       "credential": "fe2578b0-f412-11eb-85b3-0242ac140004"
//     },
//     {
//       "username": "1ssIU-Pry4bpkeoE9LEC00l4vJRAVH58vK9EUViwA1vqBdR2h4HtiwttpxN5BkKpAAAAAGEIxX16YWhpbmFmc2Fy",
//       "url": "turn:bn-turn1.xirsys.com:80?transport=tcp",
//       "credential": "fe2578b0-f412-11eb-85b3-0242ac140004"
//     },
//     {
//       "username": "1ssIU-Pry4bpkeoE9LEC00l4vJRAVH58vK9EUViwA1vqBdR2h4HtiwttpxN5BkKpAAAAAGEIxX16YWhpbmFmc2Fy",
//       "url": "turn:bn-turn1.xirsys.com:3478?transport=tcp",
//       "credential": "fe2578b0-f412-11eb-85b3-0242ac140004"
//     },
//     {
//       "username": "1ssIU-Pry4bpkeoE9LEC00l4vJRAVH58vK9EUViwA1vqBdR2h4HtiwttpxN5BkKpAAAAAGEIxX16YWhpbmFmc2Fy",
//       "url": "turns:bn-turn1.xirsys.com:443?transport=tcp",
//       "credential": "fe2578b0-f412-11eb-85b3-0242ac140004"
//     },
//     {
//       "username": "1ssIU-Pry4bpkeoE9LEC00l4vJRAVH58vK9EUViwA1vqBdR2h4HtiwttpxN5BkKpAAAAAGEIxX16YWhpbmFmc2Fy",
//       "url": "turns:bn-turn1.xirsys.com:5349?transport=tcp",
//       "credential": "fe2578b0-f412-11eb-85b3-0242ac140004"
//     }
//   ],
//   iceCandidatePoolSize: 10,
// };


function App() {
  const webcamVideo = React.useRef()
  const remoteVideo = React.useRef()
  // const ansInput = React.useRef()
  // const callInput = React.useRef()
  const [loader, setLoader] = React.useState(false)
  const [inCall, setInCall] = React.useState(false)
  let localStream = null;
  let remoteStream = null;
  let pc;
  
  React.useEffect(() => {
    getStart()
  }, [])

  async function getStart() {
    const data = await axios.put('https://global.xirsys.net/_turn/MyFirstApp', {},
      {
        headers: {
          Authorization: 'Basic emFoaW5hZnNhcjplN2VkZWYyYS1mNDBiLTExZWItOWZlNC0wMjQyYWMxNTAwMDM='
        }
      });
    const server = data.data.v
    // console.log(server);
    pc = new RTCPeerConnection(server);
    // setLoader(false)
    setupMedia()
  }

  async function setupMedia() {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    remoteStream = new MediaStream();

    // Push tracks from local stream to peer connection
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });
    
    // Pull tracks from remote stream, add to video stream
    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    };
    // console.log(webcamVideo);
    webcamVideo.current.srcObject = localStream;
    webcamVideo.current.muted = true;
    remoteVideo.current.srcObject = remoteStream;
  }
  async function cutCall() {
    location.reload()
  }

  async function createOffer() {
    // Reference Firestore collections for signaling
    await firestore.collection('calls').doc('123456789').delete();
    const callDoc = await firestore.collection('calls').doc('123456789');
    const offerCandidates = callDoc.collection('offerCandidates');
    const answerCandidates = callDoc.collection('answerCandidates');

    // callInput.current.value = callDoc.id;

    // Get candidates for caller, save to db
    pc.onicecandidate = (event) => {
      event.candidate && offerCandidates.add(event.candidate.toJSON());
    };

    // Create offer
    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    await callDoc.set({ offer });

    // Listen for remote answer
    callDoc.onSnapshot((snapshot) => {
      const data = snapshot.data();
      if (!pc.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        pc.setRemoteDescription(answerDescription);
      }
      setInCall(true)
    });

    // When answered, add candidate to peer connection
    answerCandidates.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const candidate = new RTCIceCandidate(change.doc.data());
          pc.addIceCandidate(candidate);
        }
      });
    });
  };

  async function answerCall() {
    setLoader(true)
    // const callId = ansInput.current.value;
    const callId = '123456789';
    const callDoc = firestore.collection('calls').doc(callId);
    const answerCandidates = callDoc.collection('answerCandidates');
    const offerCandidates = callDoc.collection('offerCandidates');

    pc.onicecandidate = (event) => {
      event.candidate && answerCandidates.add(event.candidate.toJSON());
    };

    const callData = (await callDoc.get()).data();

    const offerDescription = callData.offer;
    await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);

    const answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    };

    await callDoc.update({ answer });

    offerCandidates.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        console.log(change);
        if (change.type === 'added') {
          let data = change.doc.data();
          pc.addIceCandidate(new RTCIceCandidate(data));
          setInCall(true)
          setLoader(false)
        }
      });
    });
  };

  return (
    <div>
      {loader?<div id="loader"><p>Connecting.....</p></div>:<></>}
      <div className="videos">
        <span>
          <video ref={webcamVideo} id="myWebCam" autoPlay playsInline></video>
        </span>
        <span>
          <video ref={remoteVideo} autoPlay playsInline></video>
        </span>
      </div>
      {!inCall?<div id="buttons">
        <button onClick={createOffer}>Call</button>
        {/* <input ref={callInput} /> */}
        {/* <input ref={ansInput} /> */}
        <button onClick={answerCall}>Receive</button>
      </div>:
      <div id="buttons">
          <button style={{backgroundColor: 'red'}} onClick={cutCall}>End Call</button>
      </div>}
    </div>
  )
}

export default App
