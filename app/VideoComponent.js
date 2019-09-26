import React, { Component } from 'react'
import Video from 'twilio-video'
import axios from 'axios'

import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import { Card, CardHeader, CardText } from 'material-ui/Card';

export default class VideoComponent extends Component {
  constructor(props) {
    super()

    this.state = {
      identity: 'something',
      roomName: '',
      roomNameErr: '',
      previewTracks: null,
      localMediaAvailable: false,
      hasJoinedRoom: false,
      activeRoom: null,
    }

    this.handleRoomNameChange = this.handleRoomNameChange.bind(this)
    this.joinRoom = this.joinRoom.bind(this)
    this.roomJoined = this.roomJoined.bind(this)
  }

  componentDidMount() {
    axios.get('/token')
      .then(results => {
        const { identity, token } = results.data;
        this.setState({ identity, token })
      })
  }

  handleRoomNameChange(e) {
    let roomName = e.target.value
    this.setState({ roomName })
  }

  attachTracks(tracks, container) {
    tracks.forEach(track => {
      container.appendChild(track.attach())
    });
  }

  attachParticipantTracks(participant, container) {
    let tracks = Array.from(participant.tracks.values())
    
    this.attachTracks(tracks, container)
  }

  roomJoined(room) {
    console.log(room)
    console.log("Joined as '" + this.state.identity + "'")

    this.setState({
      activeRoom: room,
      localMediaAvailable: true,
      hasJoinedRoom: true
    })

    let previewContainer = this.refs.localMedia
    if (!previewContainer.querySelector('video')) {
      window.localParticipant = room.localParticipant
      this.attachParticipantTracks(room.localParticipant, previewContainer)
    }
  }

  joinRoom() {
    if (!this.state.roomName.trim()) {
      this.setState({ roomNameErr: true })

      return;
    }
    console.log(this.state.identity)
    console.log("Join room '" + this.state.roomName + "'..." + this.state.identity)

    let connectOptions = { name: this.state.roomName }

    if (this.state.previewTracks) {
      connectOptions.tracks = this.state.previewTracks
    }

    console.log(this.state.token, connectOptions);

    Video.connect(this.state.token, connectOptions)
      .then(this.roomJoined, error => {
        console.log(error)
        alert('Could not connect to Twilio: ' + error.message)
      })
  }

  render() {
    /* 
     Controls showing of the local track
     Only show video track after user has joined a room else show nothing 
    */
    let showLocalTrack = this.state.localMediaAvailable ? (<div className="flex-item"><div ref="localMedia" /> </div>) : '';
    /*
     Controls showing of ‘Join Room’ or ‘Leave Room’ button.  
     Hide 'Join Room' button if user has already joined a room otherwise 
     show `Leave Room` button.
    */
    let joinOrLeaveRoomButton = this.state.hasJoinedRoom ?
    (<RaisedButton label="Leave Room" secondary={true} onClick={() => alert("Are you sure to leave this room?")} />) :
    (<RaisedButton label="Join Room" primary={true} onClick={this.joinRoom} />);

    return (
      <Card>
        <CardText>
          <div className="flex-container">
            {showLocalTrack} {/* Show local track if available */}
            <div className="flex-item">
              {/* The following text field is used to enter a room name. It calls  `handleRoomNameChange` method when the text changes which sets the `roomName` variable initialized in the state.*/}
              <TextField hintText="Room Name" onChange={this.handleRoomNameChange} errorText={this.state.roomNameErr ? 'Room Name is required' : undefined}/>
              <br />
              {joinOrLeaveRoomButton}  {/* Show either ‘Leave Room’ or ‘Join Room’ button */}
            </div>
            {/* The following div element shows all remote media (other participant’s tracks) */}
            <div className="flex-item" ref="remoteMedia" id="remote-media" />
          </div>
        </CardText>
      </Card>
    );
  }
}
