export interface BusinessCenterUnit {
  id: string;
  name: string;
  location: string;
  active: boolean;
}

export interface BusinessCenterFinancialParams {
  maxAmountPerCredit: number;
  annualInterestRate: number;
  lateFeePercentage: number;
  allowRefinance: boolean;
  minCapitalRequirement: number;
}

export interface BusinessCenter {
  id: string;
  name: string;
  code: string;
  status: 'Activo' | 'Inactivo';
  unitCount: number;
  responsible: string;
  observations: string;
  linkedUnits: BusinessCenterUnit[];
  financialParams: BusinessCenterFinancialParams;
}

export const DEFAULT_BUSINESS_CENTERS: Omit<BusinessCenter, 'id'>[] = [
  {
    name: 'Centro Metropolitano Norte',
    code: 'CN-MET-NOR',
    status: 'Activo',
    unitCount: 4,
    responsible: 'Humberto De la Calle',
    observations: 'Atiende la zona comercial norte alta densidad. Mayor flujo de créditos Express diaria.',
    linkedUnits: [
      { id: 'U-01', name: 'Oficina Central Kennedy', location: 'Av. Kennedy #45-12', active: true },
      { id: 'U-02', name: 'Ruta 10 - Chapinero Local', location: 'Barrio Chapinero', active: true },
      { id: 'U-03', name: 'Punto Express Suba Alianza', location: 'Calle 116 con 45', active: true },
      { id: 'U-04', name: 'Ruta 14 - Minutos de Dios', location: 'Minuto de Dios', active: false },
    ],
    financialParams: {
      maxAmountPerCredit: 10000000,
      annualInterestRate: 24,
      lateFeePercentage: 4,
      allowRefinance: true,
      minCapitalRequirement: 50000000,
    },
  },
  {
    name: 'Centro Sur Comercial Pacífico',
    code: 'CN-SUR-PAC',
    status: 'Activo',
    unitCount: 3,
    responsible: 'Clara Luz Roldán',
    observations: 'Foco comercial en microcréditos rurales y semiurbanos del Pacífico.',
    linkedUnits: [
      { id: 'U-05', name: 'Sede Principal Cali Sur', location: 'Calle 5 #78-20', active: true },
      { id: 'U-06', name: 'Ruta 31 - Jamundí Semilla', location: 'Jamundí', active: true },
      { id: 'U-07', name: 'Ruta 33 - Palmira Centro', location: 'Palmira', active: true },
    ],
    financialParams: {
      maxAmountPerCredit: 15000000,
      annualInterestRate: 22,
      lateFeePercentage: 5,
      allowRefinance: false,
      minCapitalRequirement: 75000000,
    },
  },
];
