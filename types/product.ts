export interface ProductPackage {
  name: string;
  price: number;
  undangan: string;
  foto: string;
  video: string;
  share: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  category?: string;
  jenis?: string;
  design?: string;
  packages: ProductPackage[];
  image_url?: string;
  demo_url?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}
