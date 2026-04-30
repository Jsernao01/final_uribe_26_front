export interface ILoginCredentials {
  email: string;
  password: string;
}

export interface IUserSession {
  id: string;
  fullName: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

export interface IRegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  documentType: 'CEDULA' | 'TARGETA_IDENTIDAD';
  documentNumber: string;
  birthDate: string;
  address: string;
  password: string;
  bankName?: string;
  bankAccount?: string;
  bankAccountType?: 'DEBITO' | 'CREDITO';
}

export interface IAuthResponse {
  success: boolean;
  message: string;
  user?: IUserSession;
  token?: string;
}
