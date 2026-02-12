import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./styles.css";

import Layout from "./Layout.jsx";
import CocktailList from "./components/CocktailList.jsx";
import AddCocktail from "./components/AddCocktail.jsx";

import CocktailDetail from "./pages/CocktailDetail.jsx";
import GarnishDetail from "./pages/GarnishDetail.jsx";
import CocktailsByGarnish from "./pages/CocktailsByGarnish.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<CocktailList />} />
          <Route path="/cocktail/:id" element={<CocktailDetail />} />
          <Route path="/add" element={<AddCocktail />} />
        </Route>

        <Route path="/garnishes/:id" element={<GarnishDetail />} />
        <Route path="/garnishes/:id/cocktails" element={<CocktailsByGarnish />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
