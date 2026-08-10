import type { RecipeImageImportResponse } from 'src/types/recipe-import';

import { z as zod } from 'zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { importRecipeFromImage } from 'src/actions/recipe-import';
import { createRecipeRecord } from 'src/actions/recipe-records';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

// ----------------------------------------------------------------------

const ImportSchema = zod.object({
  image: schemaHelper.file({ message: 'Envie um print da receita' }),
});

type ImportSchemaType = zod.infer<typeof ImportSchema>;

type Props = {
  open: boolean;
  onClose: () => void;
};

function errorMessage(err: unknown): string {
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'detail' in err) {
    return String((err as { detail: unknown }).detail);
  }
  if (err instanceof Error) return err.message;
  return 'Falha ao importar receita';
}

// ----------------------------------------------------------------------

export function RecipeImportScreenshotDialog({ open, onClose }: Props) {
  const router = useRouter();
  const [preview, setPreview] = useState<RecipeImageImportResponse | null>(null);
  const [creating, setCreating] = useState(false);

  const methods = useForm<ImportSchemaType>({
    resolver: zodResolver(ImportSchema),
    defaultValues: { image: null },
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (!open) {
      reset({ image: null });
      setPreview(null);
      setCreating(false);
    }
  }, [open, reset]);

  const onParse = handleSubmit(async (data) => {
    const file = data.image;
    if (!(file instanceof File)) {
      toast.error('Envie um print da receita');
      return;
    }
    try {
      const result = await importRecipeFromImage(file);
      setPreview(result);
      toast.success('Receita lida da imagem');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  });

  const handleCreate = async () => {
    if (!preview) return;
    setCreating(true);
    try {
      const recipe = await createRecipeRecord({
        title: preview.title,
        notes: preview.notes ?? null,
        composition_id: preview.composition_id ?? null,
        servings: preview.servings,
        block_ids: preview.block_ids ?? [],
        ingredients: preview.ingredients ?? [],
        lanes: preview.lanes,
        steps: preview.steps ?? [],
      });
      toast.success('Receita criada — revise no editor');
      onClose();
      router.push(paths.dashboard.recipeRecord(recipe.id));
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pr: 6 }}>
        Importar da foto
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 12, top: 12 }}
          aria-label="Fechar"
        >
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {!preview ? (
          <Form methods={methods} onSubmit={onParse}>
            <Stack spacing={2} sx={{ pt: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Envie um print ou foto da receita. A AI transcreve para o formato do livro — sem
                reinterpretar o prato.
              </Typography>
              <Field.Upload
                name="image"
                accept={{ 'image/jpeg': [], 'image/png': [], 'image/webp': [] }}
                helperText="JPEG, PNG ou WebP · até 8 MB"
              />
            </Stack>
          </Form>
        ) : (
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Typography variant="h6">{preview.title}</Typography>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              <Label variant="soft" color="info">
                {preview.servings} porções
              </Label>
              <Label variant="soft" color="default">
                {preview.ingredients?.length ?? 0} ingredientes
              </Label>
              <Label variant="soft" color="default">
                {preview.steps?.length ?? 0} passos
              </Label>
            </Stack>
            {preview.notes ? (
              <Typography variant="body2" color="text.secondary">
                {preview.notes}
              </Typography>
            ) : null}
            {preview.created_ingredient_names?.length ? (
              <Alert severity="info">
                Novos ingredientes no catálogo:{' '}
                {preview.created_ingredient_names.join(', ')}
              </Alert>
            ) : null}
            {preview.warnings?.length ? (
              <Alert severity="warning">
                {preview.warnings.map((w) => (
                  <Typography key={w} variant="body2" component="div">
                    {w}
                  </Typography>
                ))}
              </Alert>
            ) : null}
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button color="inherit" onClick={onClose} disabled={isSubmitting || creating}>
          Cancelar
        </Button>
        {!preview ? (
          <LoadingButton
            variant="contained"
            loading={isSubmitting}
            onClick={() => void onParse()}
            startIcon={<Iconify icon="solar:magic-stick-3-bold" />}
          >
            Ler imagem
          </LoadingButton>
        ) : (
          <>
            <Button color="inherit" onClick={() => setPreview(null)} disabled={creating}>
              Outra foto
            </Button>
            <LoadingButton
              variant="contained"
              loading={creating}
              onClick={() => void handleCreate()}
              startIcon={<Iconify icon="solar:add-circle-bold" />}
            >
              Criar receita
            </LoadingButton>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
