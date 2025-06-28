"use client";
import React, { useState, useEffect } from "react";
import { ProductVariantType, ProductVariantValue } from "./types";

interface VariantsFormProps {
  variants: ProductVariantType[];
  onChange: (variants: ProductVariantType[]) => void;
  onImageUpload: (typeIndex: number, valueIndex: number, file: File) => void;
}

export default function VariantsForm({
  variants,
  onChange,
  onImageUpload,
}: VariantsFormProps) {
  const [expandedVariants, setExpandedVariants] = useState<
    Record<number, boolean>
  >({});

  // Log delle varianti quando cambiano
  useEffect(() => {
    console.log("VariantsForm received variants:", variants);
  }, [variants]);

  // Funzione per gestire l'espansione/contrazione di una variante
  const toggleVariantExpanded = (index: number) => {
    setExpandedVariants((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Gestione varianti
  const handleAddVariantType = () => {
    const variantsLength = variants?.length || 0;
    const newVariants = [...(variants || []), { nome: "", valori: [] }];
    onChange(newVariants);

    // Espandi automaticamente la nuova variante
    setExpandedVariants((prev) => ({
      ...prev,
      [variantsLength]: true,
    }));
  };

  const handleVariantTypeChange = (index: number, name: string) => {
    const updatedVariants = [...variants];
    updatedVariants[index] = {
      ...updatedVariants[index],
      nome: name,
    };
    onChange(updatedVariants);
  };

  const handleRemoveVariantType = (index: number) => {
    const updatedVariants = [...variants];
    updatedVariants.splice(index, 1);
    onChange(updatedVariants);
  };

  const handleAddVariantValue = (typeIndex: number) => {
    const updatedVariants = [...variants];
    updatedVariants[typeIndex] = {
      ...updatedVariants[typeIndex],
      valori: [...updatedVariants[typeIndex].valori, { nome: "" }],
    };
    onChange(updatedVariants);
  };

  const handleVariantValueChange = (
    typeIndex: number,
    valueIndex: number,
    field: keyof ProductVariantValue,
    value: string
  ) => {
    const updatedVariants = [...variants];
    updatedVariants[typeIndex] = {
      ...updatedVariants[typeIndex],
      valori: [...updatedVariants[typeIndex].valori],
    };
    updatedVariants[typeIndex].valori[valueIndex] = {
      ...updatedVariants[typeIndex].valori[valueIndex],
      [field]: value,
    };
    onChange(updatedVariants);
  };

  const handleRemoveVariantValue = (typeIndex: number, valueIndex: number) => {
    const updatedVariants = [...variants];
    updatedVariants[typeIndex] = {
      ...updatedVariants[typeIndex],
      valori: [...updatedVariants[typeIndex].valori],
    };
    updatedVariants[typeIndex].valori.splice(valueIndex, 1);
    onChange(updatedVariants);
  };

  const handleVariantValueImageUpload = (
    typeIndex: number,
    valueIndex: number,
    file: File
  ) => {
    onImageUpload(typeIndex, valueIndex, file);
  };

  return (
    <div className="mb-4 border-t pt-4 mt-4">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-bold">Varianti del prodotto</h4>
        <button
          type="button"
          className="bg-blue-600 text-white px-2 py-1 rounded text-xs"
          onClick={handleAddVariantType}
        >
          + Aggiungi tipo
        </button>
      </div>

      {variants && variants.length > 0 ? (
        <div className="space-y-4">
          {variants.map((variantType, typeIndex) => (
            <div
              key={variantType.id || `new-type-${typeIndex}`}
              className="border rounded p-3 bg-gray-50"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                <div
                  className="flex-grow flex items-center cursor-pointer"
                  onClick={() => toggleVariantExpanded(typeIndex)}
                >
                  <span className="mr-2 text-gray-500">
                    {expandedVariants[typeIndex] ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m4.5 15.75 7.5-7.5 7.5 7.5"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m19.5 8.25-7.5 7.5-7.5-7.5"
                        />
                      </svg>
                    )}
                  </span>
                  <input
                    type="text"
                    className="flex-grow border rounded px-2 py-1"
                    placeholder="Nome tipo (es. Colore, Taglia)"
                    value={variantType.nome || ""}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleVariantTypeChange(typeIndex, e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    maxLength={50}
                    required
                  />
                </div>
                <button
                  type="button"
                  className="bg-red-600 text-white px-2 py-1 rounded text-xs w-full md:w-auto flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveVariantType(typeIndex);
                  }}
                >
                  Rimuovi
                </button>
              </div>

              {expandedVariants[typeIndex] ? (
                <div className="mb-2 pl-4 mt-3 border-t pt-3">
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="text-sm font-medium">Valori</h5>
                    <button
                      type="button"
                      className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
                      onClick={() => handleAddVariantValue(typeIndex)}
                    >
                      + Aggiungi valore
                    </button>
                  </div>

                  {variantType.valori && variantType.valori.length > 0 ? (
                    <div className="space-y-2">
                      {variantType.valori.map((value, valueIndex) => (
                        <div
                          key={
                            value.id || `new-value-${typeIndex}-${valueIndex}`
                          }
                          className="flex flex-col md:flex-row items-start gap-2 border-b pb-2"
                        >
                          <div className="flex-grow w-full space-y-2">
                            <input
                              type="text"
                              className="w-full border rounded px-2 py-1"
                              placeholder="Nome valore (es. Rosso, XL)"
                              value={value.nome || ""}
                              onChange={(e) =>
                                handleVariantValueChange(
                                  typeIndex,
                                  valueIndex,
                                  "nome",
                                  e.target.value
                                )
                              }
                              maxLength={30}
                              required
                            />

                            <div className="flex flex-col sm:flex-row items-center gap-2">
                              <input
                                type="text"
                                className="w-full border rounded px-2 py-1 text-xs"
                                placeholder="URL immagine (opzionale)"
                                value={value.immagine || ""}
                                onChange={(e) =>
                                  handleVariantValueChange(
                                    typeIndex,
                                    valueIndex,
                                    "immagine",
                                    e.target.value
                                  )
                                }
                              />
                              <span className="mx-1 text-xs hidden sm:inline">
                                o
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                className="text-xs w-full sm:w-auto"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleVariantValueImageUpload(
                                      typeIndex,
                                      valueIndex,
                                      e.target.files[0]
                                    );
                                  }
                                }}
                              />
                            </div>

                            {value.immagine && (
                              <img
                                src={value.immagine}
                                alt="anteprima"
                                className="h-10 mt-1 rounded"
                              />
                            )}
                          </div>

                          <button
                            type="button"
                            className="bg-red-500 text-white px-2 py-1 rounded text-xs w-full md:w-auto flex-shrink-0"
                            onClick={() =>
                              handleRemoveVariantValue(typeIndex, valueIndex)
                            }
                          >
                            Rimuovi
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Nessun valore aggiunto. Aggiungi almeno un valore.
                    </p>
                  )}
                </div>
              ) : (
                variantType.valori &&
                variantType.valori.length > 0 && (
                  <div className="text-sm text-gray-500 mt-1 pl-6">
                    {variantType.valori.length} valori:{" "}
                    {variantType.valori.map((v) => v.nome).join(", ")}
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          Nessuna variante aggiunta. Aggiungi varianti per configurare opzioni
          come colore, taglia, ecc.
        </p>
      )}
    </div>
  );
}
