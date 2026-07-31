import type { Tag } from 'src/types/library';

import { useMemo, useState } from 'react';

import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';

import { useGetBlocks } from 'src/actions/blocks';

import {
  BASE_FAMILY_TAGS,
  BASE_TECHNIQUE_TAGS,
  makeFamilyTag,
  makeTechniqueTag,
  slugifyTag,
} from '../flavor/tag-utils';

// ----------------------------------------------------------------------

const filter = createFilterOptions<Tag>();

type Kind = 'family' | 'technique';

type CommonProps = {
  disabled?: boolean;
  label?: string;
  helperText?: string;
};

type MultiProps = CommonProps & {
  multiple: true;
  kind: Kind;
  value: Tag[];
  onChange: (next: Tag[]) => void;
};

type SingleProps = CommonProps & {
  multiple?: false;
  kind: Kind;
  value: Tag | null;
  onChange: (next: Tag | null) => void;
};

type Props = MultiProps | SingleProps;

function makeTag(kind: Kind, raw: string | Tag): Tag {
  return kind === 'family' ? makeFamilyTag(raw) : makeTechniqueTag(raw);
}

export function DomainTagsField(props: Props) {
  const { blocks } = useGetBlocks();
  const {
    kind,
    disabled,
    label = kind === 'family' ? 'Família' : 'Técnicas',
    helperText =
      kind === 'family'
        ? 'Tag de família (id + título). Digite para criar.'
        : 'Tags de técnica (id + título). Enter ou vírgula para confirmar.',
  } = props;

  const [inputValue, setInputValue] = useState('');

  const options = useMemo(() => {
    const base = kind === 'family' ? BASE_FAMILY_TAGS : BASE_TECHNIQUE_TAGS;
    const fromCatalog =
      kind === 'family'
        ? blocks.map((block) => makeFamilyTag(block.family as Tag | string))
        : blocks.flatMap((block) =>
            (block.techniques ?? []).map((item) => makeTechniqueTag(item as Tag | string))
          );
    const selected = props.multiple ? props.value : props.value ? [props.value] : [];
    const byId = new Map<string, Tag>();
    for (const item of [...base, ...fromCatalog, ...selected]) {
      const tag = makeTag(kind, item);
      if (tag.id) byId.set(tag.id, tag);
    }
    return [...byId.values()].sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
  }, [blocks, kind, props]);

  const addFromInput = () => {
    const raw = inputValue.trim();
    if (!raw) return;
    const tag = makeTag(kind, raw);
    if (!tag.id) return;
    if (props.multiple) {
      if (!props.value.some((item) => item.id === tag.id)) {
        props.onChange([...props.value, tag]);
      }
    } else {
      props.onChange(tag);
    }
    setInputValue('');
  };

  if (props.multiple) {
    return (
      <Autocomplete
        multiple
        freeSolo
        disableCloseOnSelect
        disabled={disabled}
        options={options}
        value={props.value}
        inputValue={inputValue}
        filterOptions={(opts, params) => {
          const filtered = filter(opts, params);
          const slug = slugifyTag(params.inputValue);
          if (slug && !opts.some((opt) => opt.id === slug)) {
            filtered.push(makeTag(kind, params.inputValue));
          }
          return filtered;
        }}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        getOptionLabel={(option) => (typeof option === 'string' ? option : option.title)}
        onInputChange={(_event, next, reason) => {
          if (reason === 'reset') return;
          setInputValue(next);
        }}
        onChange={(_event, next) => {
          const unique = new Map<string, Tag>();
          for (const item of next) {
            const tag = makeTag(kind, item as string | Tag);
            if (tag.id) unique.set(tag.id, tag);
          }
          props.onChange([...unique.values()]);
          setInputValue('');
        }}
        renderOption={(optionProps, option) => (
          <li {...optionProps} key={option.id}>
            {option.title}
            <Chip
              label={option.id}
              size="small"
              variant="outlined"
              sx={{ ml: 1, height: 20, fontSize: 11 }}
            />
          </li>
        )}
        renderTags={(selected, getTagProps) =>
          selected.map((option, index) => {
            const { key, ...tagProps } = getTagProps({ index });
            return (
              <Chip
                {...tagProps}
                key={`${option.id}-${key}`}
                label={option.title}
                size="small"
                color="info"
                variant="soft"
                title={option.id}
              />
            );
          })
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder="Digite e Enter…"
            helperText={helperText}
            onKeyDown={(event) => {
              if (event.key !== ',' && event.key !== ';') return;
              event.preventDefault();
              addFromInput();
            }}
          />
        )}
      />
    );
  }

  return (
    <Autocomplete
      freeSolo
      disabled={disabled}
      options={options}
      value={props.value}
      inputValue={inputValue}
      filterOptions={(opts, params) => {
        const filtered = filter(opts, params);
        const slug = slugifyTag(params.inputValue);
        if (slug && !opts.some((opt) => opt.id === slug)) {
          filtered.push(makeTag(kind, params.inputValue));
        }
        return filtered;
      }}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      getOptionLabel={(option) => (typeof option === 'string' ? option : option.title)}
      onInputChange={(_event, next, reason) => {
        if (reason === 'reset') return;
        setInputValue(next);
      }}
      onChange={(_event, next) => {
        if (next == null || next === '') {
          props.onChange(null);
          setInputValue('');
          return;
        }
        props.onChange(makeTag(kind, next as string | Tag));
        setInputValue('');
      }}
      renderOption={(optionProps, option) => (
        <li {...optionProps} key={option.id}>
          {option.title}
          <Chip
            label={option.id}
            size="small"
            variant="outlined"
            sx={{ ml: 1, height: 20, fontSize: 11 }}
          />
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder="Selecione ou crie uma tag…"
          helperText={helperText}
        />
      )}
    />
  );
}
