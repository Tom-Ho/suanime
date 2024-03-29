import React, { Component } from 'react'
import { connect } from 'react-redux'
import { sidenavtoggle } from '../../util/sidenavtoggle'

const SideNavToggle = (props) => {
    return (
      <div className="side-nav-toggle" onClick={sidenavtoggle} style={{left: props.toggleLeft}}>
        <i className="material-icons">{props.toggleIcon}</i>
      </div>
    )
}

export default SideNavToggle