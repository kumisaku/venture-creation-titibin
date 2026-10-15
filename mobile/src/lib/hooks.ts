import { useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useRef, useState } from 'react';
import { showAlert } from './alert';
import { api } from './api';

/** Loads `path` whenever the screen gains focus. Pass `null` to skip. */
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pathRef = useRef(path);
  pathRef.current = path;

  const reload = useCallback(async () => {
    if (!pathRef.current) return;
    try {
      setData(await api<T>(pathRef.current));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload, path]),
  );

  return { data, error, loading, reload, setData };
}

export type PickedImage = { dataUrl: string; uri: string; name: string; size: number };

export async function pickImage(): Promise<PickedImage | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    showAlert('Izin dibutuhkan', 'Izinkan akses galeri untuk mengunggah foto.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], base64: true, quality: 0.5 });
  if (result.canceled || !result.assets[0]?.base64) return null;
  const asset = result.assets[0];
  const mime = asset.mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
  return {
    dataUrl: `data:${mime};base64,${asset.base64}`,
    uri: asset.uri,
    name: asset.fileName ?? asset.uri.split('/').pop() ?? 'foto.jpg',
    size: asset.fileSize ?? Math.round((asset.base64!.length * 3) / 4),
  };
}

export function useAsyncAction() {
  const [busy, setBusy] = useState(false);
  const run = useCallback(async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      showAlert('Gagal', (e as Error).message);
    } finally {
      setBusy(false);
    }
  }, []);
  return { busy, run };
}
