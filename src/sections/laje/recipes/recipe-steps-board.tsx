import type { ReactNode } from 'react';
import type { RecipeLane, RecipeStep } from 'src/types/recipe-record';

import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardContent from '@mui/material/CardContent';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { MAIN_LANE_ID } from 'src/types/recipe-record';

import { formatTimeBeforeService } from './recipe-step-time';

// ----------------------------------------------------------------------

function laneDropId(laneId: string) {
  return `lane:${laneId}`;
}

function stepDragId(stepId: string) {
  return `step:${stepId}`;
}

function parseLaneDropId(id: string | number | undefined | null): string | null {
  if (typeof id !== 'string' || !id.startsWith('lane:')) return null;
  return id.slice(5);
}

function parseStepDragId(id: string | number | undefined | null): string | null {
  if (typeof id !== 'string' || !id.startsWith('step:')) return null;
  return id.slice(5);
}

// ----------------------------------------------------------------------

type StepCardProps = {
  step: RecipeStep;
  lanes: RecipeLane[];
  dragging?: boolean;
  onUpdate: (stepId: string, patch: Partial<RecipeStep>) => void;
  onRemove: (stepId: string) => void;
  onBlurSave?: () => void;
  onMoved?: () => void;
};

function StepCardBody({
  step,
  lanes,
  onUpdate,
  onRemove,
  onBlurSave,
  onMoved,
  dragHandle,
}: StepCardProps & { dragHandle?: ReactNode }) {
  return (
    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
      <Stack spacing={1.25}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
            {dragHandle}
            <Label variant="soft" color="info">
              {formatTimeBeforeService(step.time_before_service_minutes)}
            </Label>
            <Label variant="soft" color="default">
              {step.duration_minutes} min
            </Label>
          </Stack>
          <IconButton color="error" onClick={() => onRemove(step.id)}>
            <Iconify icon="solar:trash-bin-trash-bold" />
          </IconButton>
        </Stack>
        <TextField
          label="Processo"
          fullWidth
          size="small"
          value={step.process}
          onChange={(e) => onUpdate(step.id, { process: e.target.value })}
          onBlur={onBlurSave}
          placeholder="ex.: reduzir, cortar, montar"
        />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <TextField
            label="Min. antes"
            type="number"
            size="small"
            value={step.time_before_service_minutes}
            onChange={(e) =>
              onUpdate(step.id, {
                time_before_service_minutes: Math.max(0, Number(e.target.value) || 0),
              })
            }
            onBlur={onBlurSave}
            inputProps={{ min: 0, step: 5 }}
            sx={{ flex: 1 }}
          />
          <TextField
            label="Duração"
            type="number"
            size="small"
            value={step.duration_minutes}
            onChange={(e) =>
              onUpdate(step.id, {
                duration_minutes: Math.max(1, Number(e.target.value) || 10),
              })
            }
            onBlur={onBlurSave}
            inputProps={{ min: 1, step: 5 }}
            sx={{ flex: 1 }}
          />
        </Stack>
        {lanes.length > 1 && (
          <TextField
            select
            size="small"
            label="Linha"
            value={step.lane_id || MAIN_LANE_ID}
            onChange={(e) => {
              onUpdate(step.id, { lane_id: e.target.value });
              onMoved?.();
            }}
            fullWidth
          >
            {lanes.map((opt) => (
              <MenuItem key={opt.id} value={opt.id}>
                {opt.name}
              </MenuItem>
            ))}
          </TextField>
        )}
        <TextField
          label="Descrição"
          fullWidth
          size="small"
          multiline
          minRows={2}
          value={step.description ?? ''}
          onChange={(e) => onUpdate(step.id, { description: e.target.value })}
          onBlur={onBlurSave}
        />
      </Stack>
    </CardContent>
  );
}

function DraggableStepCard(props: StepCardProps) {
  const { step, dragging } = props;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: stepDragId(step.id),
    data: { type: 'step', stepId: step.id, laneId: step.lane_id || MAIN_LANE_ID },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging || dragging ? 0.35 : 1,
  };

  return (
    <Card ref={setNodeRef} variant="outlined" style={style} sx={{ bgcolor: 'background.paper' }}>
      <StepCardBody
        {...props}
        dragHandle={
          <IconButton
            size="small"
            {...listeners}
            {...attributes}
            sx={{ cursor: 'grab', touchAction: 'none' }}
            title="Arrastar para outra linha"
          >
            <Iconify icon="nimbus:drag-dots" width={18} />
          </IconButton>
        }
      />
    </Card>
  );
}

function LaneColumn({
  lane,
  steps,
  lanes,
  onRename,
  onRemoveLane,
  onAddStep,
  onUpdateStep,
  onRemoveStep,
  onBlurSave,
  onMoved,
}: {
  lane: RecipeLane;
  steps: RecipeStep[];
  lanes: RecipeLane[];
  onRename: (laneId: string, name: string) => void;
  onRemoveLane: (laneId: string) => void;
  onAddStep: (laneId: string) => void;
  onUpdateStep: (stepId: string, patch: Partial<RecipeStep>) => void;
  onRemoveStep: (stepId: string) => void;
  onBlurSave?: () => void;
  onMoved?: () => void;
}) {
  const isMain = lane.id === MAIN_LANE_ID;
  const { setNodeRef, isOver } = useDroppable({
    id: laneDropId(lane.id),
    data: { type: 'lane', laneId: lane.id },
  });

  return (
    <Card
      ref={setNodeRef}
      variant="outlined"
      sx={{
        bgcolor: isOver ? 'action.hover' : 'background.neutral',
        minWidth: 0,
        outline: isOver ? (theme) => `2px solid ${theme.vars.palette.primary.main}` : 'none',
        outlineOffset: -2,
        transition: (theme) => theme.transitions.create(['background-color', 'outline-color']),
      }}
    >
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, minHeight: 180 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            size="small"
            label={isMain ? 'Linha principal' : 'Linha'}
            value={lane.name}
            onChange={(e) => onRename(lane.id, e.target.value)}
            onBlur={onBlurSave}
            fullWidth
          />
          {isMain ? (
            <Label variant="soft" color="primary">
              Principal
            </Label>
          ) : (
            <IconButton
              color="error"
              onClick={() => onRemoveLane(lane.id)}
              title="Remover linha (passos vão para Principal)"
            >
              <Iconify icon="solar:trash-bin-trash-bold" />
            </IconButton>
          )}
        </Stack>

        {steps.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
            Arraste um passo aqui ou adicione abaixo.
          </Typography>
        ) : (
          <Stack spacing={1.25}>
            {steps.map((step) => (
              <DraggableStepCard
                key={step.id}
                step={step}
                lanes={lanes}
                onUpdate={onUpdateStep}
                onRemove={onRemoveStep}
                onBlurSave={onBlurSave}
                onMoved={onMoved}
              />
            ))}
          </Stack>
        )}

        <Button
          fullWidth
          variant="soft"
          color="inherit"
          onClick={() => onAddStep(lane.id)}
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          sx={{
            mt: 'auto',
            py: 1,
            borderStyle: 'dashed',
            borderWidth: 1,
            borderColor: 'divider',
          }}
        >
          Adicionar passo
        </Button>
      </CardContent>
    </Card>
  );
}

// ----------------------------------------------------------------------

type Props = {
  lanes: RecipeLane[];
  steps: RecipeStep[];
  onRenameLane: (laneId: string, name: string) => void;
  onRemoveLane: (laneId: string) => void;
  onAddStep: (laneId: string) => void;
  onUpdateStep: (stepId: string, patch: Partial<RecipeStep>) => void;
  onRemoveStep: (stepId: string) => void;
  onMoveStep: (stepId: string, laneId: string) => void;
  onBlurSave?: () => void;
  onMoved?: () => void;
};

export function RecipeStepsBoard({
  lanes,
  steps,
  onRenameLane,
  onRemoveLane,
  onAddStep,
  onUpdateStep,
  onRemoveStep,
  onMoveStep,
  onBlurSave,
  onMoved,
}: Props) {
  const [activeStepId, setActiveStepId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const stepsByLane = useMemo(() => {
    const map = new Map<string, RecipeStep[]>();
    for (const lane of lanes) map.set(lane.id, []);
    for (const step of steps) {
      const raw = step.lane_id || MAIN_LANE_ID;
      const laneId = map.has(raw) ? raw : MAIN_LANE_ID;
      const list = map.get(laneId) ?? [];
      list.push(step);
      map.set(laneId, list);
    }
    for (const [laneId, list] of map) {
      list.sort((a, b) => b.time_before_service_minutes - a.time_before_service_minutes);
      map.set(laneId, list);
    }
    return map;
  }, [lanes, steps]);

  const activeStep = activeStepId
    ? steps.find((step) => step.id === activeStepId) ?? null
    : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveStepId(parseStepDragId(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const stepId = parseStepDragId(event.active.id);
    setActiveStepId(null);
    if (!stepId) return;

    const over = event.over;
    if (!over) return;

    let targetLaneId = parseLaneDropId(over.id);
    if (!targetLaneId && over.data.current?.type === 'step') {
      targetLaneId = String(over.data.current.laneId || '');
    }
    // Dropping over another step: use that step's lane.
    if (!targetLaneId) {
      const overStepId = parseStepDragId(over.id);
      if (overStepId) {
        const overStep = steps.find((s) => s.id === overStepId);
        targetLaneId = overStep?.lane_id || MAIN_LANE_ID;
      }
    }
    if (!targetLaneId) return;

    const current = steps.find((s) => s.id === stepId);
    const currentLane = current?.lane_id || MAIN_LANE_ID;
    if (currentLane === targetLaneId) return;

    onMoveStep(stepId, targetLaneId);
    onMoved?.();
  };

  const handleDragCancel = () => setActiveStepId(null);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: '1fr',
            md: `repeat(${Math.min(lanes.length, 3)}, minmax(0, 1fr))`,
          },
        }}
      >
        {lanes.map((lane) => (
          <LaneColumn
            key={lane.id}
            lane={lane}
            steps={stepsByLane.get(lane.id) ?? []}
            lanes={lanes}
            onRename={onRenameLane}
            onRemoveLane={onRemoveLane}
            onAddStep={onAddStep}
            onUpdateStep={onUpdateStep}
            onRemoveStep={onRemoveStep}
            onBlurSave={onBlurSave}
            onMoved={onMoved}
          />
        ))}
      </Box>

      <DragOverlay dropAnimation={null}>
        {activeStep ? (
          <Card variant="outlined" sx={{ boxShadow: 8, maxWidth: 360, cursor: 'grabbing' }}>
            <StepCardBody
              step={activeStep}
              lanes={lanes}
              onUpdate={() => undefined}
              onRemove={() => undefined}
              dragHandle={
                <IconButton size="small" sx={{ cursor: 'grabbing' }}>
                  <Iconify icon="nimbus:drag-dots" width={18} />
                </IconButton>
              }
            />
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
