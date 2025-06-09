"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import SearchBar from "@/components/layout/SearchBar";
import SearchResultCard from "@/components/layout/SearchResultCard";
import { selectParentCategories } from "@/redux/categorySelectors";
import { fetchCategoriesStart } from "@/redux/categorySlice";
import { fetchLatestProducts } from "@/api/productApi";
import { useCartActions } from "@/components/layout/CartProvider";
import { RootState } from "@/redux/store";
import { useLoading } from "@/components/layout/LoadingContext";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}

// Migliora il tipo dei filtri
interface Filters {
  search: string;
  category: number | null;
  subcategory: number | null;
  minPrice: string;
  maxPrice: string;
}

// Define Product type for search results
interface Product {
  id: string;
  titolo: string;
  prezzo: number;
  immagine: string;
  categoria?: string;
  autore?: string;
  [key: string]: unknown;
}

// Add Category and ProductQueryParams types
interface Category {
  id: number;
  name: string;
  parentId?: number | null;
}

interface ProductQueryParams {
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
  search?: string;
  categoryId?: number | number[];
  minPrice?: string;
  maxPrice?: string;
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [search, setSearch] = React.useState(query);
  const router = useRouter();
  const dispatch = useDispatch();
  const parentCategories = useSelector(selectParentCategories);
  const categories = useSelector(
    (state: RootState) => state.category.categories as Category[]
  );
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [selectedCategory, setSelectedCategory] = React.useState<number | null>(
    null
  );
  const [selectedSubcategory, setSelectedSubcategory] = React.useState<
    number | null
  >(null);
  const [minPrice, setMinPrice] = React.useState<string>("");
  const [maxPrice, setMaxPrice] = React.useState<string>("");
  const [products, setProducts] = React.useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = React.useState<Product[]>([]);
  const { setLoading } = useLoading();
  const [filters, setFilters] = React.useState<Filters>({
    search: query,
    category: null,
    subcategory: null,
    minPrice: "",
    maxPrice: "",
  });
  // Stato per la paginazione incrementale
  const [loadCount, setLoadCount] = React.useState(1);

  // Carica le categorie solo una volta al mount
  React.useEffect(() => {
    dispatch(fetchCategoriesStart());
  }, [dispatch]);

  // Caricamento iniziale dei primi 50 prodotti o sync con query string
  React.useEffect(() => {
    if (categories.length === 0) return; // Attendi che le categorie siano caricate
    setLoading(true);
    setLoadCount(1);
    // Se c'è un category nella query string, seleziona la categoria corrispondente
    const categoryName = searchParams.get("category");
    if (categoryName) {
      const found = categories.find(
        (cat: Category) => cat.name.toLowerCase() === categoryName.toLowerCase()
      );
      if (found) {
        setFilters((f) => ({ ...f, category: found.id }));
        // Trova tutte le sottocategorie di questa categoria
        const subcats = categories.filter(
          (cat: Category) => cat.parentId === found.id
        );
        let params: ProductQueryParams = {
          limit: 50,
          sortBy: "createdAt",
          sortOrder: "desc",
        };
        if (subcats.length > 0) {
          params.categoryId = subcats.map((c: Category) => c.id);
        } else {
          params.categoryId = found.id;
        }
        axios
          .get<{ data: { data: Product[] } }>(`${API_URL}/products`, {
            params,
            paramsSerializer: (params) => {
              // Serializza array come categoryId=1&categoryId=2
              const searchParams = new URLSearchParams();
              Object.entries(params).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                  value.forEach((v) => searchParams.append(key, v));
                } else if (value !== undefined && value !== null) {
                  searchParams.append(key, value);
                }
              });
              return searchParams.toString();
            },
          })
          .then((res) => {
            const arr = Array.isArray(res.data.data)
              ? res.data.data
              : res.data.data.data;
            setProducts(arr);
          })
          .finally(() => setLoading(false));
        return;
      }
    }
    // Default: ultimi 50 prodotti
    fetchLatestProducts(50)
      .then((data) => setProducts(data.data || data))
      .finally(() => setLoading(false));
  }, [searchParams, categories]);

  // Clear search input and query param
  const handleClear = () => {
    setSearch("");
    router.push("/search");
  };
  // On submit, update query param
  const handleSearchSubmit = () => {
    if (search.trim()) {
      router.push(`/search?q=${encodeURIComponent(search)}`);
    }
  };
  // On filter/search submit
  const handleApplyFilters = () => {
    setLoading(true);
    // Build params
    const params: ProductQueryParams = {
      limit: 50,
      sortBy: "createdAt",
      sortOrder: "desc",
    };
    if (filters.search) params.search = filters.search;
    // Se c'è una sottocategoria selezionata, invia solo quella
    if (filters.subcategory) {
      params.categoryId = filters.subcategory;
    } else if (filters.category) {
      // Trova tutte le sottocategorie della categoria selezionata
      const subcats = categories.filter(
        (cat: Category) => cat.parentId === filters.category
      );
      if (subcats.length > 0) {
        params.categoryId = subcats.map((c: Category) => c.id);
      } else {
        params.categoryId = filters.category;
      }
    }
    if (filters.minPrice) params.minPrice = filters.minPrice;
    if (filters.maxPrice) params.maxPrice = filters.maxPrice;
    axios
      .get<{ data: { data: Product[] } }>(`${API_URL}/products`, {
        params,
        paramsSerializer: (params) => {
          // Serializza array come categoryId=1&categoryId=2
          const searchParams = new URLSearchParams();
          Object.entries(params).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              value.forEach((v) => searchParams.append(key, v));
            } else if (value !== undefined && value !== null) {
              searchParams.append(key, value);
            }
          });
          return searchParams.toString();
        },
      })
      .then((res) => {
        const arr = Array.isArray(res.data.data)
          ? res.data.data
          : res.data.data.data;
        setProducts(arr);
      })
      .finally(() => setLoading(false));
  };

  // Dummy data for cards (replace with real search results)
  const results = [
    {
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDmuTjHlLzD9J25jOjMj9wLCnKyUtSmSFTRavrxmZt1juVGGgsZxXL7HqX3oj1N3tg9Oq-P-t4wRaQceiXgj0eUCd16nMZbjbSy9Hl-sPi4LEeuzOzWzE1_ug2F5ZjXnCXOgaAfmzVrJDDS9iCsOUlrKq2lySsfNVKQcYcTEcMpyYTrG3bKyLZl6P15VuZJI7LUcKRs4yOYCHFIgQHqS2d2VkfW9go8xmfZaRI4zJeJsprcSbN3YtJcEVq_TIhFMVsyVRPLGckIyVaL",
      title: "Il Signore degli Anelli",
      author: "J.R.R. Tolkien",
      price: 18.99,
    },
    {
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuACUHqDQqKqjS1HZbgH-_r0uf8yZ0eJzW1KX7zcvYrm7BbYbeoARMdusG-grMomHxF7qb02aJxjNRQeaniOEt5ynplg4bUffZOnnAUdZ30uYEdbsS3I3-K3f6dK-C508cv_DnOvcw3eeZAh6WxIdLJkPUngZro4lJgEGWFHAj47GybOL0tiE3gFmnpRrXhYt6zLZdf_AM2wrwkrbEM_UvtlFGkqeiaH7YOBWu5bB3hyN4vblJLBIRYSQPQKki3S3fuQeV2zBfVZf67v",
      title: "Orgoglio e Pregiudizio",
      author: "Jane Austen",
      price: 12.5,
    },
    {
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuB8-FLFjhElKkTjVqnE7XY96ovQOP9rG8I_w_x7Q8t4Gdn7061c7GhU8_wy4r-huaeuM4hmYM4wLBWsrnuQKVcAoDxyVTzc4FJQBZOywQhUolOcl6-nFVQL18JhABfDLvllHuO2z7slo6smrosPSOhBo-bjFIcnD_gFz3khacjOPJOvPqH4_jGROSz8pZZySc1AtLYjUyCu-yyYU535ubmzgA7DOELpXymc_6fOFpqz5ueDXwLFdJe2E-ZACvilQjfhBllCrq_w4Y-1",
      title: "1984",
      author: "George Orwell",
      price: 10.0,
    },
    {
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBmwsxgyLlAOPr9PLXYyPgtERv5sq3a0jtZH2K6ogiL29bO_harUZqq8w9wdABhIk_B-Mp7gT4Jcr8nPCMbBS8UTxuAI4Dr1t0HK1NpsW2aL1StFaDxTdNqLpks8fmfBVHsPKZWfqEh_T67ffL3kA_Cq5Qqjcb1hsh48AODr1-_1bphW5pghcJpe3o4IYc5aAhDpPkZ4eDKT-qhHl-rLBG2dSt8HXkOtFxJ1k39VpV1JXwki_sW15GiVD6Chse1AI-SJMSTLtiuwgNa",
      title: "Il Grande Gatsby",
      author: "F. Scott Fitzgerald",
      price: 14.75,
    },
    {
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDDfDFZHgZ52W4J9bOCpXLXuKz_u1S1m7lLi5_EtwueEF67H2fgFN_y1UFo6DDVMYoFpFCyvxLUANDC4x-YxkRuIAQwyUgZkErxCJNZYG2mXttwftEBnX-w9sQ50Vr-Do6cvn0dVxfGMnRCNuQd8g9ShD92F8EPPqzOjzK2V2uwwGtIaYcI8B9DzqUjcwumq_5ngVilOxIO6cFby927K4OTwZwA6BnugCrMHXKB3vZ3XgFPf3AXVNS9bjZbZhUNfHA2LQoC7yywgqcS",
      title: "Cime Tempestose",
      author: "Emily Brontë",
      price: 11.2,
    },
    {
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuA-lLMyN6gN67-X0XA2fQAx24ACNMBPvuoHL6l0-gDKDN4-mKOrQDRbNU-5iMP-ZHQiej13B6dr3v1DOlClFFPFX09fdNOzmWvn13SogyLyoZ1zpTWTLYPHurhmMBptswY_6Zs23R2qIwBccOKwodfFy5y0e_ljv_Ju_c71Vi08_tbmTuaU4_GV0Zgr4eJQMQVuQYiSm-ntO-357Y-DX4T1F7rbLjpyK7ursU2TW5XLTzesFTkCg95Cb8L_V3y3v26snTggI2ZGcIW7",
      title: "Moby Dick",
      author: "Herman Melville",
      price: 13.0,
    },
  ];

  const { handleAddToCart } = useCartActions();

  // Handler for add to cart (calls backend if logged in)
  const handleAddToCartAdapter = async (product: Product) => {
    setLoading(true);
    await handleAddToCart({
      productId: Number(product.id),
      titolo: product.titolo,
      prezzo: product.prezzo,
      immagine: product.immagine || "",
      quantity: 1,
    });
    setLoading(false);
  };

  // Add handleProductClick function to handle navigation or selection
  const handleProductClick = (id: string) => {
    // Implement navigation or selection logic here
    // Example: router.push(`/product/${id}`);
  };

  // Filter results by search query
  const filteredResults = search.trim()
    ? results.filter(
        (r) =>
          r.title.toLowerCase().includes(search.toLowerCase()) ||
          r.author.toLowerCase().includes(search.toLowerCase())
      )
    : results;

  const subcategories = React.useMemo(
    () =>
      filters.category
        ? categories.filter(
            (cat: Category) => cat.parentId === filters.category
          )
        : [],
    [categories, filters.category]
  );

  return (
    <div className="flex flex-1 justify-center py-5 px-2 md:px-10 bg-[#f8fbfa] min-h-screen">
      <div className="layout-content-container flex flex-col max-w-5xl w-full flex-1">
        <div className="px-2 md:px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SearchBar
                value={filters.search}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, search: e.target.value }))
                }
                onSubmit={handleApplyFilters}
                placeholder="Cerca libri, autori, ecc..."
              />
            </div>
            {search && (
              <button
                onClick={handleClear}
                className="ml-2 p-2 rounded-full bg-[#e8f2ec] hover:bg-[#d2e7db] text-[#51946b] transition-colors"
                aria-label="Cancella ricerca"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24px"
                  height="24px"
                  fill="currentColor"
                  viewBox="0 0 256 256"
                >
                  <path d="M165.66,101.66,139.31,128l26.35,26.34a8,8,0,0,1-11.32,11.32L128,139.31l-26.34,26.35a8,8,0,0,1-11.32-11.32L116.69,128,90.34,101.66a8,8,0,0,1,11.32-11.32L128,116.69l26.34-26.35a8,8,0,0,1,11.32,11.32ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"></path>
                </svg>
              </button>
            )}
          </div>
        </div>
        {/* Filtri */}
        <div className="flex gap-3 p-3 overflow-x-auto items-center">
          {/* Categoria */}
          <select
            className="h-10 rounded-lg bg-[#e8f2ec] px-3 py-2 leading-[1.5] text-[#0e1a13] text-sm font-medium"
            value={filters.category ?? ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                category: e.target.value ? Number(e.target.value) : null,
                subcategory: null,
              }))
            }
          >
            <option value="">Categoria</option>
            {parentCategories.map((cat: Category) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {/* Sottocategoria */}
          <select
            className="h-10 rounded-lg bg-[#e8f2ec] px-3 py-2 leading-[1.5] text-[#0e1a13] text-sm font-medium"
            value={filters.subcategory ?? ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                subcategory: e.target.value ? Number(e.target.value) : null,
              }))
            }
            disabled={!filters.category}
          >
            <option value="">Sottocategoria</option>
            {subcategories.map((cat: Category) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {/* Range prezzo */}
          <input
            type="number"
            className="h-8 w-24 rounded-lg bg-[#e8f2ec] px-3 text-[#0e1a13] text-sm font-medium"
            placeholder="Prezzo min"
            value={filters.minPrice}
            onChange={(e) =>
              setFilters((f) => ({ ...f, minPrice: e.target.value }))
            }
            min={0}
          />
          <span className="text-[#0e1a13]">-</span>
          <input
            type="number"
            className="h-8 w-24 rounded-lg bg-[#e8f2ec] px-3 text-[#0e1a13] text-sm font-medium"
            placeholder="Prezzo max"
            value={filters.maxPrice}
            onChange={(e) =>
              setFilters((f) => ({ ...f, maxPrice: e.target.value }))
            }
            min={0}
          />
          <button
            onClick={handleApplyFilters}
            className="ml-2 px-4 py-2 rounded-lg bg-[#51946b] text-white font-semibold hover:bg-[#3a7d5a] transition-colors"
          >
            Applica filtri
          </button>
          <button
            onClick={() => {
              setFilters({
                search: "",
                category: null,
                subcategory: null,
                minPrice: "",
                maxPrice: "",
              });
              setLoading(true);
              fetchLatestProducts(50)
                .then((data) => setProducts(data.data || data))
                .finally(() => setLoading(false));
            }}
            className="ml-2 px-4 py-2 rounded-lg bg-[#e8f2ec] text-[#51946b] font-semibold hover:bg-[#d2e7db] transition-colors border border-[#51946b]"
          >
            Azzera filtri
          </button>
        </div>
        <h2 className="text-[#0e1a13] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
          Risultati
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4">
          {products.length === 0 ? (
            <div className="col-span-full text-center text-[#51946b] py-8 text-lg">
              Nessun risultato trovato.
            </div>
          ) : (
            products.map((r, i) => (
              <div
                key={r.id || i}
                onClick={async () => {
                  setLoading(true);
                  await router.push(`/product/${r.id}`);
                }}
                className="cursor-pointer"
              >
                {/* Pass the whole product object as 'product' prop to SearchResultCard */}
                <SearchResultCard
                  key={r.id}
                  product={r}
                  onClick={handleProductClick}
                  onAddToCart={handleAddToCartAdapter}
                />
              </div>
            ))
          )}
        </div>
        {/* Bottone Carica altri */}
        {products.length > 0 &&
          !filters.search &&
          !filters.minPrice &&
          !filters.maxPrice &&
          !filters.category &&
          !filters.subcategory && (
            <div className="flex justify-center pb-8">
              <button
                onClick={async () => {
                  setLoading(true);
                  const nextCount = loadCount + 1;
                  setLoadCount(nextCount);
                  // Chiedi last (nextCount * 50) prodotti
                  const params: ProductQueryParams = {
                    limit: nextCount * 50,
                    sortBy: "createdAt",
                    sortOrder: "desc",
                  };
                  const res = await axios.get<{ data: { data: Product[] } }>(
                    `${API_URL}/products`,
                    {
                      params,
                    }
                  );
                  const allProducts = Array.isArray(res.data.data)
                    ? res.data.data
                    : res.data.data.data;
                  const newProducts = allProducts.slice(products.length);
                  setProducts((prev) => [...prev, ...newProducts]);
                  setLoading(false);
                }}
                className="mt-2 px-6 py-2 rounded-lg bg-[#51946b] text-white font-semibold hover:bg-[#3a7d5a] transition-colors shadow"
                disabled={false}
              >
                Carica altri
              </button>
            </div>
          )}
      </div>
    </div>
  );
}

type SearchResult = {
  image: string;
  title: string;
  author: string;
  price: number;
};
