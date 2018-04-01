/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 *
 *
// import React,{ Component } from 'react'
// var CountDownText = React.Component({})


import React from 'react'
import {
  StyleSheet,
  Text,
} from 'react-native';

var update = require('react-addons-update')
var createReactClass = require('create-react-class');

var countDown = require('./countDown')
var CountDownText = createReactClass({})

// import PropTypes from 'prop-types';
// test
 *
 *
 */

import React, {Component} from 'react'
import {
  AppRegistry,
  NavigatorIOS,
  ActivityIndicator,
  TouchableHighlight,
  AsyncStorage,
  Text,
  View,
  StyleSheet,
  Dimensions,
  TabBarIOS
} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import PropTypes from 'prop-types'

import Login from './account/Login'
import Account from './account/Account'
import Edit from './edit/Edit'
import List from './creation/List'

export default class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      user: null,
      selectedTab: 'list',
      entered: false,
      booted: false,
      logined: false
    }
  }

  _logout() {
    AsyncStorage.removeItem('user')
    this.setState({logined: false, user: null})
  }
  _asyncAppStatus() {
    const that = this

    AsyncStorage.multiGet(['user', 'entered']).then((data) => {
      const userData = data[0][1]
      const entered = data[1][1]
      let user
      const newState = {
        booted: true
      }

      if (userData) {
        user = JSON.parse(userData)
      }

      if (user && user.accessToken) {
        newState.user = user
        newState.logined = true
      } else {
        newState.logined = false
      }

      // if (entered === 'yes') {
      //   newState.entered = true
      // }

      that.setState(newState)
    })
  }

  _afterLogin(user) {
    const that = this
    user = JSON.stringify(user)
    AsyncStorage.setItem('user', user).then(() => {
      that.setState({logined: true, user: user})
    })
  }

  _enterSlide() {
    this.setState({
      entered: true
    }, function() {
      AsyncStorage.setItem('entered', 'yes')
      AlertIOS.alert('进入 App')
    })
  }
  componentDidMount() {
    this._asyncAppStatus()
  }
  render() {
    //  if (!this.state.booted) {
    //     return (
    //       <View style={styles.bootPage}>
    //         <ActivityIndicator color='#ee735c' />
    //       </View>
    //     )
    //   }
    //
    //   if (!this.state.entered) {
    //     return <Slider enterSlide={this._enterSlide.bind(this)} />
    //   }

    if (!this.state.logined) {
      return <Login afterLogin={this._afterLogin.bind(this)}/>
    }
    return (<TabBarIOS tintColor="#ee735c">
      <Icon.TabBarItem iconName='ios-videocam-outline'
        selectedIconName='ios-videocam'
        selected={this.state.selectedTab === 'list'}
        onPress={() => {
          this.setState({selectedTab: 'list'})
        }}>
        <List />
      </Icon.TabBarItem>
      {/* <Icon.TabBarItem iconName='ios-recording-outline'
        selectedIconName='ios-recording'
        selected={this.state.selectedTab === 'edit'}
        onPress={() => {
          this.setState({selectedTab: 'edit'})
        }}>
        <Edit />
      </Icon.TabBarItem> */}
      <Icon.TabBarItem iconName='ios-more-outline'
        selectedIconName='ios-more'
        selected={this.state.selectedTab === 'account'}
        onPress={() => {
          this.setState({selectedTab: 'account'})
        }}>
        {/* <Account /> */}
        <Account user={this.state.user} logout={this._logout.bind(this)} />
      </Icon.TabBarItem>
    </TabBarIOS>)
  }
}
const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ee8375',
  },
  bootPage: {
    width: width,
    height: height,
    color: '#000',
    backgroundColor: '#fff',
    justifyContent: 'center'
  }
})
