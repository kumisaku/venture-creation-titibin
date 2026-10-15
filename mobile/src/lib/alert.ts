import { Alert, Platform, type AlertButton } from 'react-native';

// React Native's Alert is a no-op on web, so fall back to the browser dialogs there.
export function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }
  const text = message ? `${title}\n\n${message}` : title;
  const actions = (buttons ?? []).filter((b) => b.style !== 'cancel');
  if (actions.length <= 1 && (buttons ?? []).length <= 1) {
    window.alert(text);
    actions[0]?.onPress?.();
  } else if (actions.length === 1) {
    if (window.confirm(text)) actions[0]!.onPress?.();
  } else {
    const list = actions.map((b, i) => `${i + 1}. ${b.text}`).join('\n');
    const choice = Number(window.prompt(`${text}\n\n${list}\n\nKetik nomor pilihan:`));
    actions[choice - 1]?.onPress?.();
  }
}
