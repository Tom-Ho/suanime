import React, { Component } from 'react'
import { render } from 'react-dom'
import { HashRouter as Router, NavLink, Route, Switch, hashHistory } from 'react-router-dom'
import SuTitlebar from 'su-titlebar'
import { remote } from 'electron'
require('./styles/main.sass')

//components imports
import SideNav from './components/SideNav/SideNav.jsx'
// import HomeContent from './components/HomeContent/HomeContent.jsx'
// import DownloadsPage from './components/DownloadsPage/DownloadsContainer.jsx'
// import WatchPage from './components/WatchPage/WatchContainer.jsx'
// import SearchPage from './components/SearchPage/SearchContainer.jsx'
// import InfoPage from './components/InfoPage/InfoContainer.jsx'
// import IntegrationPage from './components/IntegrationPage/IntegrationContainer.jsx'

import { HomeContent, DownloadsPage, WatchPage, SearchPage, InfoPage, IntegrationPage, SettingsPage, AboutPage, SeasonalPage } from './routes.js'
export default class App extends Component {
	render() {
		return (
			<Router>
				<div className="wrapper">
					<div className="resizable-line"/>
					<SuTitlebar remote={remote}/>		
					<SideNav/>
					<div className="content">
						<Switch>
							<Route exact path="/" component={HomeContent}/>
							<Route path="/search" component={SearchPage}/>
							<Route path="/seasonal/:year?/:season?/:type?/:sort?" component={SeasonalPage}/>
							<Route path="/downloads" component={DownloadsPage}/>
							<Route path="/info/:animeName?/:slug?/:animeID?/:malID?" component={InfoPage}/>
							<Route path="/integration" component={IntegrationPage}/>
							<Route path="/watch/:animeName?/:epNumber?/:posterImg?/:slug?" component={WatchPage}/>
							<Route path="/settings" component={SettingsPage}/>
							<Route path="/about" component={AboutPage}/>
						</Switch>
					</div>
				</div>
			</Router>
		)
	}
}
