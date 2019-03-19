import React from 'react'
import { Link } from 'react-router-dom';

class VideoHead extends React.Component {
	constructor(){
		super();

		this.state = {
			videoSrc:null,
			videoRunning:false
		}
	}

	componentDidMount(){



		if (this.props.webRTCCall){
			if (this.props.webRTCCall.RemoteStream !== null){
				this.setState({
					videoSrc: window.URL.createObjectURL(this.props.webRTCCall.RemoteStream),
					videoRunning: true,
					mute:false
				});
			}

			this.props.webRTCCall.on("NEW_STREAM",function(){
				if (this.state.videoRunning == false){
					this.setState({
						videoSrc: window.URL.createObjectURL(this.props.webRTCCall.RemoteStream),
						videoRunning: true,
						mute:false
					});
				}
			}.bind(this));
		}else{
			this.setState({
				videoSrc: window.URL.createObjectURL(this.props.src),
				videoRunning: true,
				mute:true
			});
		}
	}

	componentDidUpdate(){

	}

  render() {

		return (
			<div className='video-head'>
				<video src={this.state.videoSrc} autoPlay="true" muted={this.state.mute}>
				</video>
				<p>{this.props.userID}</p>
			</div>
		);
  }
}

export default VideoHead;
