import React from 'react'
import { Link } from 'react-router-dom';

class Home extends React.Component {
  render() {
		return (
			<main>
				<h1 className="title">TELECODE</h1>
				<h3 className="sub-title">In browser code colaboration and VOIP... today.</h3>

				<p className='explination'>Developed for the 2017 WVU MISA Hackathon, by <a href='https://www.digglesby.com/'>Curtis Ward</a></p>
				<Link to='/loading'>
					<button className='create'>Create Room</button>
				</Link>

			</main>
		);
  }
}

export default Home;
