import React, { Component } from 'react'
import io from 'socket.io-client'

const socket = io('https://coincap.io', {autoConnect: false});
const webSocket = new WebSocket('wss://ws.coincap.io/trades/binance');


var checker;

class Tables extends Component {
    constructor(props){
        super(props)
    this.state = {
    isLoaded: false,
    error: '',
    cryptos : [],
    cryptoToken : {},
    cryptoNameToken : {},
    mshow: false,
    isVisible: true,
    dropdownOpen: false,
    currentPage: 1,
    itemPerPage: 10
    }    
 }

 changeSize(e) {
   let value = e.target.value
   this.setState({
     itemPerPage:value
   })

 }
 componentDidMount(){
    fetch('https://api.coincap.io/v2/assets?limit=2000')
    .then(res => {return res.json()})
    .then(result => {
        console.log(result)
        let cryptoToken = {}
        let cryptoNameToken = {}
        let nameKey = ""
        let cryptos = result.data.map((coin,i) =>{
            cryptoToken[coin.symbol] = i
            nameKey = coin.name.toLowerCase().split(' ').join('-');
            cryptoNameToken[nameKey] = i
            return coin
        })

        this.setState({
            isLoaded:true,
            cryptoToken,
            cryptoNameToken,
            cryptos
        })

        console.log('opening socket...');
        socket.open();

        console.log('listening socket...');
        socket.on('trades', stream => {
            var symbol = stream.coin;
            var index = cryptoToken[symbol];
            if(typeof cryptos[index] !== 'undefined' && cryptos[index].hasOwnProperty('priceUsd')){
              cryptos[index]['priceUsd'] = stream.msg.price;
              cryptos[index]['marketCapUsd'] = stream.msg.mktcap;
              cryptos[index]['vwap24Hr'] = stream.msg.vwapData;
              cryptos[index]['supply'] = stream.msg.supply;
              var perc_bef = parseFloat(cryptos[index]['changePercent24Hr']);
              var perc_now = parseFloat(stream.msg.cap24hrChange);
              cryptos[index]['changePercent24Hr'] = isNaN(perc_now) ? cryptos[index]['changePercent24Hr'] : perc_now;
            }
         });

         webSocket.onmessage = function (msg) {
            let wsData = JSON.parse(msg.data);
            let nameKey = wsData.base;
            let price = parseFloat(wsData.priceUsd);
            if(cryptoNameToken.hasOwnProperty(nameKey) && price > 0){
              let index = cryptoNameToken[nameKey];
              let price_bef = parseFloat(cryptos[index].priceUsd);
              let price_now = price;
              cryptos[index].priceUsd = price;
            }
          }

          checker = setInterval(() => {
            this.setState({cryptos});
            this.undoBlink();
          }, 1000);
    },
    error =>{
        console.log('coincap fetch error',error)
    }
    )}

    componentWillUnmount(){
        socket.close();
        webSocket.close();
        clearInterval(checker);
        console.log('closing socket...');
      }
      

    undoBlink = () => {
        var cryptos = this.state.cryptos.map(coin => {
          coin['blink'] = 'none';
          return coin;
        });
        setTimeout(() => {
          this.setState({cryptos});
        },1000);
      }
    
 render() {
   const {currentPage, itemPerPage } = this.state

   const indexOfLastItem = currentPage * itemPerPage
   const indexOfFirstItem = indexOfLastItem - itemPerPage
   const currentList = this.state.cryptos.slice(indexOfFirstItem,indexOfLastItem)
  return(
   <div>
       <table>
           <thead>
               <th>rank</th> 
               <th>Name</th>
               <th>priceUsd</th>
               <th>marketCapUsd</th>
               <th>vwap24Hr</th>
               <th>supply</th>
               <th>volumeUsd24Hr</th>
               <th>changePercent24Hr</th>            
           </thead>

               {
                   currentList.map(ele =>{
                       return(
                        <tbody>
                        <td>{ele.rank}</td> 
                        <td>{ele.name}</td>
                        <td>{ele.priceUsd}</td>
                        <td>{ele.marketCapUsd}</td>
                        <td>{ele.vwap24Hr}</td>
                        <td>{ele.supply}</td>
                        <td>{ele.volumeUsd24Hr}</td>
                        <td>{ele.changePercent24Hr}</td>   
                        </tbody>
                       )
                   })
               }
       </table>
          <select ref = 'size' onChange =  {(e) => this.changeSize(e) }>
               <option selected value = "10"> 10</option>
               <option value = "20">20</option>
               <option value = "50">50</option>
               <option value = "100">100</option>
          </select>
   </div>
    )
   }
 }

export default Tables