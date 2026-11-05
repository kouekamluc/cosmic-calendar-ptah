import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

export type LayerKey = 'western' | 'chinese' | 'vedic';
export type Layers = Record<LayerKey, boolean>;
const KEY = 'ptah.layers.v1';
const DEFAULT: Layers = { western: true, chinese: true, vedic: true };

export function useLayers() {
  const [layers, setLayers] = useState<Layers>(DEFAULT);
  useEffect(() => {
    AsyncStorage.getItem(KEY).then(s => { if (s) try { setLayers({ ...DEFAULT, ...JSON.parse(s) }); } catch { /* ignore */ } }).catch(() => {});
  }, []);
  const toggle = useCallback((k: LayerKey) => {
    setLayers(prev => {
      const next = { ...prev, [k]: !prev[k] };
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);
  return { layers, toggle };
}
export type LayersApi = ReturnType<typeof useLayers>;
