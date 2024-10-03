import { createClient } from 'redis';
import express from 'express';
import cors from 'cors';

// Create the Express app
const app = express();
app.use(cors());
app.use(express.json());

const client = createClient({
    password: 'p7LS233UJKNl8F4eCSrb8OSWnluC9MLB',
    socket: {
        host: 'redis-19666.c16.us-east-1-3.ec2.redns.redis-cloud.com',
        port: 19666
    }
});
client.on('error', (err) => console.log('Redis Client Error', err));

(async () => {
    await client.connect();
    console.log('Connected to Redis');
})();

app.get('/data', async (req, res) => {
    try {
        const keys= await client.keys("*random*");
        const jdata=await Promise.all(keys.map((id)=>client.get(id)));
        const data= await Promise.all(jdata.map(item => JSON.parse(item)[0]));
        res.json({ data })
        } catch (err) {
        console.error('Error fetching from Redis:', err);
        res.status(500).send('Server error');
    }
});
const port = 5000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

