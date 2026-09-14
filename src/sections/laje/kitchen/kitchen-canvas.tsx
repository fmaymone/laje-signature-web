import type { KitchenLayout, KitchenStation, KitchenStationType } from 'src/types/kitchen-layout';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import {
  createKitchenLayout,
  updateKitchenLayout,
  useGetKitchenLayout,
} from 'src/actions/kitchen-layouts';

import { DEFAULT_KITCHEN_CANVAS } from 'src/types/kitchen-layout';

import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';

import { KitchenFloorPlan } from './kitchen-floor-plan';
import { StationPalette } from './station-palette';
import { STATION_TYPES, lajeKitchenTemplate, newStationId, stationTypeMeta } from './station-types';

// ----------------------------------------------------------------------

function errorMessage(err: unknown, fallback: string) {
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'detail' in err) {
    return String((err as { detail: unknown }).detail);
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

function nextStationPosition(count: number): { x: number; y: number } {
  const col = count % 3;
  const row = Math.floor(count / 3);
  return { x: 40 + col * 300, y: 240 + row * 180 };
}

type Props = {
  layoutId?: string | null;
  initialName?: string;
  onCreated?: (layout: KitchenLayout) => void;
  onSaved?: (layout: KitchenLayout) => void;
};

export function KitchenCanvas({
  layoutId: layoutIdProp = null,
  initialName = 'Cozinha Laje',
  onCreated,
  onSaved,
}: Props) {
  const { layout, layoutLoading, layoutError, mutateLayout } = useGetKitchenLayout(layoutIdProp);

  const [layoutId, setLayoutId] = useState<string | null>(layoutIdProp);
  const [name, setName] = useState(initialName);
  const [stations, setStations] = useState<KitchenStation[]>(() =>
    layoutIdProp ? [] : lajeKitchenTemplate()
  );
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(!layoutIdProp);
  const [hydrated, setHydrated] = useState(!layoutIdProp);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedIdRef = useRef<string | null>(null);

  const markDirty = useCallback(() => setDirty(true), []);

  useEffect(() => {
    setLayoutId(layoutIdProp);
    if (!layoutIdProp) {
      setName(initialName);
      setStations(lajeKitchenTemplate());
      setDirty(true);
      setHydrated(true);
      loadedIdRef.current = null;
      setSelectedId(null);
    }
  }, [initialName, layoutIdProp]);

  useEffect(() => {
    if (!layout) return;
    if (loadedIdRef.current === layout.id) return;
    loadedIdRef.current = layout.id;
    setLayoutId(layout.id);
    setName(layout.name);
    setStations(layout.stations ?? []);
    setDirty(false);
    setHydrated(true);
  }, [layout]);

  const selected = useMemo(
    () => stations.find((station) => station.id === selectedId) ?? null,
    [selectedId, stations]
  );

  const patchStations = useCallback(
    (next: KitchenStation[] | ((prev: KitchenStation[]) => KitchenStation[])) => {
      setStations((prev) => (typeof next === 'function' ? next(prev) : next));
      markDirty();
    },
    [markDirty]
  );

  const handleAddType = (type: KitchenStationType) => {
    const meta = stationTypeMeta(type);
    const position = nextStationPosition(stations.length);
    const count = stations.filter((station) => station.type === type).length;
    patchStations((prev) => [
      ...prev,
      {
        id: newStationId(),
        type,
        name: count === 0 ? meta.label : `${meta.label} ${count + 1}`,
        x: position.x,
        y: position.y,
        width: meta.defaultWidth,
        height: meta.defaultHeight,
        color: meta.color,
      },
    ]);
  };

  const persist = useCallback(async () => {
    const payload = {
      name: name.trim() || 'Cozinha',
      canvas: DEFAULT_KITCHEN_CANVAS,
      stations,
    };

    setSaving(true);
    try {
      if (layoutId) {
        const updated = await updateKitchenLayout(layoutId, payload);
        setDirty(false);
        await mutateLayout();
        onSaved?.(updated);
        return updated;
      }
      const created = await createKitchenLayout(payload);
      setLayoutId(created.id);
      loadedIdRef.current = created.id;
      setDirty(false);
      toast.success('Planta criada');
      onCreated?.(created);
      return created;
    } catch (err) {
      toast.error(errorMessage(err, 'Falha ao salvar planta'));
      return null;
    } finally {
      setSaving(false);
    }
  }, [layoutId, mutateLayout, name, onCreated, onSaved, stations]);

  useEffect(() => {
    if (!dirty || !layoutId || !hydrated) return undefined;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void persist();
    }, 900);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [dirty, hydrated, layoutId, persist]);

  if (layoutIdProp && layoutLoading && !hydrated) {
    return (
      <Card>
        <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
          <CircularProgress />
        </Stack>
      </Card>
    );
  }

  if (layoutIdProp && layoutError && !hydrated) {
    return (
      <Alert severity="error">
        Não foi possível carregar esta planta. Verifique se ela existe e se você está logado.
      </Alert>
    );
  }

  return (
    <Card sx={{ overflow: 'hidden' }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        alignItems={{ sm: 'center' }}
        justifyContent="space-between"
        sx={{ px: 2, py: 1.5 }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap sx={{ flex: 1 }}>
          <TextField
            size="small"
            label="Nome da planta"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              markDirty();
            }}
            sx={{ minWidth: 220, flex: 1, maxWidth: 420 }}
          />
          {dirty && (
            <Typography variant="caption" color="warning.main">
              alterações não salvas
            </Typography>
          )}
          {!dirty && layoutId && (
            <Typography variant="caption" color="text.secondary">
              salvo
            </Typography>
          )}
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Button
            size="small"
            color="inherit"
            variant="outlined"
            onClick={() => {
              patchStations(lajeKitchenTemplate());
              setSelectedId(null);
            }}
            startIcon={<Iconify icon="solar:restart-bold" />}
          >
            Planta Laje
          </Button>
          <Button
            size="small"
            variant="contained"
            disabled={saving || (!dirty && !!layoutId)}
            onClick={() => void persist()}
            startIcon={
              saving ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <Iconify icon="solar:diskette-bold" />
              )
            }
          >
            {layoutId ? 'Salvar' : 'Criar planta'}
          </Button>
        </Stack>
      </Stack>

      <Divider />

      <Alert severity="info" sx={{ borderRadius: 0 }}>
        Arraste as estações no chão da cozinha. Redimensione pelas bordas. Delete com
        Backspace/Delete.
      </Alert>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '280px 1fr' },
          height: { xs: 640, md: 680 },
        }}
      >
        <Box
          sx={{
            borderRight: (theme) => ({ md: `1px solid ${theme.vars.palette.divider}` }),
            borderBottom: (theme) => ({ xs: `1px solid ${theme.vars.palette.divider}`, md: 'none' }),
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ flex: 1, minHeight: 0, maxHeight: { xs: 220, md: 'none' } }}>
            <StationPalette onAdd={handleAddType} />
          </Box>

          {selected ? (
            <>
              <Divider />
              <Stack spacing={1.25} sx={{ p: 2 }}>
                <Typography variant="subtitle2">Estação selecionada</Typography>
                <TextField
                  size="small"
                  label="Nome"
                  value={selected.name}
                  onChange={(e) => {
                    const nextName = e.target.value;
                    patchStations((prev) =>
                      prev.map((station) =>
                        station.id === selected.id ? { ...station, name: nextName } : station
                      )
                    );
                  }}
                />
                <TextField
                  size="small"
                  select
                  label="Tipo"
                  value={selected.type}
                  onChange={(e) => {
                    const type = e.target.value as KitchenStationType;
                    const meta = stationTypeMeta(type);
                    patchStations((prev) =>
                      prev.map((station) =>
                        station.id === selected.id
                          ? { ...station, type, color: meta.color }
                          : station
                      )
                    );
                  }}
                >
                  {STATION_TYPES.map((item) => (
                    <MenuItem key={item.type} value={item.type}>
                      {item.label}
                    </MenuItem>
                  ))}
                </TextField>
                <Button
                  size="small"
                  color="error"
                  onClick={() => {
                    patchStations((prev) => prev.filter((station) => station.id !== selected.id));
                    setSelectedId(null);
                  }}
                  startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                >
                  Remover
                </Button>
              </Stack>
            </>
          ) : null}
        </Box>

        <Box sx={{ position: 'relative', minHeight: 0, bgcolor: 'background.neutral' }}>
          <KitchenFloorPlan
            stations={stations}
            readOnly={false}
            emptyHint="Adicione estações pela lista à esquerda — ou use a planta Laje."
            onSelectStation={setSelectedId}
            onStationsChange={(next) => {
              setStations(next);
              markDirty();
            }}
          />
        </Box>
      </Box>
    </Card>
  );
}
