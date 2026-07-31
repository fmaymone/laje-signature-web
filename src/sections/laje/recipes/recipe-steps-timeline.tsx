import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';
import type { RecipeLane, RecipeStep } from 'src/types/recipe-record';

import { useEffect, useMemo, useRef, useState } from 'react';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ButtonGroup from '@mui/material/ButtonGroup';

import { EmptyContent } from 'src/components/empty-content';
import { Iconify } from 'src/components/iconify';

import { MAIN_LANE_ID } from 'src/types/recipe-record';

import { RecipeStepDialog } from './recipe-step-dialog';
import {
  buildAxisTicks,
  formatAxisTick,
  formatTimeBeforeService,
  niceTimelineSpan,
} from './recipe-step-time';

// ----------------------------------------------------------------------

const LANE_GUTTER = 148;
const BAR_HEIGHT = 112;
const LANE_PAD_Y = 14;
const TRACK_MIN_HEIGHT = 140;
const MIN_BAR_PX = 34;
const BASE_TRACK_MIN = 720;
const SNAP_MINUTES = 5;
const MIN_DURATION = 5;

/** px por minuto — zoom da timeline. */
const ZOOM_LEVELS = [0.25, 0.4, 0.6, 0.9, 1.25, 1.8, 2.5, 3.5, 5, 7];

type TimedBar = {
  step: RecipeStep;
  start: number;
  end: number;
  subrow: number;
};

type LaneLayout = {
  lane: RecipeLane;
  bars: TimedBar[];
  subrowCount: number;
};

type DragMode = 'move' | 'resize-start' | 'resize-end';

type DragState = {
  stepId: string;
  mode: DragMode;
  originClientX: number;
  originStart: number;
  originDuration: number;
  currentStart: number;
  currentDuration: number;
  moved: boolean;
};

const LANE_TONES = ['primary', 'secondary', 'info', 'warning', 'success'] as const;

function intervalOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart > bEnd && bStart > aEnd;
}

function snapMinutes(value: number) {
  return Math.round(value / SNAP_MINUTES) * SNAP_MINUTES;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function packBars(steps: RecipeStep[]): { bars: TimedBar[]; subrowCount: number } {
  const sorted = [...steps].sort(
    (a, b) =>
      b.time_before_service_minutes - a.time_before_service_minutes ||
      b.duration_minutes - a.duration_minutes
  );

  const rows: TimedBar[][] = [];

  for (const step of sorted) {
    const start = Math.max(0, Number(step.time_before_service_minutes) || 0);
    const duration = Math.max(1, Number(step.duration_minutes) || 10);
    const end = Math.max(0, start - duration);

    let placed = false;
    for (let r = 0; r < rows.length; r += 1) {
      const conflict = rows[r].some((bar) => intervalOverlap(start, end, bar.start, bar.end));
      if (!conflict) {
        rows[r].push({ step, start, end, subrow: r });
        placed = true;
        break;
      }
    }
    if (!placed) {
      rows.push([{ step, start, end, subrow: rows.length }]);
    }
  }

  return {
    bars: rows.flat(),
    subrowCount: Math.max(1, rows.length),
  };
}

function nearestZoomIndex(pxPerMin: number) {
  let best = 0;
  let bestDiff = Infinity;
  ZOOM_LEVELS.forEach((level, index) => {
    const diff = Math.abs(level - pxPerMin);
    if (diff < bestDiff) {
      best = index;
      bestDiff = diff;
    }
  });
  return best;
}

function defaultZoomIndex(span: number) {
  const target = 900 / Math.max(span, 1);
  return nearestZoomIndex(target);
}

// ----------------------------------------------------------------------

type GhostSlot = {
  laneId: string;
  start: number;
};

type Props = {
  lanes: RecipeLane[];
  steps: RecipeStep[];
  onUpdateStep: (stepId: string, patch: Partial<RecipeStep>) => void;
  onRemoveStep?: (stepId: string) => void;
  onCreateStepAt?: (laneId: string, minutesBeforeService: number) => string | void;
  onCommit?: () => void;
};

export function RecipeStepsTimeline({
  lanes,
  steps,
  onUpdateStep,
  onRemoveStep,
  onCreateStepAt,
  onCommit,
}: Props) {
  const theme = useTheme();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const pxPerMinRef = useRef(1);
  const spanRef = useRef(60);
  const onUpdateRef = useRef(onUpdateStep);
  const onCommitRef = useRef(onCommit);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [zoomIndex, setZoomIndex] = useState(3);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [ghost, setGhost] = useState<GhostSlot | null>(null);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);

  onUpdateRef.current = onUpdateStep;
  onCommitRef.current = onCommit;

  const editingStep = useMemo(
    () => steps.find((step) => step.id === editingStepId) ?? null,
    [steps, editingStepId]
  );

  const span = useMemo(() => {
    const maxStart = steps.reduce(
      (max, step) => Math.max(max, Number(step.time_before_service_minutes) || 0),
      0
    );
    const dragStart = drag?.currentStart ?? 0;
    return niceTimelineSpan(Math.max(maxStart, dragStart, 60));
  }, [steps, drag?.currentStart]);

  useEffect(() => {
    setZoomIndex(defaultZoomIndex(span));
    // Só recalibra quando o span “base” muda bastante — evita resetar zoom ao arrastar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps.length]);

  const pxPerMin = ZOOM_LEVELS[zoomIndex] ?? 1;
  pxPerMinRef.current = pxPerMin;
  spanRef.current = span;
  const trackWidth = Math.max(BASE_TRACK_MIN, Math.round(span * pxPerMin));
  const zoomPercent = Math.round((pxPerMin / 1.25) * 100);

  const ticks = useMemo(() => buildAxisTicks(span), [span]);

  const displaySteps = useMemo(() => {
    if (!drag) return steps;
    return steps.map((step) =>
      step.id === drag.stepId
        ? {
            ...step,
            time_before_service_minutes: drag.currentStart,
            duration_minutes: drag.currentDuration,
          }
        : step
    );
  }, [steps, drag]);

  const layouts = useMemo<LaneLayout[]>(() => {
    const byLane = new Map<string, RecipeStep[]>();
    for (const lane of lanes) byLane.set(lane.id, []);
    for (const step of displaySteps) {
      const raw = step.lane_id || MAIN_LANE_ID;
      const laneId = byLane.has(raw) ? raw : MAIN_LANE_ID;
      byLane.get(laneId)!.push(step);
    }

    return lanes.map((lane) => {
      const packed = packBars(byLane.get(lane.id) ?? []);
      return { lane, bars: packed.bars, subrowCount: packed.subrowCount };
    });
  }, [lanes, displaySteps]);

  const toneOf = (laneIndex: number) => LANE_TONES[laneIndex % LANE_TONES.length];

  const toX = (minutesBefore: number) => ((span - minutesBefore) / span) * trackWidth;

  const barGeometry = (start: number, end: number) => {
    const left = toX(start);
    const natural = toX(end) - toX(start);
    const width = Math.max(natural, MIN_BAR_PX);
    return { left, width };
  };

  useEffect(() => {
    const applyDragDelta = (state: DragState, clientX: number): DragState => {
      const ppm = pxPerMinRef.current || 1;
      const currentSpan = spanRef.current || 60;
      // Direita (+x) = mais perto do serviço = menos minutos antes.
      const deltaMin = snapMinutes(-(clientX - state.originClientX) / ppm);
      const moved = state.moved || Math.abs(clientX - state.originClientX) > 3;

      if (state.mode === 'move') {
        const maxStart = Math.max(currentSpan, state.originStart);
        const nextStart = clamp(
          state.originStart + deltaMin,
          state.originDuration,
          maxStart
        );
        return {
          ...state,
          moved,
          currentStart: nextStart,
          currentDuration: state.originDuration,
        };
      }

      if (state.mode === 'resize-end') {
        const originEnd = state.originStart - state.originDuration;
        const nextEnd = clamp(originEnd + deltaMin, 0, state.originStart - MIN_DURATION);
        return {
          ...state,
          moved,
          currentStart: state.originStart,
          currentDuration: Math.max(MIN_DURATION, state.originStart - nextEnd),
        };
      }

      const originEnd = state.originStart - state.originDuration;
      const maxStart = Math.max(currentSpan, state.originStart);
      const nextStart = clamp(
        state.originStart + deltaMin,
        originEnd + MIN_DURATION,
        maxStart
      );
      return {
        ...state,
        moved,
        currentStart: nextStart,
        currentDuration: Math.max(MIN_DURATION, nextStart - originEnd),
      };
    };

    const onMove = (event: PointerEvent) => {
      const current = dragRef.current;
      if (!current) return;
      const next = applyDragDelta(current, event.clientX);
      dragRef.current = next;
      setDrag(next);
    };

    const onUp = () => {
      const current = dragRef.current;
      if (!current) return;
      dragRef.current = null;
      setDrag(null);

      if (!current.moved) {
        // Clique simples (sem arrastar) → editar no modal.
        setEditingStepId(current.stepId);
        return;
      }

      onUpdateRef.current(current.stepId, {
        time_before_service_minutes: current.currentStart,
        duration_minutes: current.currentDuration,
      });
      onCommitRef.current?.();
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, []);

  const beginDrag = (
    event: ReactPointerEvent,
    step: RecipeStep,
    mode: DragMode
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setGhost(null);
    const start = Math.max(0, Number(step.time_before_service_minutes) || 0);
    const duration = Math.max(MIN_DURATION, Number(step.duration_minutes) || 10);
    const next: DragState = {
      stepId: step.id,
      mode,
      originClientX: event.clientX,
      originStart: start,
      originDuration: duration,
      currentStart: start,
      currentDuration: duration,
      moved: false,
    };
    dragRef.current = next;
    setDrag(next);
    setHoveredId(step.id);
  };

  const minutesFromTrackEvent = (
    event: { clientX: number },
    trackEl: HTMLElement
  ) => {
    const rect = trackEl.getBoundingClientRect();
    const x = clamp(event.clientX - rect.left, 0, rect.width);
    const ratio = rect.width > 0 ? x / rect.width : 0;
    // Esquerda = mais cedo (mais minutos antes); direita = serviço (0).
    return clamp(snapMinutes(span * (1 - ratio)), 0, span);
  };

  const handleTrackMove = (
    event: ReactPointerEvent<HTMLElement>,
    laneId: string
  ) => {
    if (dragRef.current || !onCreateStepAt) return;
    // Só mostra ghost no vazio da linha (não em cima de um processo).
    if (event.target !== event.currentTarget) {
      setGhost(null);
      return;
    }
    const start = minutesFromTrackEvent(event, event.currentTarget);
    setGhost({ laneId, start });
  };

  const handleTrackLeave = () => {
    if (!dragRef.current) setGhost(null);
  };

  const handleTrackClick = (
    event: ReactMouseEvent<HTMLElement>,
    laneId: string
  ) => {
    if (!onCreateStepAt || dragRef.current) return;
    // Só cria se o clique foi no fundo (não em um processo).
    if (event.target !== event.currentTarget) return;
    const start = minutesFromTrackEvent(event, event.currentTarget);
    const duration = 10;
    // Garante que o bloco caiba até o serviço.
    const safeStart = Math.max(start, duration);
    const createdId = onCreateStepAt(laneId, safeStart);
    setGhost(null);
    if (createdId) setEditingStepId(createdId);
  };

  const zoomBy = (delta: number) => {
    setZoomIndex((prev) => Math.max(0, Math.min(ZOOM_LEVELS.length - 1, prev + delta)));
  };

  const fitZoom = () => {
    const el = scrollRef.current;
    const available = el ? Math.max(el.clientWidth - 24, 480) : 900;
    setZoomIndex(nearestZoomIndex(available / Math.max(span, 1)));
  };

  const focusService = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
  };

  if (!lanes.length) {
    return (
      <EmptyContent
        title="Timeline vazia"
        description="Crie uma linha de trabalho no quadro para começar."
        sx={{ py: 6 }}
      />
    );
  }

  return (
    <Box
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        border: (t) => `1px solid ${varAlpha(t.vars.palette.grey['500Channel'], 0.16)}`,
        bgcolor: 'background.paper',
        userSelect: drag ? 'none' : 'auto',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ sm: 'center' }}
        justifyContent="space-between"
        spacing={1.25}
        sx={{
          px: 2,
          py: 1.25,
          borderBottom: (t) => `1px solid ${varAlpha(t.vars.palette.grey['500Channel'], 0.12)}`,
          bgcolor: 'background.neutral',
        }}
      >
        <Stack spacing={0.25}>
          <Typography variant="caption" color="text.secondary">
            Clique no processo para editar · vazio para criar · arraste para mover
          </Typography>
          <Typography variant="caption" color="text.disabled">
            Bordas esticam a duração · snap de {SNAP_MINUTES} min
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <ButtonGroup size="small" variant="outlined">
            <Tooltip title="Diminuir zoom">
              <span>
                <IconButton
                  size="small"
                  onClick={() => zoomBy(-1)}
                  disabled={zoomIndex <= 0}
                  aria-label="Zoom out"
                >
                  <Iconify icon="carbon:zoom-out" width={18} />
                </IconButton>
              </span>
            </Tooltip>
            <Button
              disabled
              sx={{
                px: 1.25,
                minWidth: 64,
                '&.Mui-disabled': { color: 'text.primary', borderColor: 'inherit' },
              }}
            >
              {zoomPercent}%
            </Button>
            <Tooltip title="Aumentar zoom">
              <span>
                <IconButton
                  size="small"
                  onClick={() => zoomBy(1)}
                  disabled={zoomIndex >= ZOOM_LEVELS.length - 1}
                  aria-label="Zoom in"
                >
                  <Iconify icon="carbon:zoom-in" width={18} />
                </IconButton>
              </span>
            </Tooltip>
          </ButtonGroup>

          <Tooltip title="Encaixar na tela">
            <IconButton size="small" onClick={fitZoom} aria-label="Encaixar zoom">
              <Iconify icon="solar:fullscreen-bold" width={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Ir ao serviço">
            <IconButton size="small" onClick={focusService} aria-label="Ir ao serviço">
              <Iconify icon="solar:flag-bold" width={18} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {drag && (
        <Stack
          direction="row"
          spacing={2}
          sx={{
            px: 2,
            py: 0.75,
            bgcolor: (t) => varAlpha(t.vars.palette.primary.mainChannel, 0.08),
            borderBottom: (t) => `1px solid ${varAlpha(t.vars.palette.grey['500Channel'], 0.1)}`,
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 700 }}>
            {formatTimeBeforeService(drag.currentStart)}
          </Typography>
          <Typography variant="caption">Duração {drag.currentDuration} min</Typography>
        </Stack>
      )}

      <Box ref={scrollRef} sx={{ overflowX: 'auto', overflowY: 'hidden' }}>
        <Box sx={{ minWidth: LANE_GUTTER + trackWidth + 16 }}>
          <Stack direction="row" sx={{ pl: `${LANE_GUTTER}px`, pr: 2, pt: 1.5, pb: 0.75 }}>
            <Box sx={{ position: 'relative', width: trackWidth, height: 22 }}>
              {ticks.map((tick) => (
                <Typography
                  key={tick}
                  variant="caption"
                  color={tick === 0 ? 'error.main' : 'text.secondary'}
                  sx={{
                    position: 'absolute',
                    left: toX(tick),
                    transform: tick === 0 ? 'translateX(-100%)' : 'translateX(-50%)',
                    fontWeight: tick === 0 ? 700 : 500,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatAxisTick(tick)}
                </Typography>
              ))}
            </Box>
          </Stack>

          <Stack>
            {layouts.map((layout, laneIndex) => {
              const tone = toneOf(laneIndex);
              const laneHeight = Math.max(
                TRACK_MIN_HEIGHT,
                LANE_PAD_Y * 2 + layout.subrowCount * (BAR_HEIGHT + 8)
              );
              const palette = theme.vars.palette[tone];

              return (
                <Box
                  key={layout.lane.id}
                  sx={{
                    display: 'flex',
                    minHeight: laneHeight,
                    borderTop: (t) =>
                      `1px solid ${varAlpha(t.vars.palette.grey['500Channel'], 0.1)}`,
                    '&:nth-of-type(odd)': {
                      bgcolor: (t) => varAlpha(t.vars.palette.grey['500Channel'], 0.02),
                    },
                  }}
                >
                  <Stack
                    justifyContent="center"
                    sx={{
                      width: LANE_GUTTER,
                      flexShrink: 0,
                      px: 2,
                      py: 1.5,
                      position: 'sticky',
                      left: 0,
                      zIndex: 4,
                      bgcolor: 'background.paper',
                      borderRight: (t) =>
                        `1px solid ${varAlpha(t.vars.palette.grey['500Channel'], 0.12)}`,
                    }}
                  >
                    <Typography variant="subtitle2" noWrap title={layout.lane.name}>
                      {layout.lane.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {layout.bars.length} processo{layout.bars.length === 1 ? '' : 's'}
                    </Typography>
                  </Stack>

                  <Box
                    onPointerMove={(event) => handleTrackMove(event, layout.lane.id)}
                    onPointerLeave={handleTrackLeave}
                    onClick={(event) => handleTrackClick(event, layout.lane.id)}
                    sx={{
                      position: 'relative',
                      width: trackWidth,
                      flexShrink: 0,
                      py: `${LANE_PAD_Y}px`,
                      minHeight: laneHeight,
                      pr: 1,
                      cursor: onCreateStepAt && !drag ? 'cell' : 'default',
                    }}
                  >
                    {ticks.map((tick) => (
                      <Box
                        key={`grid-${layout.lane.id}-${tick}`}
                        sx={{
                          position: 'absolute',
                          top: 0,
                          bottom: 0,
                          left: toX(tick),
                          width: tick === 0 ? 2 : 1,
                          bgcolor:
                            tick === 0
                              ? (t) => varAlpha(t.vars.palette.error.mainChannel, 0.55)
                              : (t) => varAlpha(t.vars.palette.grey['500Channel'], 0.14),
                          zIndex: 0,
                          pointerEvents: 'none',
                        }}
                      />
                    ))}

                    {ghost?.laneId === layout.lane.id && !drag && (
                      <Box
                        sx={{
                          position: 'absolute',
                          left: barGeometry(ghost.start, Math.max(0, ghost.start - 10)).left,
                          width: barGeometry(ghost.start, Math.max(0, ghost.start - 10)).width,
                          top: LANE_PAD_Y,
                          height: BAR_HEIGHT,
                          zIndex: 1,
                          pointerEvents: 'none',
                          borderRadius: 1.5,
                          border: (t) =>
                            `2px dashed ${varAlpha(t.vars.palette.primary.mainChannel, 0.55)}`,
                          bgcolor: (t) => varAlpha(t.vars.palette.primary.mainChannel, 0.08),
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 0.5,
                        }}
                      >
                        <Iconify icon="solar:add-circle-bold" width={18} sx={{ color: 'primary.main' }} />
                        <Typography
                          variant="caption"
                          sx={{
                            writingMode: 'vertical-rl',
                            transform: 'rotate(180deg)',
                            fontWeight: 700,
                            color: 'primary.main',
                          }}
                        >
                          Novo
                        </Typography>
                        <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700 }}>
                          {formatAxisTick(ghost.start)}
                        </Typography>
                      </Box>
                    )}

                    {layout.bars.map((bar) => {
                      const { left, width } = barGeometry(bar.start, bar.end);
                      const top = bar.subrow * (BAR_HEIGHT + 8);
                      const active = hoveredId === bar.step.id || drag?.stepId === bar.step.id;
                      const label = bar.step.process?.trim() || 'Sem nome';
                      const liveDuration =
                        drag?.stepId === bar.step.id
                          ? drag.currentDuration
                          : bar.step.duration_minutes;

                      const body = (
                        <Box
                          role="button"
                          tabIndex={0}
                          onMouseEnter={() => setHoveredId(bar.step.id)}
                          onMouseLeave={() => {
                            if (!dragRef.current) setHoveredId(null);
                          }}
                          onPointerDown={(event) => beginDrag(event, bar.step, 'move')}
                          onClick={(event) => event.stopPropagation()}
                          aria-label={`${label}, ${formatTimeBeforeService(bar.start)}, ${liveDuration} minutos. Clique para editar, arraste para mover.`}
                          sx={{
                            position: 'absolute',
                            left,
                            width,
                            top,
                            height: BAR_HEIGHT,
                            zIndex: active ? 3 : 1,
                            p: 0.75,
                            cursor: drag?.stepId === bar.step.id ? 'grabbing' : 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 0.5,
                            borderRadius: 1.5,
                            color: palette.darker,
                            bgcolor: varAlpha(palette.mainChannel, active ? 0.34 : 0.2),
                            boxShadow: active
                              ? `0 0 0 2px ${varAlpha(palette.mainChannel, 0.5)}`
                              : `inset 0 3px 0 ${palette.main}`,
                            touchAction: 'none',
                            transition: drag ? 'none' : 'box-shadow 160ms ease, background-color 160ms ease',
                            '&:hover': {
                              bgcolor: varAlpha(palette.mainChannel, 0.36),
                            },
                            '&:focus-visible': {
                              outline: `2px solid ${palette.main}`,
                              outlineOffset: 2,
                            },
                          }}
                        >
                          {/* Handle início (esquerda / longe do serviço) */}
                          <Box
                            onPointerDown={(event) => beginDrag(event, bar.step, 'resize-start')}
                            title="Esticar início"
                            sx={{
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              bottom: 0,
                              width: 10,
                              cursor: 'ew-resize',
                              borderRadius: '6px 0 0 6px',
                              zIndex: 2,
                              '&:hover': {
                                bgcolor: varAlpha(palette.mainChannel, 0.35),
                              },
                            }}
                          />

                          {/* Handle fim (direita / perto do serviço) */}
                          <Box
                            onPointerDown={(event) => beginDrag(event, bar.step, 'resize-end')}
                            title="Esticar duração"
                            sx={{
                              position: 'absolute',
                              right: 0,
                              top: 0,
                              bottom: 0,
                              width: 10,
                              cursor: 'ew-resize',
                              borderRadius: '0 6px 6px 0',
                              zIndex: 2,
                              '&:hover': {
                                bgcolor: varAlpha(palette.mainChannel, 0.35),
                              },
                            }}
                          />

                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 800,
                              lineHeight: 1,
                              flexShrink: 0,
                              px: 0.5,
                              py: 0.25,
                              borderRadius: 0.75,
                              bgcolor: varAlpha(palette.mainChannel, 0.18),
                              pointerEvents: 'none',
                            }}
                          >
                            {liveDuration}’
                          </Typography>

                          <Box
                            sx={{
                              flex: 1,
                              minHeight: 0,
                              width: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              pointerEvents: 'none',
                            }}
                          >
                            <Typography
                              component="span"
                              sx={{
                                writingMode: 'vertical-rl',
                                textOrientation: 'mixed',
                                transform: 'rotate(180deg)',
                                fontSize: 12,
                                fontWeight: 700,
                                letterSpacing: 0.4,
                                lineHeight: 1.15,
                                maxHeight: '100%',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {label}
                            </Typography>
                          </Box>
                        </Box>
                      );

                      if (drag) return <Box key={bar.step.id}>{body}</Box>;

                      return (
                        <Tooltip
                          key={bar.step.id}
                          arrow
                          placement="top"
                          enterDelay={200}
                          title={
                            <Stack spacing={0.5} sx={{ py: 0.5, maxWidth: 260 }}>
                              <Typography variant="subtitle2">{label}</Typography>
                              <Typography variant="caption">
                                Início: {formatTimeBeforeService(bar.start)}
                              </Typography>
                              <Typography variant="caption">
                                Duração: {liveDuration} min
                              </Typography>
                              <Typography variant="caption">
                                Linha: {layout.lane.name}
                              </Typography>
                              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                Clique edita · arraste move · bordas esticam
                              </Typography>
                            </Stack>
                          }
                        >
                          {body}
                        </Tooltip>
                      );
                    })}

                    {!layout.bars.length && (
                      <Typography
                        variant="caption"
                        color="text.disabled"
                        sx={{
                          position: 'absolute',
                          left: 16,
                          top: '50%',
                          transform: 'translateY(-50%)',
                        }}
                      >
                        Sem processos nesta linha
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Stack>

          <Stack
            direction="row"
            alignItems="center"
            sx={{
              pl: `${LANE_GUTTER}px`,
              pr: 2,
              py: 1.25,
              borderTop: (t) => `1px solid ${varAlpha(t.vars.palette.grey['500Channel'], 0.12)}`,
              bgcolor: (t) => varAlpha(t.vars.palette.error.mainChannel, 0.04),
            }}
          >
            <Box sx={{ position: 'relative', width: trackWidth, height: 8 }}>
              <Box
                sx={{
                  position: 'absolute',
                  right: 0,
                  top: '50%',
                  transform: 'translate(50%, -50%)',
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: 'error.main',
                  boxShadow: (t) => `0 0 0 4px ${varAlpha(t.vars.palette.error.mainChannel, 0.2)}`,
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  left: 0,
                  right: 5,
                  top: '50%',
                  height: 2,
                  borderRadius: 1,
                  transform: 'translateY(-50%)',
                  background: (t) =>
                    `linear-gradient(90deg, ${varAlpha(t.vars.palette.grey['500Channel'], 0.08)}, ${varAlpha(t.vars.palette.error.mainChannel, 0.55)})`,
                }}
              />
            </Box>
          </Stack>
        </Box>
      </Box>

      <RecipeStepDialog
        open={Boolean(editingStepId && editingStep)}
        step={editingStep}
        lanes={lanes}
        onClose={() => setEditingStepId(null)}
        onUpdate={onUpdateStep}
        onRemove={onRemoveStep}
        onSave={onCommit}
      />
    </Box>
  );
}
