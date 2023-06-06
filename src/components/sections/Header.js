import React from "react";
const Header = () => {
	return (
		<section id="introduction" className="introduction section is-medium">
			<div className="introduction-container container">
				<div className="columns">
					<div className="column is-12">
						<div className="content" style={{ textAlign: "center" }}>
							<h3>Hey! I'm</h3>
							<h1 className="title">
								<span className="blue-text">Ann Song</span>.
							</h1>
							<p className="description">A Student at Choate Rosemary Hall</p>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

export default Header;
