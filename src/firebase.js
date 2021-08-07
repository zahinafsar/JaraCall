import firebase from 'firebase/app';
import 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDEuA7U_PNzVq5p-_n2yk4kPjaz327rSrQ",
    authDomain: "jara-computers.firebaseapp.com",
    databaseURL: "https://jara-computers-default-rtdb.firebaseio.com",
    projectId: "jara-computers",
    storageBucket: "jara-computers.appspot.com",
    messagingSenderId: "566352919108",
    appId: "1:566352919108:web:f73fd4eda1c2b8ebba5a11",
    measurementId: "G-3FPFJ0W5JN"
};
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const firestore = firebase.firestore();

export default firestore;