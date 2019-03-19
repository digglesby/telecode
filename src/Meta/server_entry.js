import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import Routes from '../Routes.js'

module.exports = {
	renderPage:function (url){

		return renderToStaticMarkup(
			<StaticRouter context={{}} location={url}>
	      {Routes}
	    </StaticRouter>
		);
	}
}
