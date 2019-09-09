import React, { Component, createRef } from "react";
import MessageBubble from "./MessageBubble";
import Dropzone from "react-dropzone";

import { withStyles } from "@material-ui/styles";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Drawer from "@material-ui/core/Drawer";
import Box from "@material-ui/core/Box";
import IconButton from "@material-ui/core/IconButton";
import AttachFile from "@material-ui/icons/AttachFile";

import theme from "./theme";

const drawerOpen = true;
const drawerHeight = "5em";

const dropzoneRef = createRef();

const styles = {
  drawer: {
    flexShrink: 0,
    maxHeight: `${drawerHeight}`
  },
  messages: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    flexGrow: 1,
    marginBottom: `${drawerHeight}`
  },
  row: {
    flexDirection: "row",
    width: "100%",
    flexGrow: 1
  },
  form: {
    display: "flex",
    alignItems: "center",
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1)
  },
  button: {
    display: "inline-flex",
    height: "50%",
    margin: theme.spacing(1)
  }
};

class ChatChannel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      newMessage: "",
      messages: [],
      loadingState: "initializing",
      boundChannels: new Set()
    };
  }

  loadMessagesFor = thisChannel => {
    if (this.props.channelProxy === thisChannel) {
      thisChannel
        .getMessages()
        .then(messagePaginator => {
          if (this.props.channelProxy === thisChannel) {
            this.setState({
              messages: messagePaginator.items,
              loadingState: "ready"
            });
          }
        })
        .catch(err => {
          console.error("Couldn't fetch messages IMPLEMENT RETRY", err);
          this.setState({ loadingState: "failed" });
        });
    }
  };

  componentDidMount = () => {
    if (this.props.channelProxy) {
      this.loadMessagesFor(this.props.channelProxy);

      if (!this.state.boundChannels.has(this.props.channelProxy)) {
        let newChannel = this.props.channelProxy;
        newChannel.on("messageAdded", m => this.messageAdded(m, newChannel));
        this.setState({
          boundChannels: new Set([...this.state.boundChannels, newChannel])
        });
      }
    }
  };

  componentDidUpdate = (oldProps, oldState) => {
    if (this.props.channelProxy !== oldState.channelProxy) {
      this.loadMessagesFor(this.props.channelProxy);

      if (!this.state.boundChannels.has(this.props.channelProxy)) {
        let newChannel = this.props.channelProxy;
        newChannel.on("messageAdded", m => this.messageAdded(m, newChannel));
        this.setState({
          boundChannels: new Set([...this.state.boundChannels, newChannel])
        });
      }
    }
  };

  static getDerivedStateFromProps(newProps, oldState) {
    let logic =
      oldState.loadingState === "initializing" ||
      oldState.channelProxy !== newProps.channelProxy;
    console.log("xxx", oldState.channelProxy, newProps.channelProxy, logic);
    if (logic) {
      return {
        loadingState: "loading messages",
        channelProxy: newProps.channelProxy
      };
    } else {
      return null;
    }
  }

  messageAdded = (message, targetChannel) => {
    if (targetChannel === this.props.channelProxy)
      this.setState((prevState, props) => ({
        messages: [...prevState.messages, message]
      }));
  };

  onMessageChanged = event => {
    this.setState({ newMessage: event.target.value });
  };

  sendMessage = event => {
    event.preventDefault();
    const message = this.state.newMessage;
    this.setState({ newMessage: "" });
    this.props.channelProxy.sendMessage(message);
  };

  onDrop = acceptedFiles => {
    console.log(acceptedFiles);
    this.props.channelProxy.sendMessage({
      contentType: acceptedFiles[0].type,
      media: acceptedFiles[0]
    });
  };

  openDialog = () => {
    // Note that the ref is set async,
    // so it might be null at some point
    if (dropzoneRef.current) {
      dropzoneRef.current.open();
    }
  };

  render = () => {
    const { classes } = this.props;

    return (
      <div>
        <Dropzone
          ref={dropzoneRef}
          onDrop={this.onDrop}
          accept="image/*"
          noClick
          noKeyboard
        >
          {({ getRootProps, getInputProps, isDragActive }) => (
            <div
              {...getRootProps()}
              className={classes.Dropzone}
              style={
                isDragActive
                  ? {
                      background: `repeating-linear-gradient( -35deg, #eee, #eee 10px, #fff 10px, #fff 20px )`
                    }
                  : {}
              }
            >
              <div className={classes.messages}>
                {this.state.messages.map(m => {
                  if (m.author === this.props.myIdentity)
                    return (
                      <MessageBubble
                        key={m.index}
                        direction="outgoing"
                        message={m}
                      />
                    );
                  else
                    return (
                      <MessageBubble
                        key={m.index}
                        direction="incoming"
                        message={m}
                      />
                    );
                })}
              </div>

              <input id="files" {...getInputProps()} />
            </div>
          )}
        </Dropzone>

        <Drawer
          className={classes.drawer}
          variant="persistent"
          anchor="bottom"
          open={drawerOpen}
        >
          <Box className={classes.row}>
            <form className={classes.form} onSubmit={this.sendMessage}>
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                type="text"
                name="message"
                id="message"
                disabled={this.state.loadingState !== "ready"}
                onChange={this.onMessageChanged}
                value={this.state.newMessage}
                label="Enter Message..."
                autoComplete="off"
                autoFocus
              />
              <IconButton className={classes.button} onClick={this.openDialog}>
                <AttachFile />
              </IconButton>
              <Button
                variant="contained"
                className={classes.button}
                type="submit"
              >
                Send
              </Button>
            </form>
          </Box>
        </Drawer>
      </div>
    );
  };
}

export default withStyles(styles)(ChatChannel);
