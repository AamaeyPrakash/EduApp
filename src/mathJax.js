import React, { Component } from 'react';
import { View, Text } from 'react-native';
import MathJax from 'react-native-mathjax';

const mmlOptions = {
    jax: ['input/MathML'],
};

class MathView extends Component {
  render () {
    return (
      <View style={{flex:1}}>
        <MathJax
          mathJaxOptions={mmlOptions}
          html={'Test <math xmlns="http://www.w3.org/1998/Math/MathML"><msqrt><mn>2</mn><mfrac bevelled="true"><mn>4</mn><mn>7</mn></mfrac></msqrt><mo>+</mo><mfrac><mn>5</mn><mn>8</mn></mfrac></math> this is just a string'}
        />
      </View>
    );
  }
}
export default MathView;