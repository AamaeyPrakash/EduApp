import { View, Text } from 'react-native';
import React from 'react';
import Latex from 'react-native-latex';

const MathLatexTest = () => {
  return (
    <View>
        <Latex style={{
        width: '100%',
        height: 100
        }}>
        {"\\frac{1}{2\\pi}\\int_{-\\infty}^{\\infty}e^{-\\frac{x^2}{2}}dx"}
        </Latex>
    </View>
  )
}

export default MathLatexTest