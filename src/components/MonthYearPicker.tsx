interface MonthYearPickerProps {
  year: number | null;
  month: number | null;
  onChange: (year: number | null, month: number | null) => void;
}

const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export function MonthYearPicker({ year, month, onChange }: MonthYearPickerProps) {
  const isUndefined = year === null;
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 15 }, (_, i) => currentYear - i);

  return (
    <div className="field">
      <label>Fecha de añadido</label>
      <div className="field-checkbox">
        <input
          type="checkbox"
          checked={isUndefined}
          onChange={(e) => {
            if (e.target.checked) onChange(null, null);
            else onChange(currentYear, new Date().getMonth() + 1);
          }}
        />
        Fecha indefinida
      </div>
      {!isUndefined && (
        <div className="field-row">
          <select className="input" value={month ?? 1} onChange={(e) => onChange(year, Number(e.target.value))}>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={year ?? currentYear}
            onChange={(e) => onChange(Number(e.target.value), month)}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
