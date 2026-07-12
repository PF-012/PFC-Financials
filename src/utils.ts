export interface FinancialYear {
  start: string;
  end: string;
  label: string;
}

export const getFinancialYearDates = (date = new Date()): FinancialYear => {
  const month = date.getMonth();
  const year = date.getFullYear();
  let startYear = year;
  if (month < 3) {
    startYear = year - 1;
  }
  return {
    start: `${startYear}-04-01`,
    end: `${startYear + 1}-03-31`,
    label: `FY ${startYear}-${(startYear + 1).toString().slice(-2)}`
  };
};

export const generateAvailableYears = (startYear = 2022, endYear = new Date().getFullYear()): FinancialYear[] => {
   const years = [];
   const currentMonth = new Date().getMonth();
   const maxYear = currentMonth >= 3 ? endYear : endYear - 1;
   for (let y = maxYear; y >= startYear; y--) {
      years.push({
         start: `${y}-04-01`,
         end: `${y + 1}-03-31`,
         label: `FY ${y}-${(y + 1).toString().slice(-2)}`
      });
   }
   return years;
}
