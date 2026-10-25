import { Alert, Linking } from 'react-native';

export async function openLink(url) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert("Couldn't open the link", url);
  }
}
