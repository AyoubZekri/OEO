export class Applink {
  static readonly server: string = "http://backand.kaidoeo.com/api";
  static readonly image: string = "http://backand.kaidoeo.com/storage";

//  =============================Auth============================== //

  static readonly login: string = `${Applink.server}/login`;
  static readonly logout: string = `${Applink.server}/logout`;
  static readonly getUser: string = `${Applink.server}/user`;
//  =============================Roles============================== //

  static readonly roles: string = `${Applink.server}/roles`;
  static readonly createRole: string = `${Applink.server}/roles/create`;
  static readonly showRole: string = `${Applink.server}/roles/show`;
  static readonly updateRole: string = `${Applink.server}/roles/update`;
  static readonly deleteRole: string = `${Applink.server}/roles/delete`;

//  =============================Users============================== //

  static readonly users: string = `${Applink.server}/users`;
  static readonly createUser: string = `${Applink.server}/users/create`;
  static readonly showUser: string = `${Applink.server}/users/show`;
  static readonly updateUser: string = `${Applink.server}/users/update`;
  static readonly deleteUser: string = `${Applink.server}/users/delete`;

//  =============================Teams============================== //

  static readonly teams: string = `${Applink.server}/teams`;
  static readonly createTeam: string = `${Applink.server}/teams/create`;
  static readonly showTeam: string = `${Applink.server}/teams/show`;
  static readonly updateTeam: string = `${Applink.server}/teams/update`;
  static readonly deleteTeam: string = `${Applink.server}/teams/delete`;

//  =============================Individuals============================== //

  static readonly individuals: string = `${Applink.server}/individuals`;
  static readonly createIndividual: string = `${Applink.server}/individuals/create`;
  static readonly updateIndividual: string = `${Applink.server}/individuals/update`;
  static readonly deleteIndividual: string = `${Applink.server}/individuals/delete`;

//  =============================Contracts============================== //

  static readonly contracts: string = `${Applink.server}/contracts`;
  static readonly createContract: string = `${Applink.server}/contracts/create`;
  static readonly showContract: string = `${Applink.server}/contracts/show`;
  static readonly updateContract: string = `${Applink.server}/contracts/update`;
  static readonly deleteContract: string = `${Applink.server}/contracts/delete`;

//  =============================Funds============================== //

  static readonly funds: string = `${Applink.server}/funds`;
  static readonly createFund: string = `${Applink.server}/funds/create`;
  static readonly updateFund: string = `${Applink.server}/funds/update`;
  static readonly deleteFund: string = `${Applink.server}/funds/delete`;

//  =============================Transactions============================== //

  static readonly transactions: string = `${Applink.server}/transactions`;
  static readonly createTransaction: string = `${Applink.server}/transactions/create`;
  static readonly deleteTransaction: string = `${Applink.server}/transactions/delete`;

//  =============================Payments (Expenses)============================== //

  static readonly payments: string = `${Applink.server}/payments`;
  static readonly createPayment: string = `${Applink.server}/payments/create`;
  static readonly updatePayment: string = `${Applink.server}/payments/update`;
  static readonly deletePayment: string = `${Applink.server}/payments/delete`;
}
