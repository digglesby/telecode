import React from 'react';
import { Switch, Route } from 'react-router-dom';
import Home from './Views/Home.js';
//import Loading from './Views/Loading.js';
//import Room from './Views/Room.js';

module.exports = [
	<Route key="Home" exact path='/' component={Home}/>,
//	<Route key="Loading" path='/loading' component={Loading}/>,
//	<Route key="Room" path='/:roomid' component={Room}/>
];
