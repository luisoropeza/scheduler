export interface clinicOptions {
  id: number;
  name: string;
  department?: string;
  phoneNumber?: string;
  image?: string;
  activePatients?: number;
  pendingReviews?: number;
}
