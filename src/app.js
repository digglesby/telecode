import React from 'react';
import { Switch, Route } from 'react-router-dom';
import Routes from './Routes.js';

class App extends React.Component {
  
  render() {
		return (
			<Switch>
				{Routes}
			</Switch>
		);
  }
}

export default App;
