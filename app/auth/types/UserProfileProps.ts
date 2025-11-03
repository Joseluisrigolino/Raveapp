// interfaces/UserProfileProps.ts

export interface Address {
    province: string;
    municipality: string;
    locality: string;
    street: string;
    number: string;
    floorDept: string;
  }
  
  export interface UserProfile {
    firstName: string;
    lastName: string;
    dni: string;
    phone: string;
    email: string;
    password: string;
    address: Address;
  }
  