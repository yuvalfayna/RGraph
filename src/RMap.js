// דף הגרף שבו הלקוח יכול להגדיר נתונים לצורך מופע של גרף

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import 'leaflet/dist/leaflet.css';
import MapComponent from './MapComponent';
import { Link } from 'react-router-dom';
import styles from './RMap.module.css';


const RMap = () => {

    const getCurrentDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };


    const [LatMin, setLatMin] = useState('');
    const [LatMax, setLatMax] = useState('');
    const [LngMin, setLngMin] = useState('');
    const [LngMax, setLngMax] = useState('');
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
    const [ipAddress, setIPAddress] = useState('');
    const [check, setCheck] = useState(false);
    const [check1, setCheck1] = useState(true);
    const [emptyarchive, setEmptyArchive] = useState(""); 
    

    const MAP_SETTINGS_URI=process.env.REACT_APP_MAP_SETTINGS_URI;
    const MAP_REDIS_URI=process.env.REACT_APP_MAP_REDIS_URI;
    const MAP_MONGODB_URI=process.env.REACT_APP_MAP_MONGODB_URI;

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
                    if(data.length===0&&check&&check1){
                        axios.post(MAP_MONGODB_URI)
                        .then(function (response){
                            let entities=response.data;
                            setEntities(entities);
                            setCheck1(false);
                            setTimeout(() => {
                                setCheck(false);
                                setCheck1(true);
                            },30000);
                        })
                        .catch(function (error){
                            console.log(error);
                            setError(error);
                });
                    }
        }, 1000);      
        return () => clearInterval(intervalId);
    });
    const handleSubmit = (e) => {
        e.preventDefault();

        const LatMinNum = parseFloat(LatMin);
        const LatMaxNum = parseFloat(LatMax);
        const LngMinNum = parseFloat(LngMin);
        const LngMaxNum = parseFloat(LngMax);
        const numPointsNum = parseInt(numPoints);
        const timeMinNum = parseInt(timeMin);
        const timeMaxNum = parseInt(timeMax);
        if (LatMin == null || LatMax == null || LngMin == null || LngMax == null || numPoints == null || timeMin == null || timeMax == null) {
            setError('All fields are required. Please fill in all values');
            return;
        }
        if (isNaN(LatMinNum) || isNaN(LatMaxNum) || isNaN(LngMinNum) || isNaN(LngMaxNum) ||
            isNaN(numPointsNum) || isNaN(timeMinNum) || isNaN(timeMaxNum)) {
            setError('All inputs must be valid numbers');
            return;
        }
        if (LatMinNum< -85.05112878 || LatMaxNum>85.05112878 ||LatMin>LatMax ) {
            setError(LatMin+LatMax+'Invalid Latitude values. Latitude values must be between -85.05112878 to 85.05112878 degrees');
            return;
        }

        if (LngMinNum< -180 || LngMaxNum>180 ||LngMinNum>LngMaxNum||LngMaxNum<LngMinNum) {
            setError('Invalid Longitude values. Longitude values must be between -180 to 180 degrees');
            return;
        }

        if (numPointsNum < 3 || numPointsNum > 9) {
            setError('Number of points must be between 3 and 9');
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
                parseFloat(LatMin),
                parseFloat(LatMax),
                parseFloat(LngMin),
                parseFloat(LngMax),
                parseInt(numPoints),
                parseInt(timeMin),
                parseInt(timeMax),
            ];

            const response = await axios.post(MAP_SETTINGS_URI, {
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
            await axios.post(MAP_REDIS_URI,{ip:ipAddress})
            .then(function (response){
            let points =  JSON.parse(response.data[0]);
            let data =  JSON.parse(response.data[1]);
            setData(points);
            setDataarr(data);
            setCheck(true);
            if(!check1){
                setCheck1(true);
            }
            }).catch(function (error){
                console.log(error);
                setError(error);
            });
        }
    };

    useEffect(() => {
        const fetchEntities = () => {
            if(!check){
                axios.post(MAP_MONGODB_URI)
                .then(function (response){
                    let entities=response.data;
                    setEntities(entities);
                }).catch(function (error){
                    console.log(error);
                    setError(error);
                });
            }
        };
        fetchEntities();
        const intervalId = setInterval(fetchEntities, 30000);

        return () => clearInterval(intervalId);
    },[check]);

    const fetchDataMongo = async (arr) => {
        setLoading(true);
        setError('')
        const parsedArray = JSON.parse(arr);
        const data = parsedArray.map(item => ({
            lat: item[0],
            lng: item[1],
            seconds: item[2]
        }
        
    ))
    setLoading(false);
    setData(data);
};
const countRows = () => {
    return data.length;
};
const Randomizer = () => {
    const rLatMin = Math.random() * 170.10225756 - 85.05112878;
    const rLatMax = Math.random() * (85.05112878 - rLatMin) + rLatMin;
    const rLngMin = Math.random() * 360 - 180;
    const rLngMax = Math.random() * (180 - rLngMin) + rLngMin;
    const rNumPoints = Math.floor(Math.random() * 7) + 3;
    const rTimeMin = Math.floor(Math.random() * 56) + 5; 
    const rTimeMax = Math.floor(Math.random() * (61 - rTimeMin)) + rTimeMin; 

    setLatMin(rLatMin);
    setLatMax(rLatMax);
    setLngMin(rLngMin);
    setLngMax(rLngMax);
    setNumPoints(rNumPoints);
    setTimeMin(rTimeMin);
    setTimeMax(rTimeMax);
};


const rowCountMessage = `Current Number of Points in The Map: ${countRows()}`;
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
            const CheckEmptyArchive = (arr)=> {
              if(entities.length>0){
              if(arr.length===0){
                setEmptyArchive("No data in the selected time period");
            }else{
                setEmptyArchive("");
            }
          }
          }
      
          useEffect(() => {
              CheckEmptyArchive(filteredEntities);
            }, [filteredEntities]);
      
      return (
        <div className={styles.app_container}>
            <h1>RMap</h1>
            <h2><nav><Link to="/">RGraph</Link></nav></h2>

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
                            <label>Latitude Range</label>
                            <input type="number" placeholder="MIN" value={LatMin} onChange={(e) => setLatMin(e.target.value)} disabled={isLocked} />
                            <input type="number" placeholder="MAX" value={LatMax} onChange={(e) => setLatMax(e.target.value)} disabled={isLocked} />
                        </div>
                        <div className={styles.input_group}>
                            <label>Longitude Range</label>
                            <input type="number" placeholder="MIN" value={LngMin} onChange={(e) => setLngMin(e.target.value)} disabled={isLocked} />
                            <input type="number" placeholder="MAX" value={LngMax} onChange={(e) => setLngMax(e.target.value)} disabled={isLocked} />
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
                        <button type="button" onClick={Randomizer} disabled={isLocked} className={styles.randomizer}>Randomizer</button>                        {error && <p className={styles.error_message}>{error}</p>}
                    </form>
                </div>
                
                <div className={styles.scroll_container}>
                    <h2>Archive (MONGO)</h2>
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
                    <p>{emptyarchive}</p>
                {filteredEntities.map((entity) => (
                    <button
                        key={entity._id}
                        disabled={isLocked}
                        className={styles.entity_item}
                        onClick={() => {
                            console.log(entities);
                            fetchDataMongo(entity["map:"]);
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
                    <h2>Live Data Table (REDIS)</h2>
                    <h3 className={styles.current_number_points}>{rowCountMessage}</h3>
                    {loading ? (
                        <p>Loading data...</p>
                    ) : (
                        <table className={styles.data_table}>
                            <thead>
                                <tr>
                                    <th>Latitude</th>
                                    <th>Longitude</th>
                                    <th>Seconds</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.lat.toFixed(3)}</td>
                                        <td>{item.lng.toFixed(3)}</td>
                                        <td>{item.seconds}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className={styles.map_container}>
                    <h2 className={styles.map_title}>Run Time: {runtime}</h2>
                    <MapComponent points={data} />
                    </div>
                  </div>
            
            <div className={styles.horizontal_container_extended_map}>
            <div className={styles.data_item}>
    <div className={styles.label}>Centroid</div>
                {datarr.length > 0 && datarr[0] && (
                    <div 
                        className={styles.value}
                        onClick={() => setData(prevData => [
                            ...prevData,
                            {
                                "lat": datarr[0][0],
                                "lng": datarr[0][1],
                                "seconds": "30"
                            }
                        ])}
                                  
                        style={{ cursor: 'pointer' }} 
                    >
                        Latitude: {parseFloat(datarr[0][0]).toFixed(3)} <br />
                        Longitude: {parseFloat(datarr[0][1]).toFixed(3)}
                        <span className={styles.info_icon} title="The central point among all the coordinates, like the average position of all the points"><br></br>?</span>
                    </div>
                )}
            </div>

                <div className={styles.data_item}>
                    <div className={styles.label}> Area
                    </div>
                    {datarr.length > 0 && datarr[1] && (
                        <div className={styles.value}>
                            km<sup>2</sup>: {parseFloat(datarr[1][0]).toFixed(3)} <br />
                            <span className={styles.info_icon} title="calculates the area of a polygon from geographical coordinates using the shoelace formula."><br></br>?</span>
                        </div>
                    )}
                </div>
                <div className={styles.data_item}>
                    <div className={styles.label}>
                        
                        Distance
                    </div>
                    {datarr.length > 0 && datarr[2] && (
                        <div className={styles.value}>
                            Min: {parseFloat(datarr[2][0]).toFixed(3)} <br />
                            Max: {parseFloat(datarr[2][1]).toFixed(3)}
                            <span className={styles.info_icon} title="Measures the spatial separation between points on the map. It indicates how far apart the points are, with minimum distance representing the closest two points and maximum distance showing the farthest points from each other"><br></br>?</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RMap;