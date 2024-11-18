import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format, set } from 'date-fns';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Link } from 'react-router-dom';
import styles from './RGraph.module.css';




const RGraph = () => {

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
    const [ipAddress, setIPAddress] = useState('')
    const GRAPH_SETTINGS_URI=process.env.REACT_APP_GRAPH_SETTINGS_URI;
    const GRAPH_REDIS_URI=process.env.REACT_APP_GRAPH_REDIS_URI;
    const GRAPH_MONGODB_URI=process.env.REACT_APP_GRAPH_MONGODB_URI;
    useEffect(() => {
        fetch('https://api.ipify.org?format=json')
          .then(response => response.json())
          .then(data => setIPAddress(data.ip))
          .catch(error => console.log(error))
      }, []);

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

        if (xMin == null || xMax == null || yMin == null || yMax == null || numPoints == null || timeMin == null || timeMax == null) {
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

        if (numPointsNum < 2 || numPointsNum > 9) {
            setError('Number of points must be between 2 and 9');
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

            const response = await axios.post(GRAPH_SETTINGS_URI, {
                settings: arr,
                ip: ipAddress
            });
            console.log('Response from backend:', response.data);

            setData([]);
        } catch (error) {
            console.error('Error posting data:', error);
            setError('Error posting data: ' + (error.response?.data || error.message));
        } finally {
            setLoading(false);
            setRuntime(format(new Date(),'dd/MM/yyyy HH:mm:ss'));
            axios.get(GRAPH_REDIS_URI)
                .then((response) => {
                    setData(response.data.data);
                    setDataarr(response.data.jarrdata);
                })
                .catch((error) => {
                    console.error('Error fetching data:', error);
                });
        }
            axios.get(GRAPH_MONGODB_URI)
                .then((response) => {
                    setEntities(response.data.entities);
                })
                .catch((error) => {
                    console.error('Error fetching entities:', error);
                });
    };

    useEffect(() => {
        const fetchEntities = () => {
            axios.get(GRAPH_MONGODB_URI)
                .then((response) => {
                    setEntities(response.data.entities);
                })
                .catch((error) => {
                    console.error('Error fetching entities:', error);
                });
        };

        fetchEntities();
        const intervalId = setInterval(fetchEntities, 2000);

        return () => clearInterval(intervalId);
    },[]);

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
        const entityDateStr = entity["runtime:"].split(" ")[0];
        const entityDate = adjustDateForComparison(parseDate(entityDateStr));
      
        const selectedStartDate = startDate ? adjustDateForComparison(new Date(startDate)) : null;
        const selectedEndDate = endDate ? adjustDateForComparison(new Date(endDate)) : null;
      
        const isAfterStart = !selectedStartDate || entityDate.getTime() >= selectedStartDate.getTime();
        const isBeforeEnd = !selectedEndDate || entityDate.getTime() <= selectedEndDate.getTime();
      
        return isAfterStart && isBeforeEnd;
      });
      
      const Randomizer = () => {
        const rXMin = Math.floor(Math.random() * 91);
        const rXMax = Math.floor(Math.random() * (101 - rXMin - 10)) + rXMin + 10;
        const rYMin = Math.floor(Math.random() * 91);
        const rYMax = Math.floor(Math.random() * (101 - rYMin - 10)) + rYMin + 10;
        const rNumPoints = Math.floor(Math.random() * 7) + 2;
        const rTimeMin = Math.floor(Math.random() * 56) + 5; 
        const rTimeMax = Math.floor(Math.random() * (61 - rTimeMin)) + rTimeMin; 
    
        setXMin(rXMin);
        setXMax(rXMax);
        setYMin(rYMin);
        setYMax(rYMax);
        setNumPoints(rNumPoints);
        setTimeMin(rTimeMin);
        setTimeMax(rTimeMax);
    };
    

      
    return (
        <div className={styles.app_container}>
            <h1>RGraph</h1>
            <h2><nav><Link to="/rmap">RMap</Link></nav></h2>

            <div className={styles.horizontal_container}>
            <div className={`${styles.input_container} ${isLocked ? styles.locked : ''}`}>
            {isLocked && (
                        <div className={styles.locked_message}>
                            Wait to the end of the run
                        </div>
                    )}

                    <h2>Input Values</h2>
                    <form onSubmit={handleSubmit}>
                        <div className={styles.input_group}>
                            <label>X Range</label>
                            <input type="number" placeholder="MIN" value={xMin} onChange={(e) => setXMin(e.target.value)} disabled={isLocked} />
                            <input type="number" placeholder="MAX" value={xMax} onChange={(e) => setXMax(e.target.value)} disabled={isLocked} />
                        </div>
                        <div className={styles.input_group}>
                            <label>Y Range</label>
                            <input type="number" placeholder="MIN" value={yMin} onChange={(e) => setYMin(e.target.value)} disabled={isLocked} />
                            <input type="number" placeholder="MAX" value={yMax} onChange={(e) => setYMax(e.target.value)} disabled={isLocked} />
                        </div>
                        <div className={styles.input_group}>
                            <label>Number of Points</label>
                            <input type="number" value={numPoints} onChange={(e) => setNumPoints(e.target.value)} disabled={isLocked} />
                        </div>
                        <div className={styles.input_group}>
                            <label>Time Range (Seconds)</label>
                            <input type="number" placeholder="MIN" value={timeMin} onChange={(e) => setTimeMin(e.target.value)} disabled={isLocked} />
                            <input type="number" placeholder="MAX" value={timeMax} onChange={(e) => setTimeMax(e.target.value)} disabled={isLocked} />
                        </div>
                        <button type="submit" disabled={isLocked} className={styles.button}>Submit</button>
                        <button type="button" onClick={Randomizer} disabled={isLocked} className={styles.randomizer}>Randomizer</button>
                        {error && <p className={styles.error_message}>{error}</p>}
                    </form>
                </div>
                <div className={styles.scroll_container}>
                <h2>Replay</h2>
                <div className={styles.date_picker_container}>
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
          

            <div className={styles.entity_buttons_container}>
                {filteredEntities.map((entity) => (
                    <button
                        key={entity._id}
                        disabled={isLocked}
                        className={styles.entity_item}
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
                <div className={styles.data_table_container}>
                    <h2>Live Data Table</h2>
                    <h3 className={styles.current_number_points}>{rowCountMessage}</h3>
                    {loading ? (
                        <p>Loading data...</p>
                    ) : (
                        <table className={styles.data_table}>
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

                 <div className={styles.chart_container}>
                    <h2 className={styles.chart_title}>Run Time: {runtime}</h2>
                    <ScatterChart width={700} height={700}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="x" name="X" type="number" domain={[0, 100]} />
                        <YAxis dataKey="y" name="Y" type="number" domain={[0, 100]} />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        <Scatter data={data} fill="#4CAF50" shape={<CustomizedDot />} />
                    </ScatterChart>
                </div>
            </div>
            <div className={styles.horizontal_container_extended_graph}>
            <div className={styles.data_item}>
            <div className={styles.label}>Average</div>
            {datarr.length > 0 && datarr[0] && (
            <div 
                className={styles.value} 
                onClick={() => setData(prevData => [
                    ...prevData,
                    {
                        "x": datarr[0][0].toFixed(3),
                        "y": datarr[0][1].toFixed(3),
                        "seconds": "30"
                    }
                ])}
                          
                style={{ cursor: 'pointer' }} 
            >
                X: {parseFloat(datarr[0][0]).toFixed(3)} <br />
                Y: {parseFloat(datarr[0][1]).toFixed(3)}
                <span className={styles.info_icon} title="Measures the average X and Y values of the points on the graph, representing the average position of all the points"><br />?</span>
            </div>
            )}
        </div>

            <div className={styles.data_item}>
            <div className={styles.label}>Standard Deviation</div>
            {datarr.length > 0 && datarr[1] && (
                <div className={styles.value}>
                    X: {parseFloat(datarr[1][0]).toFixed(3)} <br />
                    Y: {parseFloat(datarr[1][1]).toFixed(3)}
                    <span className={styles.info_icon} title="Measures the spread of points on the graph. It indicates how much the points deviate from the average value, showing the variability or dispersion in the data"><br></br>?</span>
                </div>
                )}
            </div>
            <div className={styles.data_item}>
            <div className={styles.label}>Density</div>
                {datarr.length > 0 && datarr[2] && (
                <div className={styles.value}>
                    {parseFloat(datarr[2]).toFixed(3)}
                    <span className={styles.info_icon} title="Measures how closely packed the points are on the graph. Higher density indicates that more points are concentrated in a specific area, while lower density means they are more spread out"><br></br><br></br>?</span>
                </div>
                )}
            </div>
            <div className={styles.data_item}>
            <div className={styles.label}>Distance</div>
                {datarr.length > 0 && datarr[3] && (
                <div className={styles.value}>
                     Min: {parseFloat(datarr[3][0]).toFixed(3)} <br />
                     Max: {parseFloat(datarr[3][1]).toFixed(3)}
                     <span className={styles.info_icon} title="Measures the spatial separation between points on the graph. It indicates how far apart the points are, with minimum distance representing the closest two points and maximum distance showing the farthest points from each other"><br></br>?</span>
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

export default RGraph;