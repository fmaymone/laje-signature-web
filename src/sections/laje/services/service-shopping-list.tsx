import type { Ingredient } from 'src/types/ingredient';
import type { RecipeRecord } from 'src/types/recipe-record';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { UNIT_OPTIONS } from 'src/types/ingredient';

import { EmptyContent } from 'src/components/empty-content';

import { aggregateShoppingList } from './service-aggregate';

// ----------------------------------------------------------------------

function unitLabel(unit: string) {
  return UNIT_OPTIONS.find((opt) => opt.value === unit)?.label ?? unit;
}

function formatQty(value: number) {
  if (Number.isInteger(value)) return String(value);
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}

type Props = {
  recipes: RecipeRecord[];
  ingredientsById: Map<string, Ingredient>;
};

export function ServiceShoppingList({ recipes, ingredientsById }: Props) {
  const lines = useMemo(
    () => aggregateShoppingList(recipes, ingredientsById),
    [recipes, ingredientsById]
  );

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6">Lista de compras</Typography>
            <Typography variant="body2" color="text.secondary">
              Ingredientes somados de todas as receitas do serviço
              {lines.length ? ` · ${lines.length} itens` : ''}.
            </Typography>
          </Box>

          {lines.length === 0 ? (
            <EmptyContent
              title="Lista vazia"
              description="As receitas selecionadas ainda não têm ingredientes."
              sx={{ py: 4 }}
            />
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Ingrediente</TableCell>
                    <TableCell width={100}>Qtd</TableCell>
                    <TableCell width={100}>Unidade</TableCell>
                    <TableCell>Receitas</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lines.map((line) => (
                    <TableRow key={line.key} hover>
                      <TableCell>
                        <Typography variant="subtitle2">{line.name}</Typography>
                      </TableCell>
                      <TableCell>{formatQty(line.quantity)}</TableCell>
                      <TableCell>{unitLabel(line.unit)}</TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {line.recipeTitles.join(' · ')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
