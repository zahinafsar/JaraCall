import firebase from 'firebase/app';
import 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC2pE7A_rj6RCVdlVLc6ZmJUjf7vWzmFkQ",
  authDomain: "jara-call.firebaseapp.com",
  projectId: "jara-call",
  storageBucket: "jara-call.appspot.com",
  messagingSenderId: "286545812056",
  appId: "1:286545812056:web:b29c631c2b2ce509e7882d",
  measurementId: "G-NST1MK4HVY"
};
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const firestore = firebase.firestore();

export default firestore;