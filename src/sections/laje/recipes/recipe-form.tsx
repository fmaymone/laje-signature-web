import type { FlavorBlock } from 'src/types/library';
import type {
  RecipeIngredientLine,
  RecipeLane,
  RecipeRecord,
  RecipeStep,
} from 'src/types/recipe-record';

import { MAIN_LANE_ID, defaultLanes } from 'src/types/recipe-record';

import { useEffect, useRef, useState } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';

import { RouterLink } from 'src/routes/components';
import { paths } from 'src/routes/paths';

import { useGetBlocks } from 'src/actions/blocks';
import { useGetCompositionGraphs } from 'src/actions/compose-graph';
import { createRecipeRecord, updateRecipeRecord } from 'src/actions/recipe-records';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomTabs } from 'src/components/custom-tabs';

import { BlockMultiSelect } from '../blocks/block-multi-select';
import { RecipeIngredientsEditor } from '../ingredients/recipe-ingredients-editor';
import { RecipeStepsBoard } from './recipe-steps-board';
import { RecipeStepsTimeline } from './recipe-steps-timeline';
import { formatTimeBeforeService } from './recipe-step-time';

// ----------------------------------------------------------------------

const AUTOSAVE_DEBOUNCE_MS = 650;

type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

function errorMessage(err: unknown) {
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'detail' in err) {
    return String((err as { detail: unknown }).detail);
  }
  if (err instanceof Error) return err.message;
  return 'Falha ao salvar receita';
}

function newStepId() {
  return `step_${Math.random().toString(36).slice(2, 10)}`;
}

export { formatTimeBeforeService };

type StepsView = 'board' | 'timeline';

type FormState = {
  title: string;
  notes: string;
  composition_id: string;
  servings: number;
  blocks: FlavorBlock[];
  ingredients: RecipeIngredientLine[];
  lanes: RecipeLane[];
  steps: RecipeStep[];
};

function normalizeLanes(lanes?: RecipeLane[] | null): RecipeLane[] {
  const source = lanes?.length ? lanes : defaultLanes();
  const seen = new Set<string>();
  const result: RecipeLane[] = [];
  let hasMain = false;
  for (const lane of source) {
    const id = (lane.id || '').trim();
    const name = (lane.name || '').trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    if (id === MAIN_LANE_ID) {
      hasMain = true;
      result.unshift({ id: MAIN_LANE_ID, name: name || 'Principal' });
    } else {
      result.push({ id, name: name || id });
    }
  }
  if (!hasMain) result.unshift({ id: MAIN_LANE_ID, name: 'Principal' });
  return result;
}

function normalizeStep(step: RecipeStep): RecipeStep {
  return {
    ...step,
    time_before_service_minutes: Math.max(0, Number(step.time_before_service_minutes) || 0),
    duration_minutes: Math.max(1, Number(step.duration_minutes) || 10),
    lane_id: step.lane_id?.trim() || MAIN_LANE_ID,
  };
}

function toForm(recipe: RecipeRecord | null | undefined, blocks: FlavorBlock[]): FormState {
  const byId = new Map(blocks.map((b) => [b.id, b]));
  return {
    title: recipe?.title ?? '',
    notes: recipe?.notes ?? '',
    composition_id: recipe?.composition_id ?? '',
    servings: recipe?.servings ?? 4,
    blocks: (recipe?.block_ids ?? []).map((id) => byId.get(id)).filter(Boolean) as FlavorBlock[],
    ingredients: [...(recipe?.ingredients ?? [])],
    lanes: normalizeLanes(recipe?.lanes),
    steps: (recipe?.steps ?? []).map(normalizeStep),
  };
}

function serializePayload(form: FormState) {
  const lanes = normalizeLanes(form.lanes);
  const laneIds = new Set(lanes.map((lane) => lane.id));
  const steps = form.steps
    .map((step) => {
      const lane_id = step.lane_id?.trim() || MAIN_LANE_ID;
      if (!laneIds.has(lane_id) && lane_id !== MAIN_LANE_ID) {
        lanes.push({ id: lane_id, name: `Linha ${lanes.length + 1}` });
        laneIds.add(lane_id);
      }
      return {
        id: step.id,
        process: step.process.trim(),
        description: step.description?.trim() || null,
        time_before_service_minutes: Math.max(0, Number(step.time_before_service_minutes) || 0),
        duration_minutes: Math.max(1, Number(step.duration_minutes) || 10),
        lane_id: laneIds.has(lane_id) ? lane_id : MAIN_LANE_ID,
      };
    })
    .filter((step) => step.process);

  return {
    title: form.title.trim() || 'Nova receita',
    notes: form.notes.trim() || null,
    composition_id: form.composition_id || null,
    servings: Math.max(1, Number(form.servings) || 4),
    block_ids: form.blocks.map((b) => b.id),
    ingredients: form.ingredients.map((line) => ({
      ingredient_id: line.ingredient_id,
      quantity: Math.max(0, Number(line.quantity) || 0),
      unit: line.unit || 'g',
      notes: line.notes ?? null,
    })),
    lanes,
    steps,
  };
}

function fingerprint(form: FormState) {
  return JSON.stringify(serializePayload(form));
}

type Props = {
  mode: 'create' | 'edit';
  recipe?: RecipeRecord | null;
  loading?: boolean;
  onSaved: (recipe: RecipeRecord) => void;
};

export function RecipeForm({ mode, recipe, loading, onSaved }: Props) {
  const { blocks } = useGetBlocks();
  const { graphs } = useGetCompositionGraphs();

  const [form, setForm] = useState<FormState>(() => toForm(recipe, []));
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [stepsView, setStepsView] = useState<StepsView>('board');
  const [recipeId, setRecipeId] = useState<string | null>(recipe?.id ?? null);
  const [latestRecipe, setLatestRecipe] = useState<RecipeRecord | null>(recipe ?? null);

  const formRef = useRef(form);
  const recipeIdRef = useRef(recipeId);
  const latestRecipeRef = useRef(latestRecipe);
  const lastSavedFpRef = useRef<string>(recipe ? fingerprint(toForm(recipe, [])) : '');
  const saveInFlightRef = useRef(false);
  const pendingSaveRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedRecipeIdRef = useRef<string | null>(recipe?.id ?? null);
  const creatingRef = useRef(false);
  const onSavedRef = useRef(onSaved);

  formRef.current = form;
  recipeIdRef.current = recipeId;
  latestRecipeRef.current = latestRecipe;
  onSavedRef.current = onSaved;

  // Hidrata só quando a receita muda de id.
  useEffect(() => {
    if (!recipe?.id) return;
    if (hydratedRecipeIdRef.current === recipe.id) return;
    hydratedRecipeIdRef.current = recipe.id;
    const next = toForm(recipe, blocks);
    setForm(next);
    formRef.current = next;
    setRecipeId(recipe.id);
    setLatestRecipe(recipe);
    lastSavedFpRef.current = fingerprint(next);
    setStatus('idle');
  }, [recipe, blocks]);

  // Completa chips de blocos quando o catálogo chegar, sem resetar edits.
  useEffect(() => {
    if (!recipe?.id || !blocks.length) return;
    if (hydratedRecipeIdRef.current !== recipe.id) return;
    setForm((prev) => {
      if (prev.blocks.length || !recipe.block_ids?.length) return prev;
      const byId = new Map(blocks.map((b) => [b.id, b]));
      const nextBlocks = recipe.block_ids
        .map((id) => byId.get(id))
        .filter(Boolean) as FlavorBlock[];
      if (!nextBlocks.length) return prev;
      const next = { ...prev, blocks: nextBlocks };
      formRef.current = next;
      lastSavedFpRef.current = fingerprint(next);
      return next;
    });
  }, [blocks, recipe]);

  const persist = async (reason: 'debounce' | 'blur' | 'immediate' | 'leave') => {
    const current = formRef.current;
    const fp = fingerprint(current);
    if (fp === lastSavedFpRef.current) {
      if (status === 'dirty') setStatus('saved');
      return;
    }

    // Em create, espera ter algum conteúdo útil (evita spam de receitas vazias).
    const hasContent =
      Boolean(current.title.trim()) ||
      Boolean(current.notes.trim()) ||
      Boolean(current.composition_id) ||
      current.blocks.length > 0 ||
      current.ingredients.length > 0 ||
      current.steps.some((s) => s.process.trim());

    if (!recipeIdRef.current && !hasContent) {
      return;
    }

    if (saveInFlightRef.current) {
      pendingSaveRef.current = true;
      return;
    }

    saveInFlightRef.current = true;
    setStatus('saving');
    const payload = serializePayload(current);

    try {
      let saved: RecipeRecord;
      if (!recipeIdRef.current) {
        if (creatingRef.current) {
          pendingSaveRef.current = true;
          saveInFlightRef.current = false;
          return;
        }
        creatingRef.current = true;
        saved = await createRecipeRecord(payload);
        creatingRef.current = false;
        setRecipeId(saved.id);
        recipeIdRef.current = saved.id;
        hydratedRecipeIdRef.current = saved.id;
        setLatestRecipe(saved);
        lastSavedFpRef.current = JSON.stringify(payload);
        onSavedRef.current(saved);
      } else {
        saved = await updateRecipeRecord(recipeIdRef.current, payload, {
          previous: latestRecipeRef.current,
        });
        setLatestRecipe(saved);
        lastSavedFpRef.current = JSON.stringify(payload);
      }

      setStatus('saved');
      if (savedResetRef.current) clearTimeout(savedResetRef.current);
      savedResetRef.current = setTimeout(() => {
        setStatus((prev) => (prev === 'saved' ? 'idle' : prev));
      }, 1800);
    } catch (err) {
      creatingRef.current = false;
      setStatus('error');
      if (reason !== 'debounce') {
        toast.error(errorMessage(err));
      }
    } finally {
      saveInFlightRef.current = false;
      if (pendingSaveRef.current) {
        pendingSaveRef.current = false;
        void persist(reason);
      }
    }
  };

  const scheduleAutosave = () => {
    setStatus((prev) => (prev === 'saving' ? prev : 'dirty'));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void persist('debounce');
    }, AUTOSAVE_DEBOUNCE_MS);
  };

  const flushAutosave = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    void persist('blur');
  };

  const patchForm = (updater: (prev: FormState) => FormState) => {
    setForm((prev) => {
      const next = updater(prev);
      formRef.current = next;
      return next;
    });
    scheduleAutosave();
  };

  // Flush ao sair da página / esconder aba.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') {
        void persist('leave');
      }
    };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (fingerprint(formRef.current) !== lastSavedFpRef.current) {
        void persist('leave');
        event.preventDefault();
        event.returnValue = '';
      }
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('beforeunload', onBeforeUnload);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (savedResetRef.current) clearTimeout(savedResetRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateStep = (stepId: string, patch: Partial<RecipeStep>) => {
    patchForm((prev) => ({
      ...prev,
      steps: prev.steps.map((step) => (step.id === stepId ? { ...step, ...patch } : step)),
    }));
  };

  const addStep = (laneId: string = MAIN_LANE_ID, atMinutesBeforeService?: number) => {
    const id = newStepId();
    patchForm((prev) => {
      const laneSteps = prev.steps.filter(
        (step) => (step.lane_id || MAIN_LANE_ID) === laneId
      );
      // Sequência por linha, ou horário explícito (clique na timeline).
      let nextMinutes = 20;
      if (typeof atMinutesBeforeService === 'number') {
        nextMinutes = Math.max(0, atMinutesBeforeService);
      } else if (laneSteps.length) {
        const previous = laneSteps.reduce((best, step) =>
          step.time_before_service_minutes < best.time_before_service_minutes ? step : best
        );
        nextMinutes = Math.max(
          0,
          previous.time_before_service_minutes - previous.duration_minutes
        );
      }

      return {
        ...prev,
        steps: [
          ...prev.steps,
          {
            id,
            process: typeof atMinutesBeforeService === 'number' ? 'Novo processo' : '',
            description: '',
            time_before_service_minutes: nextMinutes,
            duration_minutes: 10,
            lane_id: laneId,
          },
        ],
      };
    });
    return id;
  };

  const removeStep = (stepId: string) => {
    patchForm((prev) => ({
      ...prev,
      steps: prev.steps.filter((step) => step.id !== stepId),
    }));
  };

  const addLane = () => {
    patchForm((prev) => {
      const n = prev.lanes.length + 1;
      const id = `lane_${Math.random().toString(36).slice(2, 8)}`;
      return {
        ...prev,
        lanes: [...normalizeLanes(prev.lanes), { id, name: `Linha ${n}` }],
      };
    });
  };

  const renameLane = (laneId: string, name: string) => {
    patchForm((prev) => ({
      ...prev,
      lanes: prev.lanes.map((lane) =>
        lane.id === laneId ? { ...lane, name: name.trim() || lane.name } : lane
      ),
    }));
  };

  const removeLane = (laneId: string) => {
    if (laneId === MAIN_LANE_ID) return;
    patchForm((prev) => ({
      ...prev,
      lanes: prev.lanes.filter((lane) => lane.id !== laneId),
      steps: prev.steps.map((step) =>
        step.lane_id === laneId ? { ...step, lane_id: MAIN_LANE_ID } : step
      ),
    }));
  };

  const sortSteps = () => {
    patchForm((prev) => {
      const laneOrder = new Map(prev.lanes.map((lane, index) => [lane.id, index]));
      return {
        ...prev,
        steps: [...prev.steps].sort((a, b) => {
          const laneA = laneOrder.get(a.lane_id || MAIN_LANE_ID) ?? 999;
          const laneB = laneOrder.get(b.lane_id || MAIN_LANE_ID) ?? 999;
          if (laneA !== laneB) return laneA - laneB;
          return b.time_before_service_minutes - a.time_before_service_minutes;
        }),
      };
    });
  };

  if (loading) {
    return (
      <Card>
        <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
          <CircularProgress />
        </Stack>
      </Card>
    );
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={1}>
        <SaveStatusLabel status={status} />
      </Stack>

      <Card>
        <CardContent>
          <Stack spacing={2.5}>
            <Typography variant="h6">Identidade</Typography>
            <TextField
              label="Título"
              fullWidth
              value={form.title}
              onChange={(e) => patchForm((prev) => ({ ...prev, title: e.target.value }))}
              onBlur={flushAutosave}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                label="Porções (pessoas)"
                type="number"
                value={form.servings}
                onChange={(e) =>
                  patchForm((prev) => ({
                    ...prev,
                    servings: Math.max(1, Number(e.target.value) || 1),
                  }))
                }
                onBlur={flushAutosave}
                inputProps={{ min: 1, max: 200 }}
                sx={{ maxWidth: { sm: 200 } }}
              />
              <TextField
                label="Notas"
                fullWidth
                multiline
                minRows={2}
                value={form.notes}
                onChange={(e) => patchForm((prev) => ({ ...prev, notes: e.target.value }))}
                onBlur={flushAutosave}
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
              <TextField
                select
                fullWidth
                label="Composição (opcional)"
                value={form.composition_id}
                onChange={(e) => {
                  patchForm((prev) => ({ ...prev, composition_id: e.target.value }));
                  // Select não tem blur confiável após change — salva na hora.
                  setTimeout(() => void persist('immediate'), 0);
                }}
                onBlur={flushAutosave}
              >
                <MenuItem value="">Nenhuma</MenuItem>
                {graphs.map((graph) => (
                  <MenuItem key={graph.id} value={graph.id}>
                    {graph.title}
                  </MenuItem>
                ))}
              </TextField>
              {form.composition_id && (
                <Button
                  component={RouterLink}
                  href={paths.dashboard.composition(form.composition_id)}
                  variant="soft"
                  startIcon={<Iconify icon="solar:widget-5-bold" />}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Abrir
                </Button>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6">Blocos de sabor</Typography>
            <BlockMultiSelect
              value={form.blocks}
              onChange={(next) => {
                patchForm((prev) => ({ ...prev, blocks: next }));
                setTimeout(() => void persist('immediate'), 0);
              }}
            />
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="h6">Ingredientes</Typography>
              <Typography variant="body2" color="text.secondary">
                Quantidades para {form.servings} {form.servings === 1 ? 'pessoa' : 'pessoas'}.
                Autosave ativo.
              </Typography>
            </Box>
            <RecipeIngredientsEditor
              value={form.ingredients}
              onChange={(next) => patchForm((prev) => ({ ...prev, ingredients: next }))}
              onBlurSave={flushAutosave}
            />
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ sm: 'center' }}
              spacing={1.5}
            >
              <Box>
                <Typography variant="h6">Passos (linhas de trabalho)</Typography>
                <Typography variant="body2" color="text.secondary">
                  {stepsView === 'timeline'
                    ? 'Corrida até o serviço: da esquerda (preparo) à direita (entrega).'
                    : 'Edite processos por linha. Arraste entre linhas quando precisar.'}
                </Typography>
              </Box>
              {stepsView === 'board' && (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button
                    size="small"
                    variant="soft"
                    onClick={sortSteps}
                    startIcon={<Iconify icon="solar:list-bold" />}
                  >
                    Ordenar
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={addLane}
                    startIcon={<Iconify icon="solar:add-square-bold" />}
                  >
                    Linha
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => addStep(MAIN_LANE_ID)}
                    startIcon={<Iconify icon="solar:add-circle-bold" />}
                  >
                    Passo
                  </Button>
                </Stack>
              )}
            </Stack>

            <CustomTabs
              value={stepsView}
              onChange={(_e, value: StepsView) => setStepsView(value)}
              sx={{ width: { xs: 1, sm: 'auto' }, alignSelf: { sm: 'flex-start' } }}
            >
              <Tab
                value="board"
                label="Quadro"
                icon={<Iconify icon="solar:widget-4-bold" width={18} />}
                iconPosition="start"
              />
              <Tab
                value="timeline"
                label="Timeline"
                icon={<Iconify icon="solar:chart-2-bold" width={18} />}
                iconPosition="start"
              />
            </CustomTabs>

            {stepsView === 'board' ? (
              <>
                <Typography variant="caption" color="text.secondary">
                  Arraste pelo ícone ⋮⋮ para mover um processo entre linhas.
                </Typography>
                <RecipeStepsBoard
                  lanes={form.lanes}
                  steps={form.steps}
                  onRenameLane={renameLane}
                  onRemoveLane={(laneId) => {
                    removeLane(laneId);
                    setTimeout(() => void persist('immediate'), 0);
                  }}
                  onAddStep={addStep}
                  onUpdateStep={updateStep}
                  onRemoveStep={(stepId) => {
                    removeStep(stepId);
                    setTimeout(() => void persist('immediate'), 0);
                  }}
                  onMoveStep={(stepId, laneId) => {
                    updateStep(stepId, { lane_id: laneId });
                  }}
                  onBlurSave={flushAutosave}
                  onMoved={() => setTimeout(() => void persist('immediate'), 0)}
                />
              </>
            ) : (
              <RecipeStepsTimeline
                lanes={form.lanes}
                steps={form.steps}
                onUpdateStep={updateStep}
                onRemoveStep={(stepId) => {
                  removeStep(stepId);
                  setTimeout(() => void persist('immediate'), 0);
                }}
                onCreateStepAt={(laneId, minutesBeforeService) => {
                  const id = addStep(laneId, minutesBeforeService);
                  setTimeout(() => void persist('immediate'), 0);
                  return id;
                }}
                onCommit={() => setTimeout(() => void persist('immediate'), 0)}
              />
            )}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}

// ----------------------------------------------------------------------

function SaveStatusLabel({ status }: { status: SaveStatus }) {
  if (status === 'idle') {
    return (
      <Typography variant="caption" color="text.secondary">
        Autosave
      </Typography>
    );
  }
  if (status === 'dirty') {
    return (
      <Label variant="soft" color="warning">
        Alterações pendentes…
      </Label>
    );
  }
  if (status === 'saving') {
    return (
      <Stack direction="row" spacing={0.75} alignItems="center">
        <CircularProgress size={12} />
        <Typography variant="caption" color="text.secondary">
          Salvando…
        </Typography>
      </Stack>
    );
  }
  if (status === 'error') {
    return (
      <Label variant="soft" color="error">
        Erro ao salvar
      </Label>
    );
  }
  return (
    <Label variant="soft" color="success">
      Salvo
    </Label>
  );
}
