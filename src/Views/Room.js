import React from 'react'
import RTCService from '../RTCService/RTCService.js';
import VideoHead from '../Components/VideoHead.js';
import LiveCodeEditor from '../Components/LiveCodeEditor.js';
import { Link } from 'react-router-dom';

class Room extends React.Component {
	constructor(){
		super();

		this.state = {
			loadingStatus:"Connecting to server...",
			lastStreamUpdate:0,
			localStream:false,
			hostLeft:false
		};
	}

	componentDidMount(){
		if (RTCService.Room != this.props.match.params.roomid){
			if (RTCService.Open == false){

				RTCService.on("CONNECTION_OPEN",function(){
					RTCService.joinRoom(this.props.match.params.roomid);
				}.bind(this));
			}else{

				RTCService.joinRoom(this.props.match.params.roomid);
			}
		}

		RTCService.on("STREAM_UPDATE",function(){
			this.setState({
				lastStreamUpdate: Date.now()
			});
		}.bind(this));

		RTCService.on("LOCAL_STREAM",function(){
			this.setState({
				localStream: true
			});
		}.bind(this));

		RTCService.on("HOST_LEFT",function(){
			this.setState({
				hostLeft: true
			});
		}.bind(this));
	}

  render() {
		if (this.state.hostLeft == false){
			var vids = [];

			if (RTCService.localStream){
				vids.push(<VideoHead src={RTCService.localStream} userID={RTCService.UserID} host={RTCService.Host} key={"ME"} />);
			}

			for (var key in RTCService.calls) {
				var Call = RTCService.calls[key];

				vids.push(<VideoHead webRTCCall={Call} userID={Call.UserID} host={Call.Host} key={Call.UserID + 1} />);
			}

			if (RTCService.Host == false){
				for (var key in RTCService.broadcasts) {
					var Call = RTCService.broadcasts[key];
					console.log(Call.RemoteStream);

					vids.push(<VideoHead webRTCCall={Call} userID={Call.UserID} host={Call.Host} key={Call.UserID + 2} />);
				}
			}

			return (
				<main>
					<LiveCodeEditor url={"https://telecode.digglesby.com/"+RTCService.Room} host={RTCService.Host} webRTCHost={RTCService}/>
					<section className='video-heads'>
						{vids}
					</section>
				</main>
			);
		}else{
			return (
				<main>
					<h1 className="title">THE HOST HAS LEFT!</h1>
					<Link to='/'>
						<button className='create'>Home</button>
					</Link>
				</main>
			);
		}
  }
}

export default Room;
