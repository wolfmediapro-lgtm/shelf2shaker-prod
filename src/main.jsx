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
import About from "./pages/About.jsx";
import Faq from "./pages/Faq.jsx";
import Support from "./pages/Support.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<CocktailList />} />
          <Route path="/cocktail/:id" element={<CocktailDetail />} />
          <Route path="/add" element={<AddCocktail />} />
        
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/support" element={<Support />} />
</Route>

        <Route path="/garnishes/:id" element={<GarnishDetail />} />
        <Route path="/garnishes/:id/cocktails" element={<CocktailsByGarnish />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
