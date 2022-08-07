import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import credentials from './credentials';

const app = initializeApp(credentials.firebase);
const auth = getAuth(app);
const db = getDatabase(app);

export {
    app,
    auth,
    db,
};

