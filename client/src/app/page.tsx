"use client";

import React, { useState } from "react";
import Image from "next/image";
import ProductCard from "@/components/layout/ProductCard";
import SearchBar from "@/components/layout/SearchBar";
import { useRouter } from "next/navigation";

export default function Home() {
  // Dummy handler for add to cart (replace with real logic)
  const handleAddToCart = (product: { title: string }) => {
    // You can use a toast or Redux action here
    alert(`Aggiunto al carrello: ${product.title}`);
  };
  // State for search bar
  const [search, setSearch] = useState("");
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };
  const router = useRouter();
  const handleSearchSubmit = () => {
    if (search.trim()) {
      router.push(`/search?q=${encodeURIComponent(search)}`);
    }
  };
  return (
    <div className="flex flex-1 justify-center py-8 px-2 md:px-10 bg-[#f8fbfa] min-h-screen">
      <div className="layout-content-container flex flex-col max-w-5xl w-full flex-1">
        {/* Search Bar */}
        <div className="px-2 md:px-4 py-3">
          <SearchBar
            value={search}
            onChange={handleSearchChange}
            onSubmit={handleSearchSubmit}
            placeholder="Cerca libri, cancelleria e altro..."
          />
        </div>
        {/* Featured Products */}
        <h2 className="text-[#0e1a13] text-xl md:text-2xl font-bold leading-tight tracking-[-0.015em] px-2 md:px-4 pb-3 pt-5">
          Prodotti in evidenza
        </h2>
        <div className="flex overflow-x-auto no-scrollbar">
          <div className="flex items-stretch p-2 md:p-4 gap-3">
            <ProductCard
              image="https://lh3.googleusercontent.com/aida-public/AB6AXuB2CT9lF0ZaSY14vKLy9Meb9o-vbeKTRDhff1CYlQZsfdy5JWijP6x4OzpfYGYZHFhmq11QiUgQC7KLSSnLX-9EwS7y6YPkLUCJ_jEJSZ5CaA-Kgat-9JuYIE7_sHjFvvKEGLbqs4Bxi5ckDdNUiZgiyY-6r9BMecpD7BzMKAjfRTm8Xo-AAwHGbu_4OlDLXcHQxQ1lwIvGicewgvfjRxKazvof9vKd7Xbi6LqMV8l4QOt_3fd3T8vmnaNNht0RFFTLrfkm9uO2CaXL"
              title="The Secret Garden"
              category="Romanzo"
              price={12.99}
              onAddToCart={() =>
                handleAddToCart({ title: "The Secret Garden" })
              }
            />
            <ProductCard
              image="https://lh3.googleusercontent.com/aida-public/AB6AXuCR4xO8tpYd9ig_z7QfeFlwe5S-DGPDHgqVW00teKlKKGiZ3ZzMsJpHglfm9fN6lXPMAHNB08aBOgZezobOfPPo6sSf49Beocnyw_urdjuDfoGP_ui8VrdVSPniZnm06R71f5IIQGFvA6U1bYD6fQEudoo9obSvOzFYk29ogCvWNBEX7bvMvX1kTjz40PbrlD52QNi7g4XZCqQptvLmzTttMNE5E3HKdOT0HUnwtHsSaWKn3rYdM2Z8MOfLkkVNz8QM5QleDx5P-SYP"
              title="Leather-bound Journal"
              category="Cartoleria"
              price={8.5}
              onAddToCart={() =>
                handleAddToCart({ title: "Leather-bound Journal" })
              }
            />
            <ProductCard
              image="https://lh3.googleusercontent.com/aida-public/AB6AXuAwqhFLDqdgub9OYZT5WM0Wo7Mz9pn-uqQJozRNXZ_wOAwIAW3T-Uoowikzy1miL3PK_xAtbOIIMCtQFHkdRtJIvvxslrFV0VnSGX56wBx736OQy4LTv9vSLGqPxIaHuDZF9WxuCu0KE_CcFk0UbjpfY3FiN1odMii7Vk6NMwqrSMEYT7tlc-L1FZCw_4OcdZ7nT_yHPDMzOiEZsGt0uxeIOc3A_a-CoEhVJg2BTm8sciUZfhWQo5TSIrf6JMMS0B4gL7EruO6Ubm5X"
              title="Calligraphy Pen Set"
              category="Cartoleria"
              price={15.0}
              onAddToCart={() =>
                handleAddToCart({ title: "Calligraphy Pen Set" })
              }
            />
            <ProductCard
              image="https://lh3.googleusercontent.com/aida-public/AB6AXuCwDhA6xfQM9ZgAgxN6yw8S7wVKs5sSeK4D46RYlRFyhlnxFe1fSmYd7VtVjIB0sOXB7UeJlTTYB6BynGq221uaYeAX3gxdpoJBF4dRH8ti9c38vm0fZTfIaMPQCBW5wqJli8cSuMw_3eFE3lh4S_1Vz-jZZWRMcZWTkNcpnAGkbZhncacqxVkYrm0mWuXoVzuasDFk9uooWnd6ceziiJYZtldOsd9vk6PqefIZglRjw6SFjFSzI212wHJPcBLhyjeFFIEGzqpcMfrY"
              title="Watercolor Paint Set"
              category="Colori"
              price={9.99}
              onAddToCart={() =>
                handleAddToCart({ title: "Watercolor Paint Set" })
              }
            />
          </div>
        </div>
        {/* New Arrivals */}
        <h2 className="text-[#0e1a13] text-xl md:text-2xl font-bold leading-tight tracking-[-0.015em] px-2 md:px-4 pb-3 pt-5">
          Novità
        </h2>
        <div className="flex overflow-x-auto no-scrollbar">
          <div className="flex items-stretch p-2 md:p-4 gap-3">
            <ProductCard
              image="https://lh3.googleusercontent.com/aida-public/AB6AXuC1s5J7HlLkp_fgoCp2uw_m9cOF5pkXNfctEEfCokeAXZ52Ry05nAZA-VViKcm9dOWpNnMlAbip2Zv40SRPRgYLIbteL1Mpb1VOH_hrAzaYfoXqiZIBB7A3YDaGhx2FGtCPVHjpp3guIf9wM9cj0QfLcAn2gQFwZ2kWPr5cQ8KrN4dCbGkl1C0CEfU4TQgP_nDLUjnmnfPqg3rcEY1ePFytINhl3TPFZJzP3z40kg9TpC7GaggE7zJL8Pz3SL0LI72rkyeG4iEDE2Lg"
              title="The Midnight Library"
              category="Romanzo"
              price={14.99}
              onAddToCart={() =>
                handleAddToCart({ title: "The Midnight Library" })
              }
            />
            <ProductCard
              image="https://lh3.googleusercontent.com/aida-public/AB6AXuB5qblvttfr9NqFaIhZoiAv3SDspv84_1xBj12nAByzp9Jk5iOWB_twV3LCc7Q8WQZew75tG72zSaGrxfaT7fhJQ8wMyHQMS-_0Lyj3inp5VhD7brkmYGCWZYGMpXtS0YD6l4CcplbXuf8nAT-R_DGk_IgYCqTbfIyEVOjIo8qn3qPXFzhiwCOALFGlRFPbRING4htB7ro7DqDc5MvBurkL0cvU0U2lAuPXijlaPkbXhuiR9Oxb3AUy5Hlc-JDQZUtalv7YxQuAsZjA"
              title="Atomic Habits"
              category="Saggistica"
              price={17.5}
              onAddToCart={() => handleAddToCart({ title: "Atomic Habits" })}
            />
            <ProductCard
              image="https://lh3.googleusercontent.com/aida-public/AB6AXuDr45ZNLNbe4aqZTRds0_A33HuAYnykcQJLcTqlrRHQGTEvnmYcB_33suA_aAHilrR9ZFBsZguRxcYyRxDF7oKv_NMX5kVWxi50Uwtt8CwFVDSxsgusbe6_HGhLo-aSHvxmHiQU5xGk2OmpoReu1rIJSOt9XP8RLRHMzUYWGD8qCtoDD1_THRRomaZZT7BbjdRApqGi9GJKJ84OchrOBZPzAXxwxHWc60CY3TqfjOxX6gGvsnCDhn08R4eQHmfvdiHdvC9p4VVy8ZRQ"
              title="The Silent Patient"
              category="Thriller"
              price={13.99}
              onAddToCart={() =>
                handleAddToCart({ title: "The Silent Patient" })
              }
            />
            <ProductCard
              image="https://lh3.googleusercontent.com/aida-public/AB6AXuCvZvd-V6NdcIZB9mAYgjarNu2i0gU4jnArZc9ofibz_SXDmMdijRieOR0SlGh5aR678_C4gsBPxKYIJsh2hLlM-0ocCZ0SUo6jC5iwt2iYdaV_yM8WL0g9xKFIICecFoJjMqetgIksTdSXGTwySrz0bNENCyXXgWisDVvSuGlTGphJkFWC1uTUpW3lR4vRzpi3gQBhCg_fmds5vXrtdQx1L4-yuJ2oh9EaSTKM20JGW6DQTlUs7ILiwMXnCKCf6GT6dsu7oGY1V3XN"
              title="Where the Crawdads Sing"
              category="Romanzo"
              price={16.0}
              onAddToCart={() =>
                handleAddToCart({ title: "Where the Crawdads Sing" })
              }
            />
          </div>
        </div>
        {/* Best Sellers */}
        <h2 className="text-[#0e1a13] text-xl md:text-2xl font-bold leading-tight tracking-[-0.015em] px-2 md:px-4 pb-3 pt-5">
          Best Seller
        </h2>
        <div className="flex overflow-x-auto no-scrollbar">
          <div className="flex items-stretch p-2 md:p-4 gap-3">
            <ProductCard
              image="https://lh3.googleusercontent.com/aida-public/AB6AXuACdOUws_y162aZJT-SEhZAFlmPM5SJPaBQUFfa1MQ3YRHPXkYNgu5YnU-q9QDUaUB--IT8cmMjVZDcQND8_kbOmAJpLRdaDBZ7EeC2_nTFPwjMw6KAr7Z1mB06JZB74OctKXb4rDzbXpgTxFnXnIZ7tEjawrB7AVLovLAcVRPXxMcFfvsjzea2XZMzlLvf5SaUHvh1cyAyWw293lQ5Txjx-KS3OrmxiKTxaoEm0q5QwB2bG7JQvKMbwy9zQK_l7tXqSBY7oQxBmIHJ"
              title="The Alchemist"
              category="Romanzo"
              price={11.99}
              onAddToCart={() => handleAddToCart({ title: "The Alchemist" })}
            />
            <ProductCard
              image="https://lh3.googleusercontent.com/aida-public/AB6AXuCR8KYJq7YSl9u9zbGf2qMZpPg8WE9ZUZliVdxXefn01OiMzzAjTIDGsG9Nga_aW6Kxso4jM4jYbBRrKZCC5yDOUYVKb7GJyOc9bk7etKAbShQF_Y7dNsCPAKyE_Wyvf_VM9QE8fQpYAATdWeO6c-9U_aStR8He6VkfKkZwlR2lFcinIF4oVRjmoiG6nZRjkHormgDHsjzNBBZkn-xGvEEprIBp1gZQ_Q8bV5vv2TwGmmaqAqJTK4pTLXbeACFgPB11KrQFPOTEZkBp"
              title="Sapiens"
              category="Saggistica"
              price={19.5}
              onAddToCart={() => handleAddToCart({ title: "Sapiens" })}
            />
            <ProductCard
              image="https://lh3.googleusercontent.com/aida-public/AB6AXuA4x1-OLHtm-WyBw6MBh18l30X8rl_tsEgfEdrNyb83ZNLj6tQdDDwvgMT5_PoOKVKJBpZQJD6Ficx71eyw7Ox_N2iBDHU2ugsLKbkHBdZIUUTUSotQaoFjcbDRqYab-skskAVNOk6p5svQk4W9AjcWSAgunlSRq0Gv9oWay_8JmOolUhJYU028apk1UnAF9l8QV4PaeR_nO4F_D5fgAf2FmM7XZeq6uMpk4Ba_t7BTjXoP3YwQrG3LqVr460alqsuWHkxrQEfA-uku"
              title="Educated"
              category="Biografia"
              price={13.0}
              onAddToCart={() => handleAddToCart({ title: "Educated" })}
            />
            <ProductCard
              image="https://lh3.googleusercontent.com/aida-public/AB6AXuC8j6dKsQqhc9W47hyMIZM48FLEgyao9Gn-NRUp9HRb2cd-qGMM3OrBbCEUR4OMJdzanzS4AXA4bmSzkiY6c0fBnYv4WVwYTZWh7E1qikUZZyNXZFOUGz49xzfOQPAv6bSQjF_hfwfz4a3wKBBmOS_ByMx1ehdUc60ad_jak2oVwuc6Z5qJ0V0HGwg1V08XHXpCOSkbBf3_rO7CMhg3kxsKyBKiOQx5SM1HTbpmsiPZTHjoYD2wmpXbKyjHX5bKvgMgtusa4O0aSr5r"
              title="Becoming"
              category="Biografia"
              price={15.99}
              onAddToCart={() => handleAddToCart({ title: "Becoming" })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
