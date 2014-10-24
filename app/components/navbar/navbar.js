/** @jsx React.DOM */
/**
 * Copyright (c) 2014, Tidepool Project
 *
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the associated License, which is identical to the BSD 2-Clause
 * License as published by the Open Source Initiative at opensource.org.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the License for more details.
 *
 * You should have received a copy of the License along with this program; if
 * not, you can obtain one from Tidepool Project at tidepool.org.
 */

var React = require('react');
var _ = require('lodash');
var cx = require('react/lib/cx');

var personUtils = require('../../core/personutils');

var AuthActions = require('../../actions/AuthActions');
var AuthStore = require('../../stores/AuthStore');
var GroupStore = require('../../stores/GroupStore');

var logoSrc = require('./images/blip-logo-80x80.png');

var Navbar = React.createClass({
  propTypes: {
    version: React.PropTypes.string,
    currentPage: React.PropTypes.string,
    patientId: React.PropTypes.string,
    getUploadUrl: React.PropTypes.func,
    trackMetric: React.PropTypes.func.isRequired
  },

  getInitialState: function() {
    return this.getStateFromStores();
  },

  getStateFromStores: function() {
    return {
      user: AuthStore.getLoggedInUser(),
      patient: GroupStore.get(this.props.patientId)
    };
  },

  componentDidMount: function() {
    AuthStore.addChangeListener(this.handleStoreChange);
    GroupStore.addChangeListener(this.handleStoreChange);
  },

  componentWillUnmount: function() {
    AuthStore.removeChangeListener(this.handleStoreChange);
    GroupStore.removeChangeListener(this.handleStoreChange);
  },

  componentWillReceiveProps: function(nextProps) {
    this.setState({
      patient: GroupStore.get(nextProps.patientId)
    });
  },

  handleStoreChange: function() {
    this.setState(this.getStateFromStores());
  },

  render: function() {
    return (
      <div className="Navbar">
        {this.renderLogoSection()}
        {this.renderPatientSection()}
        {this.renderMenuSection()}
      </div>
    );
  },

  renderLogoSection: function() {
    return (
      <div className="Navbar-logoSection">
        {this.renderLogo()}
        {this.renderVersion()}
      </div>
    );
  },

  renderLogo: function() {
    var self = this;
    var handleClick = function() {
      self.props.trackMetric('Clicked Navbar Logo');
    };

    return (
      <a
        href="#/"
        className="Navbar-logo"
        onClick={handleClick}>
      </a>
    );
  },

  renderVersion: function() {
    var version = this.props.version;
    if (version) {
      version = 'v' + version;
      return <div className="Navbar-version" ref="version">{version}</div>;
    }
    return null;
  },

  renderPatientSection: function() {
    var patient = this.state.patient;

    if (_.isEmpty(patient)) {
      return <div className="Navbar-patientSection"></div>;
    }

    var displayName = this.getPatientDisplayName();
    var patientUrl = this.getPatientUrl();
    var uploadLink = this.renderUploadLink();
    var shareLink = this.renderShareLink();
    var self = this;
    var handleClick = function() {
      self.props.trackMetric('Clicked Navbar View Profile');
    };

    return (
      <div className="Navbar-patientSection" ref="patient">
        <a href={patientUrl} onClick={handleClick} className="Navbar-button--blueBg Navbar-button Navbar-button--withLeftLabelAndArrow">
          <div className="Navbar-label Navbar-label--left Navbar-label--withArrow">
            <span className="Navbar-patientName">{displayName}</span>
          </div>
        </a>
        <div className="Navbar-patientPicture"></div>
        <div>
          {uploadLink}
          {shareLink}
          <div className="clear"></div>
        </div>
      </div>
    );
  },

  renderUploadLink: function() {
    var noLink = <div className="Navbar-uploadButton"></div>;

    if (!this.isRootOrAdmin()) {
      return noLink;
    }

    var uploadUrl = this.props.getUploadUrl();
    if (!uploadUrl) {
      return noLink;
    }

    var self = this;
    var handleClick = function(e) {
      if (e) {
        e.preventDefault();
      }
      window.open(uploadUrl, '_blank');
      self.props.trackMetric('Clicked Navbar Upload Data');
    };

    return (
      <a href="" onClick={handleClick} className="Navbar-button Navbar-button--patient Navbar-button--blue Navbar-uploadButton">
        <i className="Navbar-icon icon-upload-data"></i>
        <span className="Navbar-uploadLabel">Upload</span>
      </a>
    );
  },

  renderShareLink: function() {
    var noLink = <div className="Navbar-shareButton"></div>;
    var self = this;

    if (!this.isRootOrAdmin()) {
      return noLink;
    }

    var patientUrl = this.getPatientUrl();

    var handleClick = function() {
      self.props.trackMetric('Clicked Navbar Share');
    };

    return (
      <a href={patientUrl} onClick={handleClick} className="Navbar-button Navbar-button--patient Navbar-button--blue Navbar-uploadButton">
        <i className="Navbar-icon icon-share-data"></i>
        <span className="Navbar-shareLabel">Share</span>
      </a>
    );
  },

  renderMenuSection: function() {
    var user = this.state.user;

    if (_.isEmpty(user)) {
      return <div className="Navbar-menuSection"></div>;
    }

    var displayName = this.getUserDisplayName();
    var self = this;
    var handleClickUser = function() {
      self.props.trackMetric('Clicked Navbar Logged In User');
    };

    var handleCareteam = function() {
      self.props.trackMetric('Clicked Navbar CareTeam');
    };

    var patientsClasses = cx({
      'Navbar-button': true,
      'Navbar-selected': this.props.currentPage && this.props.currentPage === 'patients'
    });

    var profileClasses = cx({
      'Navbar-button': true,
      'Navbar-button--withLeftLabelAndArrow': true,
      'Navbar-selected': this.props.currentPage && this.props.currentPage === 'profile'
    });

    return (
      <ul className="Navbar-menuSection" ref="user">
        <li className="Navbar-menuItem">
          <a href="#/profile" title="Account" onClick={handleClickUser} className={profileClasses}>
            <div className="Navbar-label Navbar-label--left Navbar-label--withArrow">
              <span className="Navbar-loggedInAs">{'Logged in as '}</span>
              <span className="Navbar-userName" ref="userFullName">{displayName}</span>
            </div>
            <i className="Navbar-icon icon-profile"></i>
          </a>
        </li>
        <li className="Navbar-menuItem">
          <a href="#/" title="Care Team" onClick={this.handleCareteam} className={patientsClasses} ref="careteam"><i className="Navbar-icon icon-careteam"></i></a>
        </li>
        <li className="Navbar-menuItem">
          <a href="" title="Logout" onClick={this.handleLogout} className="Navbar-button" ref="logout"><i className="Navbar-icon icon-logout"></i></a>
        </li>
      </ul>
    );
  },

  getUserDisplayName: function() {
    return personUtils.fullName(this.state.user);
  },

  getPatientDisplayName: function() {
    return personUtils.patientFullName(this.state.patient);
  },

  getPatientUrl: function() {
    var patient = this.state.patient;
    if (!patient) {
      return;
    }
    return '#/patients/' + patient.userid;
  },

  isRootOrAdmin: function() {
    return personUtils.hasPermissions('root', this.state.patient) ||
           personUtils.hasPermissions('admin', this.state.patient);
  },

  handleLogout: function(e) {
    if (e) {
      e.preventDefault();
    }

    AuthActions.logout();
  }
});

module.exports = Navbar;
