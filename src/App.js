import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Homepage/Header';
import Body from './components/Homepage/Body';
import Footer from './components/Homepage/Footer';
import Login from './components/Homepage/Login';
import Register from './components/Homepage/Register';
import './index.css';

function App() {
    return (
        <Router>
            <div>
                <Header />
                <Routes>
                    <Route path='/' element={<Body />} />
                    <Route path='/login' element={<Login />} />
                    <Route path='/register' element={<Register />} />
                </Routes>
                <Footer />
            </div>
        </Router>
    );
}

export default App;
