import React from 'react';
import TopBar from 'topbar/topbar.js';


export default class Main extends React.Component {
    /*
     Initialize your component here. This usually involves creating
     your initial state, and binding functions to the class variable 'this'
     */
    constructor(props) {
    }

    /*
     *Fires after the component is mounted and the DOM is loaded
     *it would be useful to add event handlers here
     */
    componentDidMount() {
    }

    /*
     This is useful for updating the component's state upon receiving
     a component property update, i.e. <MyComponent color='blue'> was
     changed to <MyComponent color='red'>.
    */
    componentWillReceiveProps(nextProps) {
    }

    /*
     Return false if a component should not be re-rendered
     upon a state change. No return or true return = AOK
     */
    shouldComponentUpdate(nextProps, nextState) {
    }

    /*
     Anything goes in here, but the returned content has to be JSX.
     Note that JSX can have branching and functions embedded in it using
     { and }.
     */
    render() {
        return (
            <div>
                <TopBar/>
                {this.props.children}
            </div>
        )
    }
}