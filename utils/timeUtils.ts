
export const parseTimeToMinutes = (time: string): number => {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
};

export const formatMinutesToTime = (totalMinutes: number): string => {
  const absMinutes = Math.round(Math.abs(totalMinutes));
  const hours = Math.floor(absMinutes / 60);
  const minutes = absMinutes % 60;
  const sign = totalMinutes < 0 ? '-' : '';
  // Formato HH:mm (24h)
  return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export const calculateWorkedMinutes = (
  entrance: string,
  lunchStart: string,
  lunchEnd: string,
  exit: string,
  hasLunch: boolean = true
): number => {
  const e = parseTimeToMinutes(entrance);
  const x = parseTimeToMinutes(exit);

  if (!hasLunch) {
    // Se não tem almoço, calcula direto entrada até a saída
    // Se a saída for menor que a entrada (virada de dia), adiciona 24h
    let diff = x - e;
    if (diff < 0) diff += 1440; 
    return Math.max(0, diff);
  }

  const ls = parseTimeToMinutes(lunchStart);
  const le = parseTimeToMinutes(lunchEnd);

  let morning = ls - e;
  if (morning < 0) morning += 1440;

  let afternoon = x - le;
  if (afternoon < 0) afternoon += 1440;

  return Math.max(0, morning + afternoon);
};

export const getWeekday = (dateStr: string): string => {
  const date = new Date(dateStr + 'T12:00:00'); 
  const weekdays = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
  ];
  return weekdays[date.getDay()];
};

export const formatDateBR = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

export const downloadCSV = (data: any[], filename: string) => {
  // Cabeçalhos para o Excel em Português (Brasil) costumam funcionar melhor com ponto e vírgula
  const headers = ['Data', 'Dia', 'Entrada', 'Saida Almoco', 'Retorno Almoco', 'Saida Final', 'Total Trabalhado', 'Saldo'];
  const rows = data.map(entry => [
    formatDateBR(entry.date),
    entry.weekday,
    entry.entrance,
    entry.lunchStart || '-',
    entry.lunchEnd || '-',
    entry.exit,
    formatMinutesToTime(entry.totalWorkedMinutes),
    formatMinutesToTime(entry.balanceMinutes)
  ]);

  // Usando ";" como separador para compatibilidade direta com Excel BR
  const csvContent = "\uFEFF" + [
    headers.join(';'),
    ...rows.map(row => row.join(';'))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
