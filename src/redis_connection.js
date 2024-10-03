import { createClient } from 'redis';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
const client = createClient({
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});
client.on('error', (err) => console.log('Redis Client Error', err));

(async () => {
    await client.connect();
    console.log('Connected to Redis');
})();

app.get('/data', async (req, res) => {
    try {
        const keys = await client.keys("*random*");
        const jdata = await Promise.all(keys.map((id) => client.get(id)));
        const data = await Promise.all(jdata.map(item => JSON.parse(item)[0]));
        res.json({ data });
    } catch (err) {
        console.error('Error fetching from Redis:', err);
        res.status(500).send('Server error');
    }
});

// Use the PORT environment variable or default to port 3000
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});