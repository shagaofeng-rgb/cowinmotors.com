"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FinderForm() {
  const router = useRouter();
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");

  return (
    <form
      className="finder-form"
      id="finderForm"
      onSubmit={(event) => {
        event.preventDefault();
        const params = new URLSearchParams();
        if (year) params.set("year", year);
        if (make) params.set("make", make);
        if (type === "Automotive Lighting") params.set("category", "headlights");
        if (type === "Tail Lights") params.set("category", "tail-lights");
        if (type === "Exhaust Systems") params.set("category", "exhaust");
        if (type === "Body Kits") params.set("category", "body-kits");
        if (type === "Wheels") params.set("category", "wheels");
        if (search) params.set("q", search);
        router.push(`/products${params.toString() ? `?${params}` : ""}`);
      }}
    >
      <label>
        Year
        <select id="yearSelect" value={year} onChange={(event) => setYear(event.target.value)}>
          <option value="">Any year</option>
          {["2025", "2024", "2022", "2021", "2020", "2018", "2016", "2015", "2013", "2011"].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </label>
      <label>
        Make
        <select id="makeSelect" value={make} onChange={(event) => setMake(event.target.value)}>
          <option value="">Any make</option>
          {["BMW", "Mercedes-Benz", "Audi", "Porsche", "Volkswagen", "Tesla", "Ford", "Toyota", "Land Rover"].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </label>
      <label>
        Product Type
        <select id="typeSelect" value={type} onChange={(event) => setType(event.target.value)}>
          <option value="">Any part</option>
          <option value="Automotive Lighting">Automotive Lighting</option>
          <option value="Tail Lights">Tail Lights</option>
          <option value="Exhaust Systems">Exhaust Systems</option>
          <option value="Wheels">Wheels</option>
          <option value="Body Kits">Body Kits</option>
        </select>
      </label>
      <label>
        Search
        <input id="searchInput" type="search" placeholder="SKU, model, engine, feature" value={search} onChange={(event) => setSearch(event.target.value)} />
      </label>
      <button type="submit">Find parts</button>
    </form>
  );
}
