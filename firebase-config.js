// firebase-config.js
const firebaseConfig = {
    apiKey: "AIzaSyC7ooiuRSqs2i1wqt4-z85-ZjLUiW7e3Vc",
    authDomain: "plataforma-361fb.firebaseapp.com",
    projectId: "plataforma-361fb",
    storageBucket: "plataforma-361fb.firebasestorage.app",
    messagingSenderId: "1040802202408",
    appId: "1:1040802202408:web:fa1ca3aa4c745064c0861d"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });