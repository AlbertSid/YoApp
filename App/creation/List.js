
// import {
// } from 'react-native';
// import Movies from './Movies';
//
// import NavigationExperimental from 'react-native-deprecated-custom-components';
// 
// const RouteMapper = (route, navigator) => {
//   if (route.name === 'movies') {
//     return <Movies navigator={navigator} />;
//   }
// };
//
// export default class App extends Component {
//   render() {
//     return (
//       <NavigationExperimental.Navigator
//         // Default to movies route
//         initialRoute={{ name: 'movies' }}
//         // Use FloatFromBottom transition between screens
//         configureScene={(route, routeStack) => NavigationExperimental.Navigator.SceneConfigs.FloatFromBottom}
//         // Pass a route mapper functions
//         renderScene={RouteMapper}
//       />
//     );
//   }
// }


import React, {Component} from 'react'
import {
    StyleSheet,
    Text,
    View,
    TouchableHighlight,
    ListView,
    FlatList,
    Image,
    ImageBackground,
    Dimensions,
    RefreshControl,
    ActivityIndicator,
    AlertIOS,
    NavigatorIOS,
    AsyncStorage
} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'

import request from '../common/request'
import config from '../common/config'
import Detail from './detail'

class Item extends Component {
    constructor(props) {
        super(props)
        const row = this.props.row
        this.state = {
            up: row.voted,
            row: row
        }
    }

    _up() {
        const that = this
        const up = !this.state.up
        const row = this.state.row
        const url = config.api.base + config.api.up

        const body = {
            id: row.id,
            up: up ? 'yes' : 'no',
            accessToken:'abc'
            //accessToken: this.props.user.accessToken
        }

        request.post(url, body).then(function(data) {
            if (data && data.success) {
                that.setState({up: up})
            } else {
                AlertIOS.alert('点赞失败，稍后重试')
            }
        }).catch(function(err) {
            console.log(err)
            AlertIOS.alert('点赞失败，稍后重试')
        })
    }

    render() {
        const row = this.state.row;
        return (
            <TouchableHighlight onPress={this.props.onSelect}>
              <View style={styles.item}>
                <Text style={styles.title}>{row.title}</Text>
                <ImageBackground source={{uri: row.thumb}} style={styles.thumb}>
                  <Icon name='ios-play' size={28} style={styles.play}/>
                </ImageBackground>
                <View style={styles.itemFooter}>
                  <View style={styles.handleBox}>
                    <Icon
                      name={this.state.up ? 'ios-heart': 'ios-heart-outline'}
                      size={28}
                      onPress={this._up.bind(this)}
                      style={[styles.up, this.state.up ? null : styles.down]}
                    />
                    <Text style={styles.handleText} onPress={this._up.bind(this)}>喜欢</Text>
                  </View>
                  <View style={styles.handleBox}>
                    <Icon name='ios-chatboxes-outline' size={28} style={styles.commentIcon}/>
                    <Text style={styles.handleText}>评论</Text>
                  </View>
                </View>
              </View>
            </TouchableHighlight>
        )
    }
}

let cachedResults = {
    nextPage: 1,
    items: [],
    total: 0
}
class ListDatas extends Component {
    static propTypes = {}
    constructor(props) {
        super(props)
        const ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });
        this.state = {
            dataSource: ds.cloneWithRows([]),
            isRefreshing: false,
            isLoadingTail: false
        }
    }
    _fetchData(page) {
        const that = this

        if (page !== 0) {
            this.setState({isLoadingTail: true})
        } else {
            this.setState({isRefreshing: true})
        }
        //const user = this.state.user;
        request.get(config.api.base + config.api.creation, {
            accessToken: 'abc',
            page: page
        }).then((data) => {
            console.log(data)
            if (data && data.success) {
               if (data.data.length > 0) {
                  // data.data.map(function(item) {
                  //     const votes = item.votes || []
                  //
                  //     if (votes.indexOf(user._id) > -1) {
                  //         item.voted = true
                  //     } else {
                  //         item.voted = false
                  //     }
                  //
                  //     return item
                  // })
                  const items = cachedResults.items.slice();
                  if (page !== 0) {
                      items = items.concat(data.data)
                      cachedResults.nextPage += 1
                  } else {
                      items = data.data.concat(items)
                  }
                  cachedResults.items = items;
                  cachedResults.total = data.total;
                  if (page !== 0) {
                      that.setState({
                          isLoadingTail: false,
                          dataSource: that.state.dataSource.cloneWithRows(cachedResults.items)
                      })
                  } else {
                      that.setState({
                          isRefreshing: false,
                          dataSource: that.state.dataSource.cloneWithRows(cachedResults.items)
                      })
                  }
              }
            }
        }).catch((error) => {
            if (page !== 0) {
                this.setState({isLoadingTail: false})
            } else {
                this.setState({isRefreshing: false})
            }
            console.warn(error);
        });
    }
    _hasMore() {
        return cachedResults.items.length !== cachedResults.total
    }
    _fetchMoreData() {
        if (!this._hasMore() || this.state.isLoadingTail) {
            this.setState({isLoadingTail: false})
            return
        }
        const page = cachedResults.nextPage
        this._fetchData(page)
    }
    _renderFooter() {
        if (!this._hasMore() && cachedResults.total !== 0) {
            return (
                <View style={styles.loadingMore}>
                    <Text style={styles.loadingText}>没有更多了</Text>
                </View>
            )
        }
        if (!this.state.isLoadingTail) {
            return <View style={styles.loadingMore} />
        }
        return <ActivityIndicator style={styles.loadingMore}/>
    }
    _loadPage(row) {
        this.props.navigator.push({
            name: 'detail',
            title: '视频详情',
            // titleTextColor:'#fff', //详情页标题色
            component: Detail,
            // barTintColor: 'red',//详情页背景色
            passProps: {
                data: row
            }
        })
    }
    _renderRow(row) {
        return <Item key={row.id} row={row}
          // user={this.state.user}
          onSelect={() => this._loadPage(row)}
        />
    }
    _onRefresh() {
        if (!this._hasMore() || this.state.isRefreshing) {
            return
        }
        // const page = cachedResults.nextPage
        // this._fetchData(page)
        this._fetchData(0)
    }
    componentDidMount() {
      const that = this;
      that._fetchData(0)
      //const page = cachedResults.nextPage
      // AsyncStorage.getItem('user')
      //   .then((data) => {
      //     let user
      //
      //     if (data) {
      //       user = JSON.parse(data)
      //     }
      //
      //     if (user && user.accessToken) {
      //       that.setState({
      //         user: user
      //       }, function() {
      //         that._fetchData(1)
      //       })
      //     }
      //   })
    }
    render() {
        return (
            <View style={styles.container}>
              <View style={styles.header}></View>
              <ListView showsVerticalScrollIndicator={false} //隐藏列表的滚动条
                  dataSource={this.state.dataSource} //渲染初始数据
                  onEndReached={this._fetchMoreData.bind(this)} //下拉刷新
                  onEndReachedThreshold={20} //离底部多高的时候加载数据
                  renderRow={this._renderRow.bind(this)} //网络数据
                  renderFooter={this._renderFooter.bind(this)} //底部状态
                  refreshControl={(
                    <RefreshControl
                      refreshing={this.state.isRefreshing}
                      onRefresh={this._onRefresh.bind(this)}
                      tintColor='#ff6600'
                      title='拼命加载中...'/>
                  )} //
                  enableEmptySections={true} //
                  automaticallyAdjustContentInsets={false} //取消顶部的marginTop
                />
            </View>
        )
    }
}

export default class List extends Component {
  render () {
    return (
      <NavigatorIOS
        style={{flex: 1}}
        barTintColor='#ee735c' //当前视图的标题的背景颜色
        titleTextColor='#fff' //当前视图的标题的颜色
        initialRoute={{
          component: ListDatas,//加载的视图组件
          title: '列表头部', //当前视图的标题
          // titleImage: Image.propTypes.source,
          // passProps: object,//传递的数据
          // backButtonIcon: Image.propTypes.source,// 后退按钮图标
          backButtonTitle: '返回',//后退按钮标题
          // leftButtonIcon: Image.propTypes.source,// 左侧按钮图标
          // leftButtonTitle: string,//左侧按钮标题
          // leftButtonSystemIcon: Object.keys(SystemIcons),
          // onLeftButtonPress: function,//左侧按钮点击事件
          // rightButtonIcon: Image.propTypes.source,// 右侧按钮图标
          // rightButtonTitle: string,//右侧按钮标题
          // rightButtonSystemIcon: Object.keys(SystemIcons),
          // onRightButtonPress: function,//右侧按钮点击事件
          // wrapperStyle: View.style,//包裹样式
          // navigationBarHidden: bool,
          // shadowHidden: bool,
          // tintColor: '#000',
          // barTintColor: '#ee735c',//当前视图的标题的背景颜色
          // barStyle: enum('default', 'black'),
          // titleTextColor: '#fff',//当前视图的标题的颜色
          // translucent: bool
        }}
        // configureScene={(route, routeStack) => Navigator.SceneConfigs.HorizontalSwipeJumpFromRight}
        configureScene={(route, routeStack) => Navigator.SceneConfigs.FloatFromLeft}
        renderScene={(route, navigator) => {
          const Component = route.component
          return <Component {...route.passProps} navigator={navigator}/>
        }}
      />

    )
  }
}

const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;

const styles = StyleSheet.create({
    container: {
        width: width,
        height: height,
        backgroundColor: '#f5fcff'
    },
    header: {
        paddingTop: 50,
        paddingBottom: 12,
    },
    back: {
        color: '#fff',
    },
    //上下拉刷新
    loadingMore: {
        marginVertical: 20
    },
    loadingText: {
        color: '#777',
        textAlign: 'center'
    },
    //喜欢评论
    item: {
        width: width,
        marginBottom: 10,
        backgroundColor: '#fff'
    },
    thumb: {
        width: width,
        height: (width * 0.56),
    },
    title: {
        padding: 10,
        fontSize: 18,
        color: '#333'
    },
    itemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#eee'
    },
    handleBox: {
        padding: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        width: (width / 2 - 0.5),
        backgroundColor: '#fff'
    },
    play: {
        position: 'absolute',
        bottom: 14,
        right: 14,
        width: 46,
        height: 46,
        paddingTop: 8,
        paddingLeft: 18,
        backgroundColor: 'transparent',
        borderColor: '#eee',
        borderWidth: 1,
        borderRadius: 23,
        color: '#ed7b66'
    },
    handleText: {
        paddingLeft: 12,
        fontSize: 18,
        color: '#333'
    },
    up: {
        fontSize: 22,
        color: '#ed7b66'
    },
    down: {
        fontSize: 22,
        color: '#333'
    },
    comment: {
        fontSize: 22,
        color: '#333'
    }
})
