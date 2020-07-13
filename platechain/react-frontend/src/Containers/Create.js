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

class Create extends React.Component {
  state = {
    company: null,
    payment: null,
    model: null,
    owner: null
  };

  handleChange = name => event => {
    this.setState({
      [name]: event.target.value,
    });
  };

  createHandler = () => {
    //Check form validity
    if (!(this.state.company && this.state.payment && this.state.model && this.state.owner)){
      alert('All fields must be filled in');
    } else {
      this.props.switchFeedHandler(1)
      this.props.socket.emit('REQUEST', {action: "CREATE", data:this.state})
    }
  }

  render() {
    const { classes } = this.props;

    return (
      <form className="Main-inside" noValidate autoComplete="off">
        <Typography  variant="display2">
          Create a license plate
        </Typography>
        <TextField
          label="Owner"
          className={classes.textField}
          value={this.state.name}
          onChange={this.handleChange('owner')}
          margin="normal"
        />
        <TextField
          label="Company"
          className={classes.textField}
          value={this.state.name}
          onChange={this.handleChange('company')}
          margin="normal"
        />
        <TextField
          label="Model"
          className={classes.textField}
          value={this.state.name}
          onChange={this.handleChange('model')}
          margin="normal"
        />
        <TextField
          label="Payment"
          className={classes.textField}
          value={this.state.name}
          onChange={this.handleChange('payment')}
          margin="normal"
        />
        
        <Button variant="contained" 
                color="primary" 
                disabled={!this.props.connected}
                className={classes.button} 
                onClick={this.createHandler}>
           {this.props.connected ? "CREATE" : "DISCONNECTED"}
        </Button>
      </form>
      
    );
  }
}


export default withStyles(styles)(Create);
