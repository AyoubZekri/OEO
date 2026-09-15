export class Applink {
  static readonly server: string = "https://backand.kaidoeo.com/api";
  static readonly image: string  = "https://backand.kaidoeo.com/storage";

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
  static readonly printIndividual: string = `${Applink.server}/individuals/print`;

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

//  =============================Equipments============================== //

  static readonly equipments: string = `${Applink.server}/equipments`;
  static readonly createEquipment: string = `${Applink.server}/equipments/create`;
  static readonly updateEquipment: string = `${Applink.server}/equipments/update`;
  static readonly deleteEquipment: string = `${Applink.server}/equipments/delete`;


//  =============================Payments (Expenses)============================== //

  static readonly payments: string = `${Applink.server}/payments`;
  static readonly createPayment: string = `${Applink.server}/payments/create`;
  static readonly updatePayment: string = `${Applink.server}/payments/update`;
  static readonly deletePayment: string = `${Applink.server}/payments/delete`;
  static readonly returnPayment: string = `${Applink.server}/payments/return`;
//  =============================Equipment Operations============================== //

  static readonly equipmentOperations: string = `${Applink.server}/equipment-operations`;
  static readonly createEquipmentOperation: string = `${Applink.server}/equipment-operations/create`;
  static readonly returnEquipmentOperation: string = `${Applink.server}/equipment-operations/return`;

//  =============================Correspondences============================== //

  static readonly correspondences: string = `${Applink.server}/correspondences`;
  static readonly createCorrespondence: string = `${Applink.server}/correspondences/create`;
  static readonly updateCorrespondence: string = `${Applink.server}/correspondences/update`;
  static readonly deleteCorrespondence: string = `${Applink.server}/correspondences/delete`;

//  =============================Disciplinary============================== //

  static readonly disciplinary: string = `${Applink.server}/disciplinary`;
//  =============================Player Evaluations============================== //

  static readonly playerEvaluations: string = `${Applink.server}/player-evaluations`;
  static readonly createPlayerEvaluation: string = `${Applink.server}/player-evaluations/create`;
  static readonly updatePlayerEvaluation: string = `${Applink.server}/player-evaluations/update`;
  static readonly deletePlayerEvaluation: string = `${Applink.server}/player-evaluations/delete`;

//  =============================Improvement Programs============================== //

  static readonly improvementPrograms: string = `${Applink.server}/improvement-programs`;
  static readonly createImprovementProgram: string = `${Applink.server}/improvement-programs/create`;
  static readonly updateImprovementProgram: string = `${Applink.server}/improvement-programs/update`;
  static readonly deleteImprovementProgram: string = `${Applink.server}/improvement-programs/delete`;

//  =============================Contract Reviews============================== //

  static readonly contractReviews: string = `${Applink.server}/contract-reviews`;
  static readonly createContractReview: string = `${Applink.server}/contract-reviews/create`;
  static readonly updateContractReview: string = `${Applink.server}/contract-reviews/update`;
  static readonly deleteContractReview: string = `${Applink.server}/contract-reviews/delete`;

//  =============================Matches============================== //

  static readonly matches: string = `${Applink.server}/matches`;
  static readonly createMatch: string = `${Applink.server}/matches/create`;
  static readonly updateMatch: string = `${Applink.server}/matches/update`;
  static readonly deleteMatch: string = `${Applink.server}/matches/delete`;

//  =============================Match Callups============================== //

  static matchCallups(matchId: number): string {
    return `${Applink.server}/matches/callups/${matchId}`;
  }
  static readonly createMatchCallup: string = `${Applink.server}/matches/callups/create`;
  static readonly updateMatchCallup: string = `${Applink.server}/matches/callups/update`;
  static readonly deleteMatchCallup: string = `${Applink.server}/matches/callups/delete`;

  //  =============================Administrative Match Reports============================== //
  static readonly getAdministrativeReport = (matchId: number) => `${Applink.server}/administrative-reports/${matchId}`;
  static readonly saveAdministrativeReport: string = `${Applink.server}/administrative-reports/save`;

  //  =============================Medical Records============================== //
  static readonly medicalRecords = `${Applink.server}/medical-records`;
  static readonly createMedicalRecord = `${Applink.server}/medical-records/create`;
  static readonly updateMedicalRecord = (id: number) => `${Applink.server}/medical-records/update/${id}`;
  static readonly deleteMedicalRecord = (id: number) => `${Applink.server}/medical-records/delete/${id}`;

  //  =============================Player Clearance============================== //
  static readonly getPlayerClearance = (playerId: number) => `${Applink.server}/player-clearance/${playerId}`;
  static readonly savePlayerClearance = `${Applink.server}/player-clearance`;
  static readonly deletePlayerClearance = (playerId: number) => `${Applink.server}/player-clearance/${playerId}`;

}

