import type { RecipeLane, RecipeStep } from 'src/types/recipe-record';

import { useEffect, useState } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { MAIN_LANE_ID } from 'src/types/recipe-record';

import { formatTimeBeforeService } from './recipe-step-time';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  step: RecipeStep | null;
  lanes: RecipeLane[];
  onClose: () => void;
  onUpdate: (stepId: string, patch: Partial<RecipeStep>) => void;
  onRemove?: (stepId: string) => void;
  onSave?: () => void;
};

export function RecipeStepDialog({
  open,
  step,
  lanes,
  onClose,
  onUpdate,
  onRemove,
  onSave,
}: Props) {
  const [draft, setDraft] = useState<RecipeStep | null>(step);

  useEffect(() => {
    if (open && step) setDraft({ ...step });
  }, [open, step]);

  if (!step || !draft) {
    return null;
  }

  const patchDraft = (patch: Partial<RecipeStep>) => {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const handleSave = () => {
    onUpdate(step.id, {
      process: draft.process.trim() || 'Novo processo',
      description: draft.description?.trim() || null,
      time_before_service_minutes: Math.max(0, Number(draft.time_before_service_minutes) || 0),
      duration_minutes: Math.max(1, Number(draft.duration_minutes) || 10),
      lane_id: draft.lane_id || MAIN_LANE_ID,
    });
    onSave?.();
    onClose();
  };

  const handleRemove = () => {
    onRemove?.(step.id);
    onSave?.();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pr: 6 }}>
        Editar processo
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 12, top: 12 }}
          aria-label="Fechar"
        >
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            <Label variant="soft" color="info">
              {formatTimeBeforeService(draft.time_before_service_minutes)}
            </Label>
            <Label variant="soft" color="default">
              {draft.duration_minutes} min
            </Label>
          </Stack>

          <TextField
            label="Processo"
            fullWidth
            autoFocus
            value={draft.process}
            onChange={(e) => patchDraft({ process: e.target.value })}
            placeholder="ex.: reduzir, cortar, montar"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSave();
              }
            }}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              label="Minutos antes do serviço"
              type="number"
              value={draft.time_before_service_minutes}
              onChange={(e) =>
                patchDraft({
                  time_before_service_minutes: Math.max(0, Number(e.target.value) || 0),
                })
              }
              inputProps={{ min: 0, step: 5 }}
              fullWidth
            />
            <TextField
              label="Duração (min)"
              type="number"
              value={draft.duration_minutes}
              onChange={(e) =>
                patchDraft({
                  duration_minutes: Math.max(1, Number(e.target.value) || 10),
                })
              }
              inputProps={{ min: 1, step: 5 }}
              fullWidth
            />
          </Stack>

          {lanes.length > 1 && (
            <TextField
              select
              label="Linha"
              value={draft.lane_id || MAIN_LANE_ID}
              onChange={(e) => patchDraft({ lane_id: e.target.value })}
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
            multiline
            minRows={3}
            value={draft.description ?? ''}
            onChange={(e) => patchDraft({ description: e.target.value })}
            placeholder="Detalhes do preparo, temperatura, ponto…"
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        {onRemove && (
          <Button
            color="error"
            onClick={handleRemove}
            startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
            sx={{ mr: 'auto' }}
          >
            Remover
          </Button>
        )}
        <Button color="inherit" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={handleSave}>
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
