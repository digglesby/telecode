import React from 'react'
import { Link } from 'react-router-dom';

class Layout extends React.Component {
  render() {
		console.log("RENDERED!");
		
		return (
			<main>
				<header>
					<h2>Layout</h2>
				</header>
				{this.props.children}
			</main>
		);
  }
}

export default Layout;
