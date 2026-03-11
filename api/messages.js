import admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.VITE_FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // Replace \n with actual newlines if configured via Vercel env
                privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined
            })
        });
    } catch (error) {
        console.error('Firebase admin initialization error', error.stack);
    }
}

export default async function handler(req, res) {
    // Basic API Key protection
    const apiKey = req.headers['x-api-key'] || req.query.api_key;
    if (apiKey !== process.env.CRM_API_KEY) {
        return res.status(401).json({ error: 'Unauthorized. Invalid API Key.' });
    }

    if (req.method === 'GET') {
        try {
            const db = admin.firestore();
            const snapshot = await db.collection('messages').orderBy('createdAt', 'desc').get();

            const messages = [];
            snapshot.forEach(doc => {
                messages.push({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate()
                });
            });

            return res.status(200).json({ success: true, count: messages.length, data: messages });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Failed to fetch messages', details: error.message });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
