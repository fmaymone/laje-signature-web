import type { FlavorBlock } from 'src/types/library';

import { useState } from 'react';

import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';

import { createBlock, EMPTY_SENSORY, useGetBlocks } from 'src/actions/blocks';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { makeFamilyTag, slugifyTag } from '../flavor/tag-utils';

// ----------------------------------------------------------------------

type BlockOption = FlavorBlock & {
  inputValue?: string;
  isCreateOption?: boolean;
};

const filter = createFilterOptions<BlockOption>();

function slugifyName(value: string) {
  return slugifyTag(value) || 'bloco';
}

function errorMessage(err: unknown) {
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'detail' in err) {
    return String((err as { detail: unknown }).detail);
  }
  if (err instanceof Error) return err.message;
  return 'Falha ao criar bloco';
}

async function createMinimalBlock(name: string): Promise<FlavorBlock> {
  const id = slugifyName(name);
  return createBlock({
    id,
    name: name.trim(),
    family: makeFamilyTag('nordeste'),
    ingredient_ids: [id],
    culinary_roles: [],
    compatible_protagonists: [],
    recommended_base_ids: [],
    target_sensory_profile: { ...EMPTY_SENSORY },
    texture_targets: [],
    techniques: [],
    notes: 'Criado inline a partir da receita.',
  });
}

type Props = {
  value: FlavorBlock[];
  onChange: (next: FlavorBlock[]) => void;
  label?: string;
  helperText?: string;
  disabled?: boolean;
};

export function BlockMultiSelect({
  value,
  onChange,
  label = 'Blocos',
  helperText = 'Digite para buscar ou criar um bloco novo.',
  disabled,
}: Props) {
  const { blocks, mutateBlocks } = useGetBlocks();
  const [creating, setCreating] = useState(false);

  const handleChange = async (_event: unknown, next: (string | BlockOption)[]) => {
    const resolved: FlavorBlock[] = [];
    let createdCount = 0;

    for (const item of next) {
      if (typeof item === 'string') {
        const name = item.trim();
        if (!name) continue;
        const existing = blocks.find(
          (b) => b.name.toLowerCase() === name.toLowerCase() || b.id === slugifyName(name)
        );
        if (existing) {
          if (!resolved.some((b) => b.id === existing.id)) resolved.push(existing);
          continue;
        }
        setCreating(true);
        try {
          const created = await createMinimalBlock(name);
          resolved.push(created);
          createdCount += 1;
        } catch (err) {
          toast.error(errorMessage(err));
        } finally {
          setCreating(false);
        }
        continue;
      }

      if (item.isCreateOption && item.inputValue) {
        const name = item.inputValue.trim();
        if (!name) continue;
        setCreating(true);
        try {
          const created = await createMinimalBlock(name);
          if (!resolved.some((b) => b.id === created.id)) {
            resolved.push(created);
            createdCount += 1;
          }
        } catch (err) {
          // Se já existe (409), tenta reusar do catálogo
          const id = slugifyName(name);
          const existing = blocks.find((b) => b.id === id);
          if (existing) {
            if (!resolved.some((b) => b.id === existing.id)) resolved.push(existing);
          } else {
            toast.error(errorMessage(err));
          }
        } finally {
          setCreating(false);
        }
        continue;
      }

      if (!resolved.some((b) => b.id === item.id)) {
        resolved.push(item);
      }
    }

    if (createdCount > 0) {
      await mutateBlocks();
      toast.success(
        createdCount === 1 ? 'Bloco criado e adicionado' : `${createdCount} blocos criados`
      );
    }
    onChange(resolved);
  };

  return (
    <Autocomplete
      multiple
      freeSolo
      disabled={disabled || creating}
      options={blocks as BlockOption[]}
      value={value as BlockOption[]}
      filterSelectedOptions
      filterOptions={(options, params) => {
        const filtered = filter(options, params);
        const input = params.inputValue.trim();
        if (!input) return filtered;

        const exists = options.some(
          (option) =>
            option.name.toLowerCase() === input.toLowerCase() ||
            option.id === slugifyName(input)
        );
        if (!exists) {
          filtered.push({
            id: `__create__${slugifyName(input)}`,
            name: input,
            inputValue: input,
            isCreateOption: true,
            family: makeFamilyTag('nordeste'),
            ingredient_ids: [],
            culinary_roles: [],
            compatible_protagonists: [],
            recommended_base_ids: [],
            target_sensory_profile: { ...EMPTY_SENSORY },
            texture_targets: [],
            techniques: [],
          });
        }
        return filtered;
      }}
      getOptionLabel={(option) => {
        if (typeof option === 'string') return option;
        if (option.isCreateOption) return option.inputValue || option.name;
        return option.name;
      }}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      onChange={(event, next) => {
        void handleChange(event, next);
      }}
      renderOption={(props, option) => {
        if (option.isCreateOption) {
          return (
            <li {...props} key={option.id}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Iconify icon="solar:add-circle-bold" width={18} />
                <Typography variant="body2">
                  Criar bloco “{option.inputValue}”
                </Typography>
              </Stack>
            </li>
          );
        }
        return (
          <li {...props} key={option.id}>
            <Stack>
              <Typography variant="body2">{option.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {option.id}
              </Typography>
            </Stack>
          </li>
        );
      }}
      renderTags={(selected, getTagProps) =>
        selected.map((option, index) => {
          const { key, ...tagProps } = getTagProps({ index });
          return (
            <Chip
              {...tagProps}
              key={option.id}
              label={option.name}
              size="small"
              color="primary"
              variant="soft"
            />
          );
        })
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder="Buscar ou criar bloco…"
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {creating ? <CircularProgress color="inherit" size={16} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}
