export interface Category {
  id: number;
  name: string;
}

export interface Priority {
  id: number;
  name: string;
  sortOrder: number;
}

export interface Status {
  id: number;
  name: string;
  isDefault: boolean;
}

export interface SystemStatus {
  online: boolean;
  categories: Category[];
}
