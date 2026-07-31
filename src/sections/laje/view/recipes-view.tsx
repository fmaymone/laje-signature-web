import type { ComposeStage, GenerateRecipeResponse, RecipeComponent } from 'src/types/recipe';

import { useRef, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { generateRecipeStream } from 'src/actions/compose';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

const EXAMPLES = [
  'Tenho 1,5 kg de sirigado e milho verde para 6 pessoas. Quero um prato de alta culinária nordestina com churrasqueira e Thermomix.',
  'Lagosta para 4 pessoas, identidade litorânea, sem farofa.',
  'Carne de sol com banana da terra e manteiga de garrafa, 4 pessoas.',
];

function formatBlockId(id: string) {
  return id.replace(/_/g, ' ');
}

// ----------------------------------------------------------------------

export function LajeRecipesView() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<ComposeStage | null>(null);
  const [stages, setStages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateRecipeResponse | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const canSubmit = message.trim().length >= 8 && !loading;

  const handleGenerate = async () => {
    if (!canSubmit) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setResult(null);
    setStage(null);
    setStages([]);

    let gotResult = false;

    try {
      await generateRecipeStream(
        { message: message.trim(), max_revisions: 1 },
        {
          onStage: (s) => {
            setStage(s);
            setStages((prev) => (prev.includes(s.label) ? prev : [...prev, s.label]));
          },
          onResult: (data) => {
            gotResult = true;
            setResult(data);
            setStage(null);
          },
          onError: (msg) => {
            setError(msg);
          },
        },
        controller.signal
      );

      if (!gotResult && !controller.signal.aborted) {
        setError((prev) => prev ?? 'O agente terminou sem devolver a receita. Tente de novo.');
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Falha ao falar com o agente.');
    } finally {
      setLoading(false);
      setStage(null);
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    setLoading(false);
    setStage(null);
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Compor"
        links={[
          { name: 'Atelier', href: paths.dashboard.root },
          { name: 'Compor' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={3}>
        <Card>
          <CardContent>
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="h4" sx={{ mb: 0.5 }}>
                  Compor prato
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Descreva o que você tem e o que quer — o agente Laje interpreta o pedido, escolhe
                  blocos de sabor e escreve a receita executável.
                </Typography>
              </Box>

              <TextField
                multiline
                minRows={5}
                fullWidth
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ex.: Tenho sirigado e milho para 6 pessoas, churrasqueira e TM7…"
                disabled={loading}
              />

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {EXAMPLES.map((example) => (
                  <Button
                    key={example.slice(0, 24)}
                    size="small"
                    variant="soft"
                    color="inherit"
                    disabled={loading}
                    onClick={() => setMessage(example)}
                  >
                    {example.length > 48 ? `${example.slice(0, 48)}…` : example}
                  </Button>
                ))}
              </Stack>

              <Stack direction="row" spacing={1.5} alignItems="center">
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={!canSubmit}
                  onClick={handleGenerate}
                  startIcon={
                    loading ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <Iconify icon="solar:magic-stick-3-bold" />
                    )
                  }
                >
                  {loading ? 'Compondo…' : 'Gerar receita'}
                </Button>

                {loading && (
                  <Button variant="outlined" color="inherit" onClick={handleCancel}>
                    Cancelar
                  </Button>
                )}
              </Stack>

              {loading && (
                <Alert severity="info" icon={<CircularProgress size={18} />}>
                  {stage?.label ?? 'Iniciando o agente…'}
                  {stages.length > 0 && (
                    <Typography variant="caption" display="block" sx={{ mt: 0.75, opacity: 0.8 }}>
                      {stages.join(' → ')}
                    </Typography>
                  )}
                </Alert>
              )}

              {error && (
                <Alert severity="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}
            </Stack>
          </CardContent>
        </Card>

        {result && <RecipeResult result={result} />}
      </Stack>
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

function RecipeResult({ result }: { result: GenerateRecipeResponse }) {
  const { recipe, meta, request } = result;

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ sm: 'flex-start' }}
              spacing={1}
            >
              <Box>
                <Typography variant="h3">{recipe.title}</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                  {recipe.concept}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Label color="primary" variant="soft">
                  {recipe.servings} pessoas
                </Label>
                {meta.score != null && (
                  <Label color="success" variant="soft">
                    score {meta.score}
                  </Label>
                )}
                {meta.approved != null && (
                  <Label color={meta.approved ? 'success' : 'warning'} variant="soft">
                    {meta.approved ? 'aprovado' : 'revisar'}
                  </Label>
                )}
              </Stack>
            </Stack>

            {recipe.revision_warning && (
              <Alert severity="warning">{recipe.revision_warning}</Alert>
            )}

            <Divider />

            <Box>
              <Typography variant="overline" color="text.disabled">
                Pedido interpretado
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {request.objective}
              </Typography>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                {request.ingredients.map((ing) => (
                  <Label key={ing} variant="soft" color="warning">
                    {ing}
                  </Label>
                ))}
              </Stack>
            </Box>

            {meta.blocks.length > 0 && (
              <Box>
                <Typography variant="overline" color="text.disabled">
                  Blocos de sabor
                </Typography>
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                  {meta.blocks.map((id) => (
                    <Label key={id} variant="outlined" color="primary">
                      {formatBlockId(id)}
                    </Label>
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>

      {recipe.components.map((component) => (
        <ComponentCard key={component.name} component={component} />
      ))}

      <InfoCard title="Mise en place" items={recipe.mise_en_place} />
      <InfoCard title="Linha do tempo" items={recipe.timeline} />
      <InfoCard title="Empratamento" items={recipe.plating} />
      <InfoCard title="Pontos críticos" items={recipe.critical_points} />
      <InfoCard title="Substituições" items={recipe.substitutions} />
      <InfoCard title="Conservação" items={recipe.conservation} />
      <InfoCard title="Por que é Laje" items={recipe.why_this_matches_fernando} />

      {recipe.equipment.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Equipamento
            </Typography>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              {recipe.equipment.map((item) => (
                <Label key={item} variant="soft" color="default">
                  {item}
                </Label>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}

function ComponentCard({ component }: { component: RecipeComponent }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h5">{component.name}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
          {component.purpose}
        </Typography>

        <Typography variant="subtitle2" sx={{ mb: 0.75 }}>
          Ingredientes
        </Typography>
        <Box component="ul" sx={{ pl: 2.5, mt: 0, mb: 2 }}>
          {component.ingredients.map((ing) => (
            <Typography component="li" variant="body2" key={ing}>
              {ing}
            </Typography>
          ))}
        </Box>

        <Typography variant="subtitle2" sx={{ mb: 0.75 }}>
          Execução
        </Typography>
        <Box component="ol" sx={{ pl: 2.5, mt: 0, mb: 0 }}>
          {component.instructions.map((step, idx) => (
            <Typography component="li" variant="body2" key={`${idx}-${step.slice(0, 20)}`} sx={{ mb: 0.75 }}>
              {step}
            </Typography>
          ))}
        </Box>

        {component.critical_points.length > 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {component.critical_points.join(' · ')}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

function InfoCard({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {title}
        </Typography>
        <Box component="ul" sx={{ pl: 2.5, m: 0 }}>
          {items.map((item) => (
            <Typography component="li" variant="body2" key={item} sx={{ mb: 0.5 }}>
              {item}
            </Typography>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
