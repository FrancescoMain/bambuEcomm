"use client";

export interface ProductVariantValue {
  id?: number;
  nome: string;
  immagine?: string;
  typeId?: number;
}

export interface ProductVariantType {
  id?: number;
  nome: string;
  productId?: number;
  valori: ProductVariantValue[];
}

export interface Product {
  id: number;
  titolo: string;
  prezzo: number;
  immagine?: string;
  descrizione?: string;
  categoria?: { id: number; name: string }[];
  stock?: number;
  varianti?: ProductVariantType[];
  available?: boolean;
}

export interface ProductFormData extends Partial<Product> {
  categoriaId?: number;
  imageFile?: File;
  variantImageFiles?: Record<string, File>;
}

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://bambu-ecomm-in2g.vercel.app/api";
