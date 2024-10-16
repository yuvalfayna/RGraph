import React, { useEffect, useState } from 'react';
import './App.css';
import axios from 'axios';
import { format } from 'date-fns';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const App = () => {
    const getCurrentDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };



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
    const [datarr,setDataarr]=useState([]);
    const [startDate, setStartDate] = useState(getCurrentDate());
    const [endDate, setEndDate] = useState(getCurrentDate());
    const [runtime, setRuntime] = useState(''); 
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
            setError('All fields are required. Please fill in all values');
            return;
        }

        if (isNaN(xMinNum) || isNaN(xMaxNum) || isNaN(yMinNum) || isNaN(yMaxNum) ||
            isNaN(numPointsNum) || isNaN(timeMinNum) || isNaN(timeMaxNum)) {
            setError('All inputs must be valid numbers');
            return;
        }

        if (xMinNum < 0 || xMinNum > 90 ||
            xMaxNum < xMinNum + 10 ||
            xMaxNum > 100) {
            setError('Invalid X values. X Min must be between 0 and 90, and X Max must be at least X Min + 10 (up to 100)');
            return;
        }

        if (yMinNum < 0 || yMinNum > 90 ||
            yMaxNum < yMinNum + 10 ||
            yMaxNum > 100) {
            setError('Invalid Y values. Y Min must be between 0 and 90, and Y Max must be at least Y Min + 10 (up to 100)');
            return;
        }

        if (numPointsNum < 2 || numPointsNum > 10) {
            setError('Number of points must be between 2 and 10');
            return;
        }

        if (timeMinNum < 5 || timeMinNum > 60 ||
            timeMaxNum < timeMinNum ||
            timeMaxNum > 60) {
            setError('Time values must be between 5 and 60 seconds, and Max must be greater than Min');
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

            const response = await axios.post('http://16.170.5.43:8080/api/settings', arr);
            console.log('Response from backend:', response.data);

            setData([]);
        } catch (error) {
            console.error('Error posting data:', error);
            setError('Error posting data: ' + (error.response?.data || error.message));
        } finally {
            setLoading(false);
            setRuntime(format(new Date(),'dd/MM/yyyy HH:mm:ss'));
            axios.get('http://16.170.5.43:6379/data')
                .then((response) => {
                    setData(response.data.data);
                    setDataarr(response.data.jarrdata);
                })
                .catch((error) => {
                    console.error('Error fetching data:', error);
                });
        }
            axios.get('http://16.170.5.43:27017/array')
                .then((response) => {
                    setEntities(response.data.entities);
                })
                .catch((error) => {
                    console.error('Error fetching entities:', error);
                });
    };

    useEffect(() => {
        axios.get('http://16.170.5.43:27017/array')
            .then((response) => {
                setEntities(response.data.entities);
            })
            .catch((error) => {
                console.error('Error fetching entities:', error);
            });
    }, []);

    const fetchDataMongo = async (arr) => {
        setLoading(true);
        setError('')
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
const countRows = () => {
    return data.length;
};

const rowCountMessage = `Current Number of Points in The Graph: ${countRows()}`;
    const isLocked = data.length > 0;
    const parseDate = (dateStr) => {
        const [day, month, year] = dateStr.split("/");
        return new Date(year, month - 1, day);
      };
      
      const adjustDateForComparison = (date) => {
        const adjustedDate = new Date(date);
        adjustedDate.setHours(0, 0, 0, 0);
        return adjustedDate;
      };
      
      const filteredEntities = entities.filter((entity) => {
        const entityDateStr = entity["runtime:"].split(" ")[0]; // חילוץ התאריך ממחרוזת ה-runtime
        const entityDate = adjustDateForComparison(parseDate(entityDateStr)); // המרה לאובייקט Date ואיפוס השעות
      
        const selectedStartDate = startDate ? adjustDateForComparison(new Date(startDate)) : null;
        const selectedEndDate = endDate ? adjustDateForComparison(new Date(endDate)) : null;
      
        // כוללים את התאריך ההתחלה והסיום בהשוואה עם >= ו- <=
        const isAfterStart = !selectedStartDate || entityDate.getTime() >= selectedStartDate.getTime();
        const isBeforeEnd = !selectedEndDate || entityDate.getTime() <= selectedEndDate.getTime();
      
        return isAfterStart && isBeforeEnd;
      });
      
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
                            <label>X Range</label>
                            <input type="number" placeholder="MIN" value={xMin} onChange={(e) => setXMin(e.target.value)} disabled={isLocked} />
                            <input type="number" placeholder="MAX" value={xMax} onChange={(e) => setXMax(e.target.value)} disabled={isLocked} />
                        </div>
                        <div className="input-group">
                            <label>Y Range</label>
                            <input type="number" placeholder="MIN" value={yMin} onChange={(e) => setYMin(e.target.value)} disabled={isLocked} />
                            <input type="number" placeholder="MAX" value={yMax} onChange={(e) => setYMax(e.target.value)} disabled={isLocked} />
                        </div>
                        <div className="input-group">
                            <label>Number of Points</label>
                            <input type="number" value={numPoints} onChange={(e) => setNumPoints(e.target.value)} disabled={isLocked} />
                        </div>
                        <div className="input-group">
                            <label>Time Range (Seconds)</label>
                            <input type="number" placeholder="MIN" value={timeMin} onChange={(e) => setTimeMin(e.target.value)} disabled={isLocked} />
                            <input type="number" placeholder="MAX" value={timeMax} onChange={(e) => setTimeMax(e.target.value)} disabled={isLocked} />
                        </div>
                        <button type="submit" disabled={isLocked}>Submit</button>
                        {error && <p className="error-message">{error}</p>}
                    </form>
                </div>
                <div className="scroll-container">
                <h2>Replay</h2>
                <div className="date-picker-container">
                    <div>
                        <label>Start Date:</label>
                        <input
                            type="date"
                            disabled={isLocked}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label>End Date:</label>
                        <input
                            disabled={isLocked}
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                </div>
          

            <div className="entity-buttons-container">
                {filteredEntities.map((entity) => (
                    <button
                        key={entity._id}
                        disabled={isLocked}
                        className="entity-item"
                        onClick={() => {
                            fetchDataMongo(entity["array:"]);
                            setDataarr(JSON.parse(entity["data:"]));
                            setRuntime(entity["runtime:"]);
                            

                        }}
                    >
                        {entity["runtime:"]}
                    </button>
                ))}
            </div>
            </div>
                <div className="data-table-container">
                    <h2>Live Data Table</h2>
                    <h3 className="current_number_points">{rowCountMessage}</h3>
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
                    <h2 className="chart-title">Run Time: {runtime}</h2>
                    <ScatterChart width={450} height={450}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="x" name="X" type="number" domain={[0, 100]} />
                        <YAxis dataKey="y" name="Y" type="number" domain={[0, 100]} />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        <Scatter data={data} fill="#4CAF50" shape={<CustomizedDot />} />
                    </ScatterChart>
                </div>
            </div>
            <div className="horizontal-container-extended">
            <div className="data-item">
                <div className="label"><span className="info-icon" title="Measures tge average X and Y values of the points on the graph, representing the average position of all the points">?</span>Average</div>
                {datarr.length > 0 && datarr[0] && (
                <div className="value">
                    X: {parseFloat(datarr[0][0]).toFixed(3)} <br />
                    Y: {parseFloat(datarr[0][1]).toFixed(3)}
                </div>
            )}
            </div>
            <div className="data-item">
            <div className="label"><span className="info-icon" title="Measures the spread of points on the graph. It indicates how much the points deviate from the average value, showing the variability or dispersion in the data">?</span>Standard Deviation</div>
            {datarr.length > 0 && datarr[1] && (
                <div className="value">
                    X: {parseFloat(datarr[1][0]).toFixed(3)} <br />
                    Y: {parseFloat(datarr[1][1]).toFixed(3)}
                </div>
                )}
            </div>
            <div className="data-item">
            <div className="label"><span className="info-icon" title="Measures how closely packed the points are on the graph. Higher density indicates that more points are concentrated in a specific area, while lower density means they are more spread out">?</span>Density</div>
                {datarr.length > 0 && datarr[2] && (
                <div className="value">
                    {parseFloat(datarr[2]).toFixed(3)}
                </div>
                )}
            </div>
            <div className="data-item">
            <div className="label"><span className="info-icon" title="Measures the spatial separation between points on the graph. It indicates how far apart the points are, with minimum distance representing the closest two points and maximum distance showing the farthest points from each other">?</span>Distance</div>
                {datarr.length > 0 && datarr[3] && (
                <div className="value">
                    Min: {parseFloat(datarr[3][0]).toFixed(3)} <br />
                    Max: {parseFloat(datarr[3][1]).toFixed(3)}
                </div>
            )}
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
