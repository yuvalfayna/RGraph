import React, { useEffect, useState } from 'react';
import './App.css';
import axios from 'axios';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const App = () => {


    const [xMin, setXMin] = useState('');
    const [xMax, setXMax] = useState('');
    const [yMin, setYMin] = useState('');
    const [yMax, setYMax] = useState('');
    const [numPoints, setNumPoints] = useState('');
    const [timeMin, setTimeMin] = useState('');
    const [timeMax, setTimeMax] = useState('');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [entities, setEntities] = useState([]);




    useEffect(() => {
        const intervalId = setInterval(() => {
            setData(prevData =>
                prevData
                    .map(item => ({ ...item, seconds: item.seconds - 1 }))
                    .filter(item => item.seconds > 0)
                    .sort((a, b) => b.seconds - a.seconds));
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();

        const xMinNum = parseInt(xMin);
        const xMaxNum = parseInt(xMax);
        const yMinNum = parseInt(yMin);
        const yMaxNum = parseInt(yMax);
        const numPointsNum = parseInt(numPoints);
        const timeMinNum = parseInt(timeMin);
        const timeMaxNum = parseInt(timeMax);

        if (!xMin || !xMax || !yMin || !yMax || !numPoints || !timeMin || !timeMax) {
            setError('All fields are required. Please fill in all values.');
            return;
        }

        if (isNaN(xMinNum) || isNaN(xMaxNum) || isNaN(yMinNum) || isNaN(yMaxNum) ||
            isNaN(numPointsNum) || isNaN(timeMinNum) || isNaN(timeMaxNum)) {
            setError('All inputs must be valid numbers.');
            return;
        }

        if (xMinNum < 0 || xMinNum > 90 ||
            xMaxNum < xMinNum + 10 ||
            xMaxNum > 100) {
            setError('Invalid X values. X Min must be between 0 and 90, and X Max must be at least X Min + 10 (up to 100).');
            return;
        }

        if (yMinNum < 0 || yMinNum > 90 ||
            yMaxNum < yMinNum + 10 ||
            yMaxNum > 100) {
            setError('Invalid Y values. Y Min must be between 0 and 90, and Y Max must be at least Y Min + 10 (up to 100).');
            return;
        }

        if (numPointsNum < 2 || numPointsNum > 10) {
            setError('Number of points must be between 2 and 10.');
            return;
        }

        if (timeMinNum < 5 || timeMinNum > 60 ||
            timeMaxNum < timeMinNum ||
            timeMaxNum > 60) {
            setError('Time values must be between 5 and 60 seconds, and Max must be greater than Min.');
            return;
        }

        setError('');
        fetchData();
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const arr = [
                parseInt(xMin),
                parseInt(xMax),
                parseInt(yMin),
                parseInt(yMax),
                parseInt(numPoints),
                parseInt(timeMin),
                parseInt(timeMax),
            ];

            const response = await axios.post('https://rgraphbackend.onrender.com/api/settings', arr);
            console.log('Response from backend:', response.data);

            setData([]); // Clear the current data on successful response
        } catch (error) {
            console.error('Error posting data:', error);
            setError('Error posting data: ' + (error.response?.data || error.message));
        } finally {
            setLoading(false);
            axios.get('https://dbconnectins.onrender.com/data')
                .then((response) => {
                    setData(response.data.data);
                })
                .catch((error) => {
                    console.error('Error fetching data:', error);
                });
        }
            axios.get('https://dbconnectins.onrender.com/array')
                .then((response) => {
                    setEntities(response.data.entities);
                })
                .catch((error) => {
                    console.error('Error fetching entities:', error);
                });
        
    };

    useEffect(() => {
        axios.get('https://dbconnectins.onrender.com/array')
            .then((response) => {
                setEntities(response.data.entities);
            })
            .catch((error) => {
                console.error('Error fetching entities:', error);
            });
    }, []);

    const fetchDataMongo = async (arr) => {
        setLoading(true);
        const parsedArray = JSON.parse(arr);
        const data = parsedArray.map(item => ({
            x: item[0],
            y: item[1],
            seconds: item[2]
        }
    ))
    setLoading(false);
    setData(data);
    
};
    

    const isLocked = data.length > 0;

    return (
        <div className="app-container">
            <h1>RGraph</h1>

            <div className="horizontal-container">
                <div className={`input-container ${isLocked ? 'locked' : ''}`}>
                    {isLocked && (
                        <div className="locked-message">
                            Wait to the end of the run
                        </div>
                    )}

                    <h2>Input Values</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label>X Range:</label>
                            <input type="number" placeholder="MIN" value={xMin} onChange={(e) => setXMin(e.target.value)} disabled={isLocked} />
                            <input type="number" placeholder="MAX" value={xMax} onChange={(e) => setXMax(e.target.value)} disabled={isLocked} />
                        </div>
                        <div className="input-group">
                            <label>Y Range:</label>
                            <input type="number" placeholder="MIN" value={yMin} onChange={(e) => setYMin(e.target.value)} disabled={isLocked} />
                            <input type="number" placeholder="MAX" value={yMax} onChange={(e) => setYMax(e.target.value)} disabled={isLocked} />
                        </div>
                        <div className="input-group">
                            <label>Number of Points:</label>
                            <input type="number" value={numPoints} onChange={(e) => setNumPoints(e.target.value)} disabled={isLocked} />
                        </div>
                        <div className="input-group">
                            <label>Time Range (seconds):</label>
                            <input type="number" placeholder="MIN" value={timeMin} onChange={(e) => setTimeMin(e.target.value)} disabled={isLocked} />
                            <input type="number" placeholder="MAX" value={timeMax} onChange={(e) => setTimeMax(e.target.value)} disabled={isLocked} />
                        </div>
                        <button type="submit" disabled={isLocked}>Submit</button>
                        {error && <p className="error-message">{error}</p>}
                    </form>
                </div>
                <div className="scroll-container">
        <h2>Replay</h2>
            {entities
                .slice()
                .sort((a, b) => {
                    const dateA = new Date(a["runtime:"].split('-').reverse().join('-'));
                    const dateB = new Date(b["runtime:"].split('-').reverse().join('-'));
                    return dateB - dateA;
                })
                .map((entity) => (
                    <button
                        key={entity._id}
                        className="entity-item"
                        onClick={() => {fetchDataMongo(entity["array:"])}}
                    >
                        {entity["runtime:"]}
                    </button>
                ))}
        </div>




                <div className="data-table-container">
                    <h2>Live Data Table</h2>
                    {loading ? (
                        <p>Loading data...</p>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>X</th>
                                    <th>Y</th>
                                    <th>Seconds</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.x}</td>
                                        <td>{item.y}</td>
                                        <td>{item.seconds}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="chart-container">
                    <ScatterChart width={450} height={450}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="x" name="X" type="number" domain={[0, 100]} />
                        <YAxis dataKey="y" name="Y" type="number" domain={[0, 100]} />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        <Scatter data={data} fill="#4CAF50" shape={<CustomizedDot />} />
                    </ScatterChart>
                </div>
            </div>
        </div>
    );
};

const CustomizedDot = (props) => {
    const { cx, cy } = props;
    return (
        <circle cx={cx} cy={cy} r={6} fill="#2196F3" stroke="#FFF" strokeWidth={2} />
    );
};

export default App;
