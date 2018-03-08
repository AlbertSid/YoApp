import React, { Component } from 'react'
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  AlertIOS,
  Modal,
  Image,
  ListView,
  TextInput,
  ActivityIndicator
} from 'react-native'
import Video from 'react-native-video'
import Button from 'react-native-button'
import Icon from 'react-native-vector-icons/Ionicons'

import request from '../common/request'
import config from '../common/config'

let cachedResults = {
  nextPage: 1,
  items: [],
  total: 0
}
export default class Detail extends Component {
    constructor(props) {
        super(props)
        const ds = new ListView.DataSource({
            rowHasChanged: (r1, r2) => r1 !== r2
        });
        this.state = {
            data: this.props.data,
            // comments
            dataSource: ds.cloneWithRows([]),

            // video loads
            videoOk: true,
            videoLoaded: false,
            playing: false,
            paused: false,
            videoProgress: 0.01,
            videoTotal: 0,
            currentTime: 0,

            // modal
            content: '',
            animationType: 'none',
            modalVisible: false,
            isSending: false,

            // video player
            rate: 1,
            muted: false,
            resizeMode: 'contain',
            repeat: false
        }
    }
    // _backToList() {
    //     this.props.navigator.pop();
    // }
    _onLoadStart() { //视频开始加载
        console.log('_onLoadStart');
    }
    _onLoad() { //视频不断加载中
        console.log('_onLoad');
    }
    _onProgress(data) { //视频在播放时250ms调用一次
        if(!this.state.videoLoaded){
          this.setState({
            videoLoaded:true
          })
        }

        const duration = data.playableDuration;
        const currentTime = data.currentTime;
        const percent = Number((currentTime/duration).toFixed(2));
        const newState = {
          videoTotal:duration,
          currentTime:Number(data.currentTime.toFixed(2)),
          videoProgress:percent
        }

        if(!this.state.videoLoaded){
          newState.videoLoaded = true;
        }
        if(!this.state.playing){
          newState.playing = true;
        }
        this.setState(newState)
    }
    _onEnd() { //视频播放结束
      this.setState({
        videoProgress:1,
        playing:false
      })
    }
    _onError() { //视频出错时
      this.setState({
        videoOk: false
      })
    }
    _rePlay(){//播放完成后再重新播放
      this.refs.videoPlayer.seek(0)
    }
    _pause(){//播放中暂停
      if(!this.state.paused){
        this.setState({
          paused:true
        })
      }
    }
    _resume(){//暂停之后接着播放
      if(this.state.paused){
        this.setState({
          paused:false
        })
      }
    }


    _fetchData(page) {//评论数据
        const that = this
        this.setState({
          isLoadingTail: true
        })
        //const user = this.state.user;
        request.get(config.api.base + config.api.comment, {
          page:page,
          creation: this.state.data.id,
          accessToken:'123as'
        }).then((data) => {
            if (data.success) {
               if (data.data.length > 0) {
                const items = cachedResults.items.slice();
                items = items.concat(data.data)
                cachedResults.nextPage += 1
                cachedResults.items = items;
                cachedResults.total = data.total;

                that.setState({
                  isLoadingTail: false,
                  dataSource: that.state.dataSource.cloneWithRows(cachedResults.items)
                })
              }else{
                that.setState({
                  isLoadingTail: false
                })
              }
            }
        }).catch((error) => {
            this.setState({
              isLoadingTail: false
            })
            console.warn(error);
        });
    }
    _hasMore() {
        return cachedResults.items.length !== cachedResults.total
    }
    _fetchMoreData() {
        if (!this._hasMore() || this.state.isLoadingTail) {
            this.setState({
              isLoadingTail: false
            })
            return;
        }
        const page = cachedResults.nextPage;
        this._fetchData(page)
    }
    _focus() {
      this._setModalVisible(true)
    }

    _closeModal() {
      this._setModalVisible(false)
    }
    _setModalVisible(isVisible) {
     this.setState({
       modalVisible: isVisible
     })
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
            return <View style={styles.loadingMore}/>
        }
        return <ActivityIndicator style={styles.loadingMore}/>
    }
    _renderRow(row){
      return (
        <View key={row.id} style={styles.replyBox}>
          <Image style={styles.replyAvatar} source={{uri:row.replayBy.avator}} />
          <View style={styles.reply}>
            <Text style={styles.replyNickname}>{row.replayBy.nickname}</Text>
            <Text style={styles.replyContent}>{row.content}</Text>
          </View>
        </View>
      )
    }
    _renderHeader() {
      const data = this.state.data;
      return (
        <View style={styles.listHeader}>
          <View style={styles.infoBox}>
            <Image style={styles.avatar} source={{uri: data.author.avator}} />
            <View style={styles.descBox}>
              <Text style={styles.nickname}>{data.author.nickname}</Text>
              <Text style={styles.title}>{data.title}</Text>
            </View>
          </View>
          <View style={styles.commentBox}>
            <View style={styles.comment}>
              <TextInput
                placeholder='敢不敢评论一个...'
                style={styles.content}
                multiline={true}
                onFocus={this._focus.bind(this)}
              />
            </View>
          </View>

          <View style={styles.commentArea}>
            <Text style={styles.commentTitle}>精彩评论</Text>
          </View>
        </View>
      )
    }
    _submit(){
      const that = this;
      // isSending
      if(!this.state.content){
        return AlertIOS.alert("留言不能为空")
      }
      if(this.state.isSending){
        return AlertIOS.alert("正在评论中...")
      }
      this.setState({
        isSending:true
      },function(){
        let body = {
          accessToken:'abc',
          creation:'123',
          content:this.state.content
        }
        const url = config.api.base + config.api.comment;
        request.post(url,body).then(function(data){

          if(data && data.success){
            const items = cachedResults.items.slice();
            const content = that.state.content
            items = [{
              content:content,
              replayBy:{
                nickname:'TestTattoo',
                avator:'http://dummyimage.com/640x640/4524ad'
              }
            }].concat(items);

            cachedResults.items = items;
            cachedResults.total += 1
            that.setState({
              content:'',
              isSending:false,
              dataSource:that.state.dataSource.cloneWithRows(cachedResults.items)
            })
            that._setModalVisible(false);
          }
        }).catch(function(error){
          console.log(error)
          that.setState({
            content:'',
            isSending:false
          });
          that._setModalVisible(false);
          AlertIOS.alert('留言失败，请稍后再试')
        })
      })
    }
    componentDidMount(){
      this._fetchData()
    }
    render() {
        const data = this.props.data;
        return (
            <View style={styles.container}>
              <View style={styles.header}>
                {/* <TouchableOpacity
                  style={styles.backBox}
                  onPress={this._backToList.bind(this)}>
                  <Icon name='ios-arrow-back' style={styles.backIcon}/>
                  <Text style={styles.backText}>
                    返回
                  </Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOflines={1}>
                  视频详情
                </Text> */}
              </View>
              <View style={styles.videoBox}>
                <Video ref='videoPlayer' //视频的ref
                  source={{uri: data.video}} //视频地址
                  style={styles.video} //样式
                  volume={5} //声音放大的倍数
                  paused={this.state.paused} //是否暂停
                  rate={this.state.rate} //1正常0暂停
                  muted={this.state.muted} //是否静音
                  resizeMode={this.state.resizeMode} //视频的拉伸方式
                  repeat={this.state.repeat} //是否重复播放
                  onLoadStart={this._onLoadStart.bind(this)} //
                  onLoad={this._onLoad.bind(this)} //
                  onProgress={this._onProgress.bind(this)} //
                  onEnd={this._onEnd.bind(this)} //
                  onError={this._onError.bind(this)} //
                />
                {//视频出错
                  !this.state.videoOk && <Text style={styles.failText}>视频出错了！很抱歉</Text>
                }
                {//loading的图标
                  !this.state.videoLoaded && <ActivityIndicator color="#ee735c" style={styles.loading}/>
                }
                {//重新播放
                  this.state.videoLoaded && !this.state.playing
                  ?
                    <Icon
                      onPress={this._rePlay.bind(this)}
                      name="ios-play"
                      size={28}
                      style={styles.playIcon}
                    />
                  : null
                }
                {
                  //暂停，视频播放中，然后重新播放
                  this.state.videoLoaded && this.state.playing
                  ?//暂停，视频播放中
                    <TouchableOpacity onPress={this._pause.bind(this)} style={styles.pauseBtn}>
                      {//重新播放
                        this.state.paused
                        ?
                          <Icon
                            onPress={this._resume.bind(this)}
                            name='ios-play'
                            size={28}
                            style={styles.resumeIcon}
                          />
                        :<Text></Text>
                      }
                    </TouchableOpacity>
                  :null
                }
                {
                  //下面播放进度条
                }
                <View style={styles.progressBox}>
                  <View style={[styles.progressBar,{width:width*this.state.videoProgress}]}></View>
                </View>
              </View>
              <ListView
                dataSource={this.state.dataSource} //渲染初始数据
                renderHeader={this._renderHeader.bind(this)} //
                renderRow={this._renderRow.bind(this)} //
                renderFooter={this._renderFooter.bind(this)} //
                onEndReached={this._fetchMoreData.bind(this)} //更多数据
                onEndReachedThreshold={20} //离底部多高的时候加载数据
                enableEmptySections={true} //
                showsVerticalScrollIndicator={false} //隐藏列表的滚动条
                automaticallyAdjustContentInsets={false} //取消顶部的marginTop
              />

              <Modal
                animationType={this.state.animationType}
                visible={this.state.modalVisible}>
                <View style={styles.modalContainer}>
                  <Icon
                    onPress={this._closeModal.bind(this)}
                    name='ios-close-outline'
                    style={styles.closeIcon} />

                  <View style={styles.commentBox}>
                    <View style={styles.comment}>
                      <TextInput
                        placeholder='敢不敢评论一个...'
                        style={styles.content}
                        multiline={true}
                        defaultValue={this.state.content}
                        onChangeText={(text) => {
                          this.setState({
                            content: text
                          })
                        }}
                      />
                    </View>
                  </View>
                  <Button style={styles.submitBtn} onPress={this._submit.bind(this)}>评论</Button>
                </View>
              </Modal>
            </View>
        )
    }
}

const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;
const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems:'center',
        marginTop:25,
        backgroundColor: '#f5fcff'
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      width: width,
      height: 36,
      paddingLeft: 10,
      paddingRight: 10,
      borderBottomWidth: 1,
      borderColor: 'rgba(0,0,0,0.1)',
      backgroundColor: '#fff'
    },
    backBox: {
      position: 'absolute',
      left: 12,
      top:6,
      width: 50,
      flexDirection: 'row',
      alignItems: 'center'
    },

    headerTitle: {
      width: width - 120,
      textAlign: 'center'
    },
    backIcon: {
      color: '#999',
      fontSize: 20,
      marginRight: 5
    },
    backText: {
      color: '#999'
    },
    videoBox: {
        width: width,
        height: width*0.56,
        backgroundColor: '#000'
    },
    video: {
        width: width,
        height: width*0.56,
        backgroundColor: '#000'
    },
    loading:{
      position:"absolute",
      left:0,
      top:90,
      width:width,
      alignSelf:'center',
      backgroundColor:'transparent'
    },
    progressBox:{
      width:width,
      height:2,
      backgroundColor:'#ccc'
    },
    progressBar:{
      width:1,
      height:2,
      backgroundColor:'#ee7357'
    },
    playIcon:{
      position: 'absolute',
      top: 110,
      left: width / 2 - 23,
      width: 46,
      height: 46,
      paddingTop: 8,
      paddingLeft: 18,
      backgroundColor: 'transparent',
      borderColor: '#fff',
      borderWidth: 1,
      borderRadius: 23,
      color: '#ed7b66'
    },
    failText:{
      position:'absolute',
      top:140,
      left:0,
      width:width,
      color:'#fff',
      textAlign:'center',
    },
    pauseBtn:{
      position:'absolute',
      top:0,
      left:0,
      width:width,
      height:240
    },
    resumeIcon:{
      position: 'absolute',
      top: 80,
      left: width / 2 - 23,
      width: 46,
      height: 46,
      paddingTop: 8,
      paddingLeft: 18,
      backgroundColor: 'transparent',
      borderColor: '#fff',
      borderWidth: 1,
      borderRadius: 23,
      alignItems:'center',
      color: '#ed7b66'
    },
  infoBox: {
    width: width,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10
  },

  avatar: {
    width: 60,
    height: 60,
    marginRight: 10,
    marginLeft: 10,
    borderRadius: 30
  },

  descBox: {
    flex: 1
  },

  nickname: {
    fontSize: 18
  },

  title: {
    marginTop: 8,
    fontSize: 16,
    color: '#666'
  },
  replyBox: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 10
  },

  replyAvatar: {
    width: 40,
    height: 40,
    marginRight: 10,
    marginLeft: 10,
    borderRadius: 20
  },
  reply: {
    flex: 1
  },
  replyNickname: {
    color: '#666'
  },
  replyContent: {
    marginTop: 4,
    color: '#666'
  },
  loadingMore: {
      marginVertical: 20
  },
  loadingText: {
      color: '#777',
      textAlign: 'center'
  },
  listHeader: {
      width: width,
      marginTop: 10
  },
  commentBox: {
    marginTop: 10,
    marginBottom: 10,
    padding: 8,
    width: width
  },

  content: {
    paddingLeft: 2,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    fontSize: 14,
    height: 80
  },

  commentArea: {
    width: width,
    paddingBottom: 6,
    paddingLeft: 10,
    paddingRight: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  modalContainer: {
    flex: 1,
    paddingTop: 45,
    backgroundColor: '#fff'
  },

  closeIcon: {
    alignSelf: 'center',
    fontSize: 30,
    color: '#ee753c'
  },

  submitBtn: {
    width: width - 20,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ee753c',
    alignSelf: 'center',
    textAlign: 'center',
    borderRadius: 4,
    fontSize: 18,
    color: '#ee753c'
  },
})
