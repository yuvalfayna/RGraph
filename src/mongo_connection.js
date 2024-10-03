import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const uri = "mongodb+srv://yovalfayna98:lPpAMaj1wiYxSIoH@mdb.t9lvb.mongodb.net/RGraph?retryWrites=true&w=majority&appName=MDB";

const clientOptions = {
  serverApi: { version: '1', strict: true, deprecationErrors: true }
};

async function run() {
  try {
    await mongoose.connect(uri, clientOptions);
    console.log("Connected to MongoDB via Mongoose!");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
  }
}
run();

const entitySchema = new mongoose.Schema({
  runtime: String,
  array: String
});
const Entity = mongoose.model('arrays', entitySchema);


app.get('/array', async (req, res) => {
  try {
    const entities = await Entity.find(); 
    res.json({ entities }); 
  } catch (error) {
    console.error('Error fetching entities:', error);
    res.status(500).json({ message: 'Error fetching entities', error });
  }
});

const port = 5001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
