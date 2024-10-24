import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import RGraph from './RGraph'
import RMap from './RMap';

const App = () => {
    return (
        <Router>
        <Routes>
            <Route path="/" element={<RGraph />} />
            <Route path="/rmap" element={<RMap />} />
        </Routes>
    </Router>
    );
};
export default App;
