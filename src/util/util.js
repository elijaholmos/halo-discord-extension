import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import credentials from './credentials';

const app = initializeApp(credentials.firebase);
const auth = getAuth(app);
const db = getFirestore(app);

export {
    app,
    auth,
    db,
};

