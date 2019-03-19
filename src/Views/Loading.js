import React from 'react'
import RTCService from '../RTCService/RTCService.js';
import { Redirect } from 'react-router-dom';

class Loading extends React.Component {
	constructor(){
		super();

		this.state = {
			loadingStatus:"Connecting to routing server...",
			roomID:null
		}

		this.b_loadIntoRoom = this.loadIntoRoom.bind(this);
	}

	componentDidMount() {

		if (RTCService.Open == false){
			RTCService.on("CONNECTION_OPEN",function(){
				this.setState({
					loadingStatus:"Creating room..."
				});

				RTCService.b_createRoom();
			}.bind(this));
		}else{
			this.setState({
				loadingStatus:"Creating room..."
			});

			RTCService.b_createRoom();
		}

		RTCService.on("JOINED_ROOM",function(){
			this.setState({
				loadingStatus:"Joining room..."
			});

			this.setState({
				roomID: RTCService.Room
			});
		}.bind(this));
	}

	loadIntoRoom(roomID){

	}

  render() {
		var redirect = null;

		if (this.state.roomID !== null){
			redirect = <Redirect replace to={"/"+this.state.roomID} />;
		}

		return (
			<main>
				<div className='loading'>
					<i className="fa fa-cog fa-spin fa-3x fa-fw"></i>
					<h2>{this.state.loadingStatus}</h2>
					{redirect}
				</div>
			</main>
		);
  }
}

export default Loading;
