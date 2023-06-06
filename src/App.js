import React from "react";
import Header from "./components/sections/Header";
import Navbar from "./components/Navbar";
import AboutMe from "./components/sections/AboutMe";

const App = () => {
	return (
		<div className="app">
			<Header />
			<Navbar />
			<AboutMe />
		</div>
	);
};

export default App;
