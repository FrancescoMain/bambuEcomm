"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import SearchBar from "@/components/layout/SearchBar";
import SearchResultCard from "@/components/layout/SearchResultCard";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [search, setSearch] = React.useState(query);
  const router = useRouter();

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

  // Handler per aggiungi al carrello (dummy)
  const handleAddToCart = (title: string) => {
    alert(`Aggiunto al carrello: ${title}`);
  };

  // Filter results by search query
  const filteredResults = search.trim()
    ? results.filter(
        (r) =>
          r.title.toLowerCase().includes(search.toLowerCase()) ||
          r.author.toLowerCase().includes(search.toLowerCase())
      )
    : results;

  // --- SUSPENSE WRAP ONLY THE COMPONENT THAT USES useSearchParams ---
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InnerSearchPage
        search={search}
        setSearch={setSearch}
        handleSearchSubmit={handleSearchSubmit}
        handleClear={handleClear}
        filteredResults={filteredResults}
        handleAddToCart={handleAddToCart}
      />
    </Suspense>
  );
}

type SearchResult = {
  image: string;
  title: string;
  author: string;
  price: number;
};

function InnerSearchPage({
  search,
  setSearch,
  handleSearchSubmit,
  handleClear,
  filteredResults,
  handleAddToCart,
}: {
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  handleSearchSubmit: () => void;
  handleClear: () => void;
  filteredResults: SearchResult[];
  handleAddToCart: (title: string) => void;
}) {
  return (
    <div className="flex flex-1 justify-center py-5 px-2 md:px-10 bg-[#f8fbfa] min-h-screen">
      <div className="layout-content-container flex flex-col max-w-5xl w-full flex-1">
        <div className="px-2 md:px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SearchBar
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onSubmit={handleSearchSubmit}
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
        <div className="flex gap-3 p-3 overflow-x-auto">
          <button className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-[#e8f2ec] pl-4 pr-2">
            <p className="text-[#0e1a13] text-sm font-medium leading-normal">
              Prezzo
            </p>
            <div
              className="text-[#0e1a13]"
              data-icon="CaretDown"
              data-size="20px"
              data-weight="regular"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20px"
                height="20px"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
              </svg>
            </div>
          </button>
          <button className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-[#e8f2ec] pl-4 pr-2">
            <p className="text-[#0e1a13] text-sm font-medium leading-normal">
              Disponibilità
            </p>
            <div
              className="text-[#0e1a13]"
              data-icon="CaretDown"
              data-size="20px"
              data-weight="regular"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20px"
                height="20px"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
              </svg>
            </div>
          </button>
          <button className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-[#e8f2ec] pl-4 pr-2">
            <p className="text-[#0e1a13] text-sm font-medium leading-normal">
              Autore
            </p>
            <div
              className="text-[#0e1a13]"
              data-icon="CaretDown"
              data-size="20px"
              data-weight="regular"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20px"
                height="20px"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
              </svg>
            </div>
          </button>
          <button className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-[#e8f2ec] pl-4 pr-2">
            <p className="text-[#0e1a13] text-sm font-medium leading-normal">
              Editore
            </p>
            <div
              className="text-[#0e1a13]"
              data-icon="CaretDown"
              data-size="20px"
              data-weight="regular"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20px"
                height="20px"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
              </svg>
            </div>
          </button>
          <button className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-[#e8f2ec] pl-4 pr-2">
            <p className="text-[#0e1a13] text-sm font-medium leading-normal">
              Genere
            </p>
            <div
              className="text-[#0e1a13]"
              data-icon="CaretDown"
              data-size="20px"
              data-weight="regular"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20px"
                height="20px"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
              </svg>
            </div>
          </button>
        </div>
        <h2 className="text-[#0e1a13] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
          Risultati
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
          {filteredResults.length === 0 ? (
            <div className="col-span-full text-center text-[#51946b] py-8 text-lg">
              Nessun risultato trovato.
            </div>
          ) : (
            filteredResults.map((r, i) => (
              <SearchResultCard
                key={i}
                image={r.image}
                title={r.title}
                author={r.author}
                price={r.price}
                onAddToCart={() => handleAddToCart(r.title)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
