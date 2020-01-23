import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Animated, Dimensions, Modal, PanResponder, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, TouchableHighlight, View } from 'react-native';

const WINDOW_HEIGHT = Dimensions.get('window').height;
const WINDOW_WIDTH = Dimensions.get('window').width;
const isIOS = Platform.OS === 'ios';

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
  },
  open: {
    position: 'absolute',
    flex: 1,
    justifyContent: 'center',
    // Android pan handlers crash without this declaration:
    backgroundColor: 'transparent',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: WINDOW_WIDTH,
    backgroundColor: 'transparent',
  },
  closeButton: {
    fontSize: 35,
    color: 'white',
    lineHeight: 40,
    width: 40,
    textAlign: 'center',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowRadius: 1.5,
    shadowColor: 'black',
    shadowOpacity: 0.8,
  },
});

export default class LightboxOverlay extends Component {
  static propTypes = {
    origin: PropTypes.shape({
      x:        PropTypes.number,
      y:        PropTypes.number,
      width:    PropTypes.number,
      height:   PropTypes.number,
    }),
    springConfig: PropTypes.shape({
      tension:  PropTypes.number,
      friction: PropTypes.number,
    }),
    backgroundColor: PropTypes.string,
    isOpen:          PropTypes.bool,
    renderHeader:    PropTypes.func,
    onOpen:          PropTypes.func,
    onClose:         PropTypes.func,
    willClose:         PropTypes.func,
    swipeToDismiss:  PropTypes.bool,
  };

  static defaultProps = {
    springConfig: { tension: 30, friction: 7 },
    backgroundColor: 'black',
  };

  state = {
    isAnimating: false,
    isPanning: false,
    target: {
      x: 0,
      y: 0,
      opacity: 1,
    },
    pan: new Animated.Value(0),
    openVal: new Animated.Value(0),
  };

  componentWillMount() {
    this._panResponder = PanResponder.create({
    });
  }

  componentDidMount() {
    if(this.props.isOpen) {
      this.open();
    }
  }

  open = () => {
    if(isIOS) {
      StatusBar.setHidden(true, 'fade');
    }
    this.state.pan.setValue(0);
    this.setState({
      isAnimating: true,
      target: {
        x: 0,
        y: 0,
        opacity: 1,
      }
    });

    this.setState({ isAnimating: false });
    this.props.didOpen();
  }

  close = () => {
    this.props.willClose();
    if(isIOS) {
      StatusBar.setHidden(false, 'fade');
    }
    this.setState({
      isAnimating: true,
    });
    Animated.spring(
      this.state.openVal,
      { toValue: 0, ...this.props.springConfig }
    ).start(() => {
      this.setState({
        isAnimating: false,
      });
      this.props.onClose();
    });
  }

  componentWillReceiveProps(props) {
    if(this.props.isOpen != props.isOpen && props.isOpen) {
      this.open();
    }
  }

  render() {
    const {
      isOpen,
      renderHeader,
      swipeToDismiss,
      origin,
      backgroundColor,
    } = this.props;

    const {
      isPanning,
      isAnimating,
      openVal,
      target,
    } = this.state;

    const lightboxOpacityStyle = {
      opacity: target.opacity
    };

    let handlers;
    if(swipeToDismiss) {
      handlers = this._panResponder.panHandlers;
    }

    let dragStyle;
    if(isPanning) {
      dragStyle = {
        top: this.state.pan,
      };
      lightboxOpacityStyle.opacity = this.state.pan.interpolate({inputRange: [-WINDOW_HEIGHT, 0, WINDOW_HEIGHT], outputRange: [0, 1, 0]});
    }
    const offsetY = isIOS &&
    (WINDOW_HEIGHT === 812 ||
      WINDOW_WIDTH === 812 ||
      WINDOW_HEIGHT === 896 ||
      WINDOW_WIDTH === 896) ? 20 : 15;
    const openStyle = [styles.open, {
      left:   target.x,
      top:    target.y - offsetY,
      width:  WINDOW_WIDTH,
      height: WINDOW_HEIGHT,
    }];

    const background = (<Animated.View style={[styles.background, { backgroundColor: backgroundColor }, lightboxOpacityStyle]}></Animated.View>);
    const header = (<Animated.View style={[styles.header, lightboxOpacityStyle]}>{(renderHeader ?
      renderHeader(this.close) :
      (
        <TouchableOpacity onPress={this.close} onLongPress={this.close}>
          <Text style={styles.closeButton}>×</Text>
        </TouchableOpacity>
      )
    )}</Animated.View>);
    const content = (
      <Animated.View style={[openStyle, dragStyle]} {...handlers}>
        {this.props.children}
      </Animated.View>
    );

    if (this.props.navigator) {
      return (
        <View>
          {background}
          {content}
          {header}
        </View>
      );
    }

    return (
      <Modal visible={isOpen} transparent={true} onRequestClose={() => this.close()}>
        {background}
        <TouchableHighlight underlayColor={this.props.underlayColor} onPress={this.close} onLongPress={this.close}>
        {content}
        </TouchableHighlight>
        {header}
      </Modal>
    );
  }
}
