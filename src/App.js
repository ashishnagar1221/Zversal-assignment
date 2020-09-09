import React from 'react';
import './App.css';
import Tables from './Components/CryptoList';

function App() {
  return (
    <div>
      <div style={{height:'8vh',padding:'15px 50px',backgroundColor:'red',fontSize:'28px'}}>
        Zversal
      </div>
      <Tables/>
    </div>
  );
}

export default App;
