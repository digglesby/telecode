import React from 'react';
import {Controlled as CodeMirror} from 'react-codemirror2';
require('codemirror/mode/lua/lua');
require('codemirror/mode/javascript/javascript');
require('codemirror/mode/css/css');
require('codemirror/mode/php/php');
require('codemirror/mode/clike/clike');
require('codemirror/mode/python/python');
require('codemirror/mode/erlang/erlang');
require('codemirror/mode/markdown/markdown');
require('codemirror/mode/shell/shell');

class LiveCodeEditor extends React.Component {
  constructor(props) {
    super(props);

		this.b_onBeforeChange = this.onBeforeChange.bind(this);
		this.b_onSelect = this.onSelect.bind(this);
		this.b_didConfigure = this.didConfigure.bind(this);

		var initCode = "";

		if (this.props.host == true){
			initCode = "Welcome to Telecode!\nEdits here will be visible to everyone in the room!\n\nYou can invite people to this room by sharing this link ☞ "+this.props.url;
		}else{
			initCode = this.props.webRTCHost.b_getCode();
		}

		this.modes = {
			javascript:"Javascript",
			lua:"Lua",
			css:"CSS",
			php:"PHP",
			clike:"C / C++ / C#",
			python:"Python",
			erlang:"Erlang",
			markdown:"Markdown",
			shell:"Bash"
		}

		this.state = {
			code: initCode,
			mode: 'javascript'
		}

		this.options = {
			mode: 'xml',
			theme: 'material',
			lineNumbers: true
		}

		this.editor = null;

		this.props.webRTCHost.b_setCode( this.state );

		this.props.webRTCHost.on("CODE_CHANGE",function(){
			this.setState({
				code:this.props.webRTCHost.b_getCode().code,
				mode:this.props.webRTCHost.b_getCode().mode
			});
		}.bind(this));
  }

	onBeforeChange(editor,data,value){

		this.setState({
			code:value
		});

		this.props.webRTCHost.b_setCode( { mode:this.state.mode , code:value }, true );

	}

	onSelect(e){
		console.log(e);

		this.setState({
			mode:e.target.value
		});

		if (this.editor){
			this.editor.setOption("mode",e.target.value);
		}

		this.props.webRTCHost.b_setCode( { mode:e.target.value , code:this.state.code }, true );
	}

	didConfigure(editor){
		console.log(editor);
		this.editor = editor;
	}

  render(){

		var options = [];

		for (var key in this.modes) {
			if (this.modes.hasOwnProperty(key)) {
				options.push(<option value={key} key={key}>{this.modes[key]}</option>);
			}
		}

    return (
			<div className="code-workspace">
				<header className="top-bar">
					<select onChange={this.b_onSelect} value={this.state.mode}>
						{options}
					</select>
				</header>

				<CodeMirror
					value={this.state.code}
					options={{
						mode:this.state.mode,
						theme: 'material',
						lineNumbers: true
					}}
					onBeforeChange={this.b_onBeforeChange}
					preserveScrollPosition={true}
				/>
			</div>
    );

  }
}

export default LiveCodeEditor;
