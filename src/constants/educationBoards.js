// `value` is what gets stored on the profile document, so keep existing values stable.
export const EDUCATION_BOARDS = [
  { label: 'CBSE', value: '1' },
  { label: 'IGCSE', value: '2' },
  { label: 'GCSE', value: '3' },
  { label: 'MYP', value: '4' },
  { label: 'IB', value: '5' },
  { label: 'A Levels or AS', value: '6' },
];

export function getBoardLabel(value) {
  const board = EDUCATION_BOARDS.find(item => item.value === value);
  return board ? board.label : 'Unknown';
}
