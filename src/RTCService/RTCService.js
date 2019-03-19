var service = null;

if (typeof window != 'undefined'){

const EventEmitter = require('events');
const peerConnectionConfig = {'iceServers': [{'url': 'stun:stun.services.mozilla.com'}, {'url': 'stun:stun.l.google.com:19302'}]};
const URI = 'ws://localhost:3000/';

class WebRTCCall extends EventEmitter{

	constructor(){
		super();

		this.localRTCPeerConnection = new RTCPeerConnection(peerConnectionConfig);

		this.Host = false;
		this.UserID = null;
		this.Room = null;
		this.Stream = null;
		this.RemoteStream = null;
		this.Identifier = null;
		this.DataChannel = null;
		this.sendSignalMessage = null;

		this.getCode = null;
		this.setCode = null;

		this.b_answerError = this.answerError.bind(this);
		this.b_offerError = this.offerError.bind(this);
		this.b_gotDescription = this.gotDescription.bind(this);
		this.b_gotIceCandidate = this.gotIceCandidate.bind(this);
		this.b_gotRemoteStream = this.gotRemoteStream.bind(this);
		this.b_addStream = this.addStream.bind(this);
		this.b_setRemoteDescription = this.setRemoteDescription.bind(this);
		this.b_addIceCandidate = this.addIceCandidate.bind(this);
		this.b_startPeerConnection = this.startPeerConnection.bind(this);
		this.b_dataChannelOpen = this.dataChannelOpen.bind(this);
		this.b_dataChannelError = this.dataChannelError.bind(this);
		this.b_gotDataMessage = this.gotDataMessage.bind(this);
		this.b_gotDataChannel = this.gotDataChannel.bind(this);
	}

	startPeerConnection(){
		this.localRTCPeerConnection.onicecandidate = this.b_gotIceCandidate;
		this.localRTCPeerConnection.onaddstream = this.b_gotRemoteStream;

		if (this.Host == false){
			if (this.identifier == null){
				this.localRTCPeerConnection.ondatachannel = this.b_gotDataChannel;
			}

		}else{
			if (this.identifier == null){

				console.log("ATTEMPTED TO OPEN DATA CHANNEL");
				this.DataChannel = this.localRTCPeerConnection.createDataChannel("data2", null );

				this.DataChannel.onmessage = this.b_gotDataMessage;
				this.DataChannel.onopen = this.b_dataChannelOpen;
				this.DataChannel.onerror = this.b_dataChannelError;
			}

			this.localRTCPeerConnection.createOffer(this.b_gotDescription, this.b_offerError);
		}
	}

	addStream(stream){
		this.Stream = stream;

		if (stream != null){
			console.log("STREAM ADDED!");
			this.localRTCPeerConnection.addStream(stream);
		}
	}

	answerError(err){
		this.emit("RTC_ANSWER_ERROR");
		console.error(err);
	}

	offerError(err){
		this.emit("RTC_OFFER_ERROR");
		console.error(err);
	}

	gotDataChannel(e){
		this.DataChannel = e.channel;
		this.DataChannel.onmessage = this.b_gotDataMessage;
		this.DataChannel.onerror = this.b_dataChannelError;
		this.b_dataChannelOpen();
	}

	gotRemoteStream(event){
		this.RemoteStream = event.stream;
		console.log("===== REMOTE STREAM FROM "+this.UserID);

		this.emit("NEW_STREAM");
	}

	gotDataMessage(event){
		var data = JSON.parse(event.data);

		switch (data.type){
			case 'get_code':

				this.DataChannel.send(JSON.stringify({
					type:"code_update",
					code:this.getCode()
				}));

				break;
			case 'code_update':

				console.log(data.code);
				this.setCode(data.code,(!this.Host),this.UserID);

				break;
		}
	}

	dataChannelOpen(){
		console.log("DATA OPENED");

		if (!this.Host){
			this.DataChannel.send(JSON.stringify({
				type:"code_update",
				code:this.getCode()
			}));
		}
	}

	dataChannelError(e){
		console.error(e);
	}

	gotIceCandidate(event){

		if (!event || !event.candidate){
			this.emit("ICE_CONNECTION_FAILURE");
			return;
		}

		if (this.Host){
			this.sendSignalMessage("SEND_HOST",{
				'message': {
					'type': 'ICE_CANDIDATE',
					'ice': event.candidate,
					'identifier': this.Identifier
				}
			});
		}else{
			this.sendSignalMessage("SEND_USER",{
				'receiver': this.UserID,
				'message': {
					'type': 'ICE_CANDIDATE',
					'ice': event.candidate,
					'identifier': this.Identifier
				}
			});
		}


		this.emit("ICE_CANDIDATE");

	}

	gotDescription(description){
		this.emit("GOT_DESCRIPTION");

		this.localRTCPeerConnection.setLocalDescription(description, function () {

			if (this.Host){
				this.sendSignalMessage("SEND_HOST",{
					'message': {
						'type': 'DESCRIPTION_SET',
						'sdp': description,
						'identifier': this.Identifier
					}
				});
			}else{
				this.sendSignalMessage("SEND_USER",{
					'receiver':this.UserID,
					'message': {
						'type': 'DESCRIPTION_SET',
						'sdp': description,
						'identifier': this.Identifier
					}
				});
			}

    }.bind(this),
		function(e) {
			console.error(e)
		});
	}

	addIceCandidate(iceCandidate){

		this.localRTCPeerConnection.addIceCandidate(iceCandidate,function(){
			console.log("ADDED ICE!");
		}.bind(this),function(err){
			console.error(err);
		}.bind(this));

	}

	setRemoteDescription(rtcDescription,sdp){

		this.localRTCPeerConnection.setRemoteDescription(rtcDescription, function() {
			console.log("ADDED REMOTE DESCRIPTION!");
			if (sdp.type == 'offer') {

				console.log("OFFER");
				this.localRTCPeerConnection.createAnswer(this.b_gotDescription, this.b_answerError);
			}
		}.bind(this),function(err){
			console.error(err);
		}.bind(this));
	}
}

class RTCService extends EventEmitter{

	constructor(){
		super();

		this.Open = false;
		this.Host = false;
		this.UserID = null;
		this.Room = null;
		this.Code = "";
		this.ws = new WebSocket(URI);

		this.b_onOpen = this.onOpen.bind(this);
		this.b_handleMessage = this.handleMessage.bind(this);
		this.b_sendMessage = this.sendMessage.bind(this);
		this.b_createRoom = this.createRoom.bind(this);
		this.b_joinRoom = this.joinRoom.bind(this);
		this.b_startStreaming = this.startStreaming.bind(this);
		this.b_startCall = this.startCall.bind(this);
		this.b_parseClientMessage = this.parseClientMessage.bind(this);
		this.b_broadcastConnection = this.broadcastConnection.bind(this);
		this.b_broadcastOpen = this.broadcastOpen.bind(this);
		this.b_removeUser = this.removeUser.bind(this);
		this.b_leaveRoom = this.leaveRoom.bind(this);
		this.b_setCode = this.setCode.bind(this);
		this.b_getCode = this.getCode.bind(this);

		this.ws.addEventListener('open',this.b_onOpen);
		this.ws.addEventListener('message',this.b_handleMessage);

		this.localRTCPeerConnection = null;
		this.calls = {};
		this.broadcasts = {};
		this.localStream = null;
	}

	getCode(){
		return this.Code;
	}

	setCode(newCode,update = false,sender = null){
		this.Code = newCode;

		this.emit("CODE_CHANGE");

		if (update == true){
			if (this.Host){
				for (var key in this.calls) {
					if (key != sender){

						this.calls[key].DataChannel.send(JSON.stringify({
							type:"code_update",
							code:newCode
						}));

					}
				}
			}else{
				for (var key in this.calls) {

					this.calls[key].DataChannel.send(JSON.stringify({
						type:"code_update",
						code:newCode
					}));

				}

			}
		}
	}

	onOpen(){
		this.Open = true;
		this.emit("CONNECTION_OPEN");
	}

	sendMessage(type,data = {}){
		if (this.Open){
			data['type'] = type;
			if (!data.hasOwnProperty('roomid')){
				data['roomid'] = this.Room;
			}


			this.ws.send(JSON.stringify(data));
		}
	}

	broadcastOpen(userid,stream,identifier){

		var peerConnection = new WebRTCCall();
		peerConnection.Host = (!this.Host);
		peerConnection.UserID = userid;
		peerConnection.Identifier = identifier
		peerConnection.Room = this.Room;
		peerConnection.sendSignalMessage = this.b_sendMessage;
		peerConnection.b_addStream(stream);
		peerConnection.b_startPeerConnection();

		this.broadcasts[identifier] = peerConnection;

		peerConnection.on("NEW_STREAM",function(){
			this.emit("STREAM_UPDATE");
			this.emit("NEW_STREAM");
			console.log(peerConnection.RemoteStream);
		}.bind(this));

	}

	broadcastConnection(webRTCCall,stream){

		for (var key in this.calls) {
			if (key != webRTCCall.UserID){
				this.b_broadcastOpen(key,webRTCCall.RemoteStream,webRTCCall.UserID+">"+key);

				this.b_sendMessage("SEND_USER",{
					'receiver': key,
					'message': {
						'type': 'BROADCAST_START',
						'identifier': webRTCCall.UserID+">"+key,
						'userid': webRTCCall.UserID
					}
				});

				this.b_broadcastOpen(webRTCCall.UserID,this.calls[key].RemoteStream,key+">"+webRTCCall.UserID);

				this.b_sendMessage("SEND_USER",{
					'receiver': webRTCCall.UserID,
					'message': {
						'type': 'BROADCAST_START',
						'identifier': key+">"+webRTCCall.UserID,
						'userid': key
					}
				});

			}
		}
	}

	removeUser(userid){

		if (this.calls.hasOwnProperty(userid)){
			this.calls[userid].localRTCPeerConnection.close();
			this.calls[userid] = null;
			delete this.calls[userid];
		}

		for (var key in this.broadcasts) {
			if (key.includes(userid)) {


				if (this.broadcasts.hasOwnProperty(key)){
					this.broadcasts[key].localRTCPeerConnection.close();
					this.broadcasts[key] = null;
					delete this.broadcasts[key];
				}
			}
		}

		this.emit("STREAM_UPDATE");

	}

	leaveRoom(){
		for (var key in this.calls) {
			if (this.calls.hasOwnProperty(key)){
				this.calls[key].localRTCPeerConnection.close();
				this.calls[key] = null;
				delete this.calls[key];
			}
		}

		this.calls = {};

		for (var key in this.broadcasts) {

			if (this.broadcasts.hasOwnProperty(key)){
				this.broadcasts[key].localRTCPeerConnection.close();
				this.broadcasts[key] = null;
				delete this.broadcasts[key];
			}
		}

		this.broadcasts = {};

		this.ws.close();
		this.ws.removeEventListener('open',this.b_onOpen);
		this.ws.removeEventListener('message',this.b_handleMessage);

		this.ws = new WebSocket(URI);

		this.ws.addEventListener('open',this.b_onOpen);
		this.ws.addEventListener('message',this.b_handleMessage);

		this.emit("HOST_LEFT");
	}

	startCall(userid,host){
		//userid: UserID of the person we're calling
		//host: If this user the room host? If so ignore the UserID
		//Stream: The video stream we're sending the person

		var peerConnection = new WebRTCCall();
		peerConnection.Host = host;
		peerConnection.UserID = userid;
		peerConnection.Room = this.Room;
		peerConnection.sendSignalMessage = this.b_sendMessage;
		peerConnection.getCode = this.b_getCode;
		peerConnection.setCode = this.b_setCode;
		peerConnection.b_addStream(this.localStream);
		peerConnection.b_startPeerConnection();

		this.calls[userid] = peerConnection;

		peerConnection.on("NEW_STREAM",function(){
			if (this.Host){
				this.b_broadcastConnection(peerConnection,peerConnection.RemoteStream);
			}

			this.emit("STREAM_UPDATE");
			this.emit("NEW_STREAM");
		}.bind(this));
	}

	startStreaming(callback){
		navigator.mediaDevices.getUserMedia({video:{ width: 150, height: 150 }, audio:true})
		.then(function(stream) {

			this.localStream = stream;
			this.emit("LOCAL_STREAM");

			callback();

		}.bind(this));
	}


	parseClientMessage(userid,message){
		switch (message.type){
			case "ICE_CANDIDATE":

				if (this.calls.hasOwnProperty(userid)){

					var iceCandidate = new RTCIceCandidate(message.ice);

					if (message.identifier == null){
						this.calls[userid].b_addIceCandidate(iceCandidate);
					}else{
						this.broadcasts[message.identifier].b_addIceCandidate(iceCandidate);
					}
				}else{
					console.log("NO CALL ID!!!");
				}


				break;
			case "DESCRIPTION_SET":



					var description = new RTCSessionDescription(message.sdp);

					if (message.identifier == null){
						if (this.calls.hasOwnProperty(userid)){
							this.calls[userid].b_setRemoteDescription(description,message.sdp);
						}else{
							console.error("NO CALL ID!!!");
							console.error(this.calls);
							console.error(userid);
						}
					}else{
						if (this.broadcasts.hasOwnProperty(message.identifier)){
							this.broadcasts[message.identifier].b_setRemoteDescription(description,message.sdp);
						}else{
							console.error("NO BROADCAST ID!!!");
							console.error(this.broadcasts);
							console.error(message.identifier);
						}
					}

				break;
			case "BROADCAST_START":

				this.b_broadcastOpen(message.userid,this.localStream,message.identifier);

				break;
		}
	}

	handleMessage(input){
		console.log(input.data);
		var data = JSON.parse(input.data);

		if (data.success){
			switch (data.type){
				case "HEARTBEAT":
					this.b_sendMessage("HEARTBEAT",{});
					break;
				case "JOINED_ROOM":
					this.Host = data.host;
					this.UserID = data.userid;
					this.Room = data.roomid;

					console.log("HOST:");
					console.log(this.Host);

					this.b_startStreaming(function(){
						if (!this.Host){
							this.b_startCall(data.hostid,true)
						}
					}.bind(this));

					this.emit("JOINED_ROOM");
					break;
				case 'USER_CONNECTED':

					if (this.Host){
						this.b_startCall(data.userid,false);
					}

					break;
				case 'USER_DISCONNECTED':

					if (!data.host){
						this.b_removeUser(data.userid);
					}else{
						this.b_leaveRoom();
					}

					break;
				case "RECEIVED_MESSAGE":
					this.b_parseClientMessage(data.userid,data.message);
					break;
			}
		}else{
			switch (data.err){

				case "ROOM_NOT_FOUND":
					this.emit("ROOM_NOT_FOUND");
					break;

			}
		}
	}

	createRoom(){
		this.b_sendMessage("NEW_ROOM");
	}

	joinRoom(roomID){
		this.b_sendMessage("JOIN_ROOM",{roomid:roomID});
	}
}

	service = new RTCService();
}else{
	service = null;
}

export default service;
