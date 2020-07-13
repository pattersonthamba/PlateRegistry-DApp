import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

const styles = theme => ({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  textField: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
    width: 200,
  },
  menu: {
    width: 200,
  },
});

class Transfer extends React.Component {
  state = {
      ID:null
  };

  handleChange = name => event => {
    this.setState({
      [name]: event.target.value,
    });
  };

  submitHandler = () => {
    //check if input is correctly formatted
    if (!(this.state.ID)){
      alert('All fields must be filled in');
    } else if (this.state.ID.slice(0,4) !== 'LP_0') {
      alert('ID MUST CONTAIN "LP_0" FOLLOWED BY ID')
    } else {
      this.props.switchFeedHandler(1)
      this.props.socket.emit('REQUEST', {action: "RENEWAL", data:this.state})
    }
  }

  render() {
    const { classes } = this.props;

    return (
      <form className="Main-inside" noValidate autoComplete="off">
     <Typography  variant="display2">
      Renew a license plate
      </Typography>
      <TextField
          label="License Plate ID"
          className={classes.textField}
          value={this.state.name}
          onChange={this.handleChange('ID')}
          margin="normal"
        />
        <Button variant="contained" color="primary" disabled={!this.props.connected} className={classes.button} onClick={this.submitHandler}>
            {this.props.connected ? "RENEWAL" : "DISCONNECTED"}
        </Button>
        <p>License Plate ID is case sensitive must be valid and it must start with 'LP_0'</p>
      </form>
      
    );
  }
}


export default withStyles(styles)(Transfer);
